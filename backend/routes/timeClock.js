const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/time-clock - list all entries with employee info
router.get('/', async (req, res) => {
  try {
    const { employee_id, date } = req.query;
    let query = `
      SELECT tc.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.department,
        l.name as location_name
      FROM time_clock tc
      LEFT JOIN employees e ON tc.employee_id = e.id
      LEFT JOIN locations l ON tc.location_id = l.id
    `;
    const conditions = [];
    const params = [];

    if (employee_id) {
      params.push(employee_id);
      conditions.push(`tc.employee_id = $${params.length}`);
    }
    if (date) {
      params.push(date);
      conditions.push(`DATE(tc.clock_in) = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY tc.clock_in DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching time clock entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/time-clock/clock-in - clock in
router.post('/clock-in', async (req, res) => {
  try {
    const { employee_id, location_id, notes } = req.body;

    // Check if employee already clocked in
    const existing = await pool.query(
      'SELECT * FROM time_clock WHERE employee_id = $1 AND clock_out IS NULL',
      [employee_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Employee is already clocked in' });
    }

    const result = await pool.query(`
      INSERT INTO time_clock (employee_id, location_id, clock_in, status, notes)
      VALUES ($1, $2, NOW(), 'clocked_in', $3)
      RETURNING *
    `, [employee_id, location_id, notes]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/time-clock/:id/clock-out - clock out
router.put('/:id/clock-out', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE time_clock
      SET clock_out = NOW(),
          status = 'clocked_out',
          total_hours = ROUND(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 3600.0, 2)
      WHERE id = $1 AND clock_out IS NULL
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active clock-in entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/time-clock/:id - manual edit
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { clock_in, clock_out, notes, status } = req.body;

    let totalHours = null;
    if (clock_in && clock_out) {
      const diff = new Date(clock_out) - new Date(clock_in);
      totalHours = Math.round((diff / 3600000) * 100) / 100;
    }

    const result = await pool.query(`
      UPDATE time_clock
      SET clock_in = COALESCE($1, clock_in),
          clock_out = COALESCE($2, clock_out),
          notes = COALESCE($3, notes),
          status = COALESCE($4, status),
          total_hours = COALESCE($5, total_hours)
      WHERE id = $6
      RETURNING *
    `, [clock_in, clock_out, notes, status, totalHours, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time clock entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating time clock entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/time-clock/active - get currently clocked in employees
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tc.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.department,
        l.name as location_name
      FROM time_clock tc
      LEFT JOIN employees e ON tc.employee_id = e.id
      LEFT JOIN locations l ON tc.location_id = l.id
      WHERE tc.clock_out IS NULL
      ORDER BY tc.clock_in ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active clock-ins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/time-clock/:id - delete entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM time_clock WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time clock entry not found' });
    }
    res.json({ message: 'Time clock entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting time clock entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
