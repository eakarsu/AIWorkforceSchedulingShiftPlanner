const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reports/dashboard - dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Total active employees
    const employeesResult = await pool.query(
      "SELECT COUNT(*) as total FROM employees WHERE status = 'active'"
    );

    // Shifts today
    const shiftsResult = await pool.query(
      "SELECT COUNT(*) as total FROM shifts WHERE start_time::DATE = CURRENT_DATE"
    );

    // Pending swap requests
    const swapResult = await pool.query(
      "SELECT COUNT(*) as total FROM shift_swap_requests WHERE status = 'pending'"
    );

    // Pending time off requests
    const timeOffResult = await pool.query(
      "SELECT COUNT(*) as total FROM time_off_requests WHERE status = 'pending'"
    );

    // Overtime alerts (flagged or pending)
    const overtimeResult = await pool.query(
      "SELECT COUNT(*) as total FROM overtime_records WHERE status IN ('flagged', 'pending') AND overtime_hours > 0"
    );

    // Compliance issues (flagged)
    const complianceResult = await pool.query(
      "SELECT COUNT(*) as total FROM compliance_records WHERE status = 'flagged'"
    );

    // Active locations
    const locationsResult = await pool.query(
      "SELECT COUNT(*) as total FROM locations WHERE status = 'active'"
    );

    // Unread notifications
    const notificationsResult = await pool.query(
      "SELECT COUNT(*) as total FROM notifications WHERE is_read = false"
    );

    res.json({
      total_employees: parseInt(employeesResult.rows[0].total),
      shifts_today: parseInt(shiftsResult.rows[0].total),
      pending_swap_requests: parseInt(swapResult.rows[0].total),
      pending_time_off: parseInt(timeOffResult.rows[0].total),
      overtime_alerts: parseInt(overtimeResult.rows[0].total),
      compliance_issues: parseInt(complianceResult.rows[0].total),
      active_locations: parseInt(locationsResult.rows[0].total),
      unread_notifications: parseInt(notificationsResult.rows[0].total),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/labor-costs - labor cost breakdown
router.get('/labor-costs', async (req, res) => {
  try {
    // Total payroll by period
    const payrollSummary = await pool.query(`
      SELECT
        period_start,
        period_end,
        SUM(regular_hours) as total_regular_hours,
        SUM(overtime_hours) as total_overtime_hours,
        SUM(gross_pay) as total_gross_pay,
        SUM(deductions) as total_deductions,
        SUM(net_pay) as total_net_pay,
        COUNT(DISTINCT employee_id) as employee_count
      FROM payroll
      GROUP BY period_start, period_end
      ORDER BY period_end DESC
      LIMIT 10
    `);

    // Cost by department
    const departmentCosts = await pool.query(`
      SELECT
        e.department,
        SUM(p.gross_pay) as total_cost,
        SUM(p.regular_hours) as total_regular_hours,
        SUM(p.overtime_hours) as total_overtime_hours,
        COUNT(DISTINCT p.employee_id) as employee_count
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      GROUP BY e.department
      ORDER BY total_cost DESC
    `);

    // Cost by location
    const locationCosts = await pool.query(`
      SELECT
        l.name as location_name,
        l.city,
        SUM(p.gross_pay) as total_cost,
        COUNT(DISTINCT p.employee_id) as employee_count
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN locations l ON e.location_id = l.id
      GROUP BY l.id, l.name, l.city
      ORDER BY total_cost DESC
    `);

    // Overtime costs
    const overtimeCosts = await pool.query(`
      SELECT
        SUM(overtime_hours) as total_overtime_hours,
        SUM(double_time_hours) as total_double_time_hours,
        COUNT(DISTINCT employee_id) as employees_with_overtime
      FROM overtime_records
      WHERE week_start >= NOW()::DATE - INTERVAL '30 days'
    `);

    res.json({
      payroll_summary: payrollSummary.rows,
      department_costs: departmentCosts.rows,
      location_costs: locationCosts.rows,
      overtime_costs: overtimeCosts.rows[0],
    });
  } catch (error) {
    console.error('Error fetching labor costs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/attendance - attendance stats
router.get('/attendance', async (req, res) => {
  try {
    // Shift completion stats
    const shiftStats = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM shifts
      WHERE start_time >= NOW() - INTERVAL '30 days'
      GROUP BY status
    `);

    // Shifts by day of week
    const shiftsByDay = await pool.query(`
      SELECT
        EXTRACT(DOW FROM start_time) as day_of_week,
        COUNT(*) as shift_count
      FROM shifts
      WHERE start_time >= NOW() - INTERVAL '30 days'
      GROUP BY day_of_week
      ORDER BY day_of_week
    `);

    // Top employees by hours
    const topEmployees = await pool.query(`
      SELECT
        e.first_name,
        e.last_name,
        e.position,
        COUNT(s.id) as shift_count,
        SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) as total_hours
      FROM shifts s
      JOIN employees e ON s.employee_id = e.id
      WHERE s.start_time >= NOW() - INTERVAL '30 days'
      GROUP BY e.id, e.first_name, e.last_name, e.position
      ORDER BY total_hours DESC
      LIMIT 10
    `);

    // Time off summary
    const timeOffSummary = await pool.query(`
      SELECT
        type,
        status,
        COUNT(*) as count
      FROM time_off_requests
      WHERE start_date >= NOW()::DATE - INTERVAL '30 days'
      GROUP BY type, status
      ORDER BY type, status
    `);

    res.json({
      shift_status_breakdown: shiftStats.rows,
      shifts_by_day: shiftsByDay.rows,
      top_employees_by_hours: topEmployees.rows,
      time_off_summary: timeOffSummary.rows,
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
