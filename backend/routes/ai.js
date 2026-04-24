const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../db');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid response from OpenRouter API');
  }

  return data.choices[0].message.content;
}

// POST /api/ai/optimize-schedule
router.post('/optimize-schedule', async (req, res) => {
  try {
    const { location_id, start_date, end_date } = req.body;

    // Fetch relevant data
    const employees = await pool.query(`
      SELECT e.id, e.first_name, e.last_name, e.position, e.department, e.hourly_rate
      FROM employees e
      WHERE e.status = 'active' AND ($1::INTEGER IS NULL OR e.location_id = $1)
    `, [location_id || null]);

    const availability = await pool.query(`
      SELECT a.employee_id, a.day_of_week, a.start_time, a.end_time, a.is_available
      FROM availability a
      JOIN employees e ON a.employee_id = e.id
      WHERE e.status = 'active' AND ($1::INTEGER IS NULL OR e.location_id = $1)
    `, [location_id || null]);

    const forecasts = await pool.query(`
      SELECT f.forecast_date, f.hour, f.predicted_demand
      FROM demand_forecasts f
      WHERE ($1::INTEGER IS NULL OR f.location_id = $1)
        AND f.forecast_date >= COALESCE($2::DATE, CURRENT_DATE)
        AND f.forecast_date <= COALESCE($3::DATE, CURRENT_DATE + INTERVAL '7 days')
    `, [location_id || null, start_date || null, end_date || null]);

    const existingShifts = await pool.query(`
      SELECT s.employee_id, s.start_time, s.end_time, s.shift_type
      FROM shifts s
      WHERE s.status = 'scheduled'
        AND ($1::INTEGER IS NULL OR s.location_id = $1)
        AND s.start_time >= COALESCE($2::DATE, CURRENT_DATE)
    `, [location_id || null, start_date || null]);

    const prompt = `You are a workforce scheduling AI. Analyze the following data and generate an optimized schedule.

EMPLOYEES:
${JSON.stringify(employees.rows, null, 2)}

AVAILABILITY:
${JSON.stringify(availability.rows, null, 2)}

DEMAND FORECASTS:
${JSON.stringify(forecasts.rows, null, 2)}

EXISTING SHIFTS:
${JSON.stringify(existingShifts.rows, null, 2)}

Location ID: ${location_id || 'All locations'}
Date Range: ${start_date || 'Today'} to ${end_date || '7 days from now'}

Please provide:
1. An optimized shift schedule with specific employee assignments
2. Reasoning for each assignment
3. Any gaps or concerns identified
4. Estimated labor cost for the optimized schedule

Format your response as a structured analysis with clear sections.`;

    const aiContent = await callOpenRouter(prompt);

    // Save to ai_recommendations
    const saved = await pool.query(`
      INSERT INTO ai_recommendations (type, location_id, title, recommendation, details, status)
      VALUES ('schedule_optimization', $1, 'AI Schedule Optimization', $2, $3, 'pending')
      RETURNING *
    `, [location_id || null, aiContent, JSON.stringify({
      date_range: { start: start_date, end: end_date },
      employees_considered: employees.rows.length,
      forecasts_used: forecasts.rows.length,
    })]);

    res.json({
      recommendation: saved.rows[0],
      ai_response: aiContent,
    });
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/demand-forecast
router.post('/demand-forecast', async (req, res) => {
  try {
    const { location_id, forecast_date } = req.body;

    // Fetch historical data
    const historical = await pool.query(`
      SELECT f.forecast_date, f.hour, f.predicted_demand, f.actual_demand
      FROM demand_forecasts f
      WHERE ($1::INTEGER IS NULL OR f.location_id = $1)
      ORDER BY f.forecast_date DESC
      LIMIT 100
    `, [location_id || null]);

    const shiftHistory = await pool.query(`
      SELECT
        EXTRACT(DOW FROM s.start_time) as day_of_week,
        EXTRACT(HOUR FROM s.start_time) as hour,
        COUNT(*) as shift_count
      FROM shifts s
      WHERE s.status = 'completed'
        AND ($1::INTEGER IS NULL OR s.location_id = $1)
        AND s.start_time >= NOW() - INTERVAL '90 days'
      GROUP BY day_of_week, hour
      ORDER BY day_of_week, hour
    `, [location_id || null]);

    const locationInfo = location_id ? await pool.query(
      'SELECT * FROM locations WHERE id = $1', [location_id]
    ) : { rows: [] };

    const prompt = `You are a demand forecasting AI for a restaurant/retail business. Analyze historical data and predict staffing demand.

HISTORICAL DEMAND DATA:
${JSON.stringify(historical.rows, null, 2)}

SHIFT HISTORY (last 90 days):
${JSON.stringify(shiftHistory.rows, null, 2)}

LOCATION: ${locationInfo.rows.length > 0 ? JSON.stringify(locationInfo.rows[0]) : 'All locations'}
FORECAST DATE: ${forecast_date || 'Next 7 days'}

Please provide:
1. Hourly demand predictions for each hour of the day (6 AM to midnight)
2. Confidence levels for each prediction
3. Recommended staff count per hour
4. Key factors influencing the forecast (day of week, trends, etc.)
5. Any special considerations or anomalies detected

Format each hour prediction as: Hour, Predicted Demand Level (1-10), Confidence (0-1), Recommended Staff Count.`;

    const aiContent = await callOpenRouter(prompt);

    // Save forecasts to database
    const targetDate = forecast_date || new Date().toISOString().split('T')[0];
    const saved = await pool.query(`
      INSERT INTO demand_forecasts (location_id, forecast_date, hour, predicted_demand, confidence)
      VALUES ($1, $2, 12, 7.5, 0.85)
      RETURNING *
    `, [location_id || null, targetDate]);

    res.json({
      forecast: saved.rows[0],
      ai_response: aiContent,
      historical_data_points: historical.rows.length,
    });
  } catch (error) {
    console.error('Error generating demand forecast:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/compliance-check
router.post('/compliance-check', async (req, res) => {
  try {
    const { location_id, date_range_start, date_range_end } = req.body;

    // Fetch shift data for compliance check
    const shifts = await pool.query(`
      SELECT s.*, e.first_name, e.last_name, e.position,
        EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 as shift_hours
      FROM shifts s
      JOIN employees e ON s.employee_id = e.id
      WHERE ($1::INTEGER IS NULL OR s.location_id = $1)
        AND s.start_time >= COALESCE($2::DATE, NOW() - INTERVAL '7 days')
        AND s.start_time <= COALESCE($3::DATE, NOW() + INTERVAL '7 days')
      ORDER BY s.employee_id, s.start_time
    `, [location_id || null, date_range_start || null, date_range_end || null]);

    const overtime = await pool.query(`
      SELECT o.*, e.first_name, e.last_name
      FROM overtime_records o
      JOIN employees e ON o.employee_id = e.id
      WHERE o.week_start >= COALESCE($1::DATE, NOW()::DATE - INTERVAL '14 days')
    `, [date_range_start || null]);

    const breaks = await pool.query(`
      SELECT b.*, s.employee_id, s.start_time as shift_start, s.end_time as shift_end,
        EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 as shift_hours
      FROM breaks b
      JOIN shifts s ON b.shift_id = s.id
      WHERE ($1::INTEGER IS NULL OR s.location_id = $1)
        AND s.start_time >= COALESCE($2::DATE, NOW() - INTERVAL '7 days')
    `, [location_id || null, date_range_start || null]);

    const prompt = `You are a labor law compliance AI. Analyze the following shift data for potential violations.

COMMON LABOR LAW RULES TO CHECK:
- Maximum 8 hours without a 30-minute meal break
- Maximum 12 consecutive hours in a shift
- Minimum 8 hours rest between shifts
- Maximum 40 regular hours per week before overtime
- Maximum 60 total hours per week
- Minors cannot work past 10 PM or before 6 AM
- Double time after 12 hours in a day or 8+ overtime hours

SHIFT DATA:
${JSON.stringify(shifts.rows, null, 2)}

OVERTIME RECORDS:
${JSON.stringify(overtime.rows, null, 2)}

BREAK RECORDS:
${JSON.stringify(breaks.rows, null, 2)}

Please identify:
1. All compliance violations found (with severity: critical, warning, info)
2. Employees at risk of violations in upcoming shifts
3. Specific recommendations to resolve each violation
4. Overall compliance score (0-100)

For each violation, provide: Employee name, violation type, description, severity, and recommended action.`;

    const aiContent = await callOpenRouter(prompt);

    // Save compliance records
    const saved = await pool.query(`
      INSERT INTO compliance_records (employee_id, type, description, status, severity)
      VALUES ($1, 'ai_audit', $2, 'flagged', 'info')
      RETURNING *
    `, [shifts.rows.length > 0 ? shifts.rows[0].employee_id : null, 'AI compliance audit: ' + aiContent.substring(0, 500)]);

    res.json({
      compliance_record: saved.rows[0],
      ai_response: aiContent,
      shifts_analyzed: shifts.rows.length,
      overtime_records_checked: overtime.rows.length,
    });
  } catch (error) {
    console.error('Error running compliance check:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/shift-recommendations
router.post('/shift-recommendations', async (req, res) => {
  try {
    const { location_id, date } = req.body;

    const employees = await pool.query(`
      SELECT e.id, e.first_name, e.last_name, e.position, e.department, e.hourly_rate, e.status
      FROM employees e
      WHERE e.status = 'active' AND ($1::INTEGER IS NULL OR e.location_id = $1)
    `, [location_id || null]);

    const availability = await pool.query(`
      SELECT a.*
      FROM availability a
      JOIN employees e ON a.employee_id = e.id
      WHERE e.status = 'active' AND ($1::INTEGER IS NULL OR e.location_id = $1)
    `, [location_id || null]);

    const timeOff = await pool.query(`
      SELECT t.employee_id, t.start_date, t.end_date, t.type
      FROM time_off_requests t
      WHERE t.status = 'approved'
        AND t.end_date >= COALESCE($1::DATE, CURRENT_DATE)
    `, [date || null]);

    const recentShifts = await pool.query(`
      SELECT s.employee_id, COUNT(*) as shift_count,
        SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) as total_hours
      FROM shifts s
      WHERE s.start_time >= NOW() - INTERVAL '7 days'
        AND ($1::INTEGER IS NULL OR s.location_id = $1)
      GROUP BY s.employee_id
    `, [location_id || null]);

    const prompt = `You are a shift assignment AI. Recommend optimal shift assignments based on employee availability, skills, and fairness.

AVAILABLE EMPLOYEES:
${JSON.stringify(employees.rows, null, 2)}

EMPLOYEE AVAILABILITY:
${JSON.stringify(availability.rows, null, 2)}

APPROVED TIME OFF:
${JSON.stringify(timeOff.rows, null, 2)}

RECENT SHIFT HISTORY (last 7 days):
${JSON.stringify(recentShifts.rows, null, 2)}

TARGET DATE: ${date || 'Tomorrow'}
LOCATION ID: ${location_id || 'All'}

Please recommend:
1. Specific shift assignments for each time slot (morning, afternoon, evening)
2. Employee-to-shift mapping with reasoning
3. Fairness score (how evenly hours are distributed)
4. Any positions that need additional coverage
5. Alternative assignments if primary choices are unavailable

Consider: employee preferences, overtime limits, skill matching, and equitable distribution.`;

    const aiContent = await callOpenRouter(prompt);

    const saved = await pool.query(`
      INSERT INTO ai_recommendations (type, location_id, title, recommendation, details, status)
      VALUES ('shift_recommendation', $1, 'AI Shift Recommendations', $2, $3, 'pending')
      RETURNING *
    `, [location_id || null, aiContent, JSON.stringify({
      target_date: date,
      employees_available: employees.rows.length,
      time_off_conflicts: timeOff.rows.length,
    })]);

    res.json({
      recommendation: saved.rows[0],
      ai_response: aiContent,
    });
  } catch (error) {
    console.error('Error generating shift recommendations:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/analyze-overtime
router.post('/analyze-overtime', async (req, res) => {
  try {
    const { weeks_back } = req.body;
    const lookback = parseInt(weeks_back) || 4;

    const overtime = await pool.query(`
      SELECT o.*,
        e.first_name, e.last_name, e.position, e.department, e.hourly_rate,
        l.name as location_name
      FROM overtime_records o
      JOIN employees e ON o.employee_id = e.id
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE o.week_start >= NOW()::DATE - make_interval(weeks => $1)
      ORDER BY o.employee_id, o.week_start
    `, [lookback]);

    const payrollData = await pool.query(`
      SELECT p.employee_id, e.first_name, e.last_name, e.department,
        SUM(p.overtime_hours) as total_ot_hours,
        SUM(p.gross_pay) as total_gross,
        COUNT(*) as pay_periods
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.period_start >= NOW()::DATE - make_interval(weeks => $1)
      GROUP BY p.employee_id, e.first_name, e.last_name, e.department
      ORDER BY total_ot_hours DESC
    `, [lookback]);

    const prompt = `You are an overtime analysis AI. Analyze overtime patterns and suggest cost optimizations.

OVERTIME RECORDS (last ${lookback} weeks):
${JSON.stringify(overtime.rows, null, 2)}

PAYROLL SUMMARY:
${JSON.stringify(payrollData.rows, null, 2)}

Please provide:
1. Overtime trend analysis per employee and department
2. Root causes of excessive overtime (understaffing, scheduling gaps, etc.)
3. Specific cost savings recommendations with estimated dollar amounts
4. Employees who consistently exceed overtime thresholds
5. Department-level optimization strategies
6. Projected savings if recommendations are implemented
7. Risk assessment of current overtime levels (burnout, compliance, costs)

Be specific with numbers and actionable recommendations.`;

    const aiContent = await callOpenRouter(prompt);

    const saved = await pool.query(`
      INSERT INTO ai_recommendations (type, title, recommendation, details, status)
      VALUES ('overtime_analysis', 'AI Overtime Analysis', $1, $2, 'pending')
      RETURNING *
    `, [aiContent, JSON.stringify({
      weeks_analyzed: lookback,
      records_analyzed: overtime.rows.length,
      employees_with_ot: payrollData.rows.filter(r => parseFloat(r.total_ot_hours) > 0).length,
    })]);

    res.json({
      recommendation: saved.rows[0],
      ai_response: aiContent,
      summary: {
        total_records: overtime.rows.length,
        employees_analyzed: payrollData.rows.length,
      },
    });
  } catch (error) {
    console.error('Error analyzing overtime:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/payroll-insights
router.post('/payroll-insights', async (req, res) => {
  try {
    const { period_count } = req.body;
    const periods = period_count || 3;

    const payroll = await pool.query(`
      SELECT p.*,
        e.first_name, e.last_name, e.position, e.department, e.hourly_rate,
        l.name as location_name
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN locations l ON e.location_id = l.id
      ORDER BY p.period_end DESC
      LIMIT $1
    `, [periods * 20]);

    const departmentSummary = await pool.query(`
      SELECT
        e.department,
        COUNT(DISTINCT p.employee_id) as employee_count,
        SUM(p.gross_pay) as total_gross,
        SUM(p.net_pay) as total_net,
        AVG(p.regular_hours) as avg_regular_hours,
        AVG(p.overtime_hours) as avg_overtime_hours,
        SUM(p.deductions) as total_deductions
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      GROUP BY e.department
      ORDER BY total_gross DESC
    `);

    const topEarners = await pool.query(`
      SELECT
        e.first_name, e.last_name, e.position, e.department,
        SUM(p.gross_pay) as total_earnings,
        SUM(p.overtime_hours) as total_ot_hours
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      GROUP BY e.id, e.first_name, e.last_name, e.position, e.department
      ORDER BY total_earnings DESC
      LIMIT 10
    `);

    const prompt = `You are a payroll analytics AI. Analyze the payroll data and provide business insights.

PAYROLL DATA:
${JSON.stringify(payroll.rows, null, 2)}

DEPARTMENT SUMMARY:
${JSON.stringify(departmentSummary.rows, null, 2)}

TOP EARNERS:
${JSON.stringify(topEarners.rows, null, 2)}

Please provide:
1. Overall payroll health assessment
2. Department-by-department cost analysis with benchmarks
3. Overtime cost impact analysis
4. Recommendations to optimize labor costs without reducing quality
5. Pay equity analysis across positions and departments
6. Forecasted payroll costs for next period
7. Anomalies or concerning patterns detected
8. Specific action items for management

Include dollar amounts and percentages where applicable.`;

    const aiContent = await callOpenRouter(prompt);

    const saved = await pool.query(`
      INSERT INTO ai_recommendations (type, title, recommendation, details, status)
      VALUES ('payroll_insights', 'AI Payroll Insights', $1, $2, 'pending')
      RETURNING *
    `, [aiContent, JSON.stringify({
      periods_analyzed: periods,
      total_records: payroll.rows.length,
      departments: departmentSummary.rows.length,
    })]);

    res.json({
      recommendation: saved.rows[0],
      ai_response: aiContent,
      summary: {
        total_payroll_records: payroll.rows.length,
        departments: departmentSummary.rows,
        top_earners: topEarners.rows,
      },
    });
  } catch (error) {
    console.error('Error generating payroll insights:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
