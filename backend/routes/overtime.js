const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/overtime - list all with employee
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.position as employee_position,
        e.hourly_rate as employee_hourly_rate
      FROM overtime_records o
      LEFT JOIN employees e ON o.employee_id = e.id
      ORDER BY o.week_start DESC, e.last_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching overtime records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/overtime/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT o.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.email as employee_email,
        e.hourly_rate as employee_hourly_rate
      FROM overtime_records o
      LEFT JOIN employees e ON o.employee_id = e.id
      WHERE o.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Overtime record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching overtime record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/overtime - create
router.post('/', async (req, res) => {
  try {
    const { employee_id, week_start, regular_hours, overtime_hours, double_time_hours, status } = req.body;

    const result = await pool.query(`
      INSERT INTO overtime_records (employee_id, week_start, regular_hours, overtime_hours, double_time_hours, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [employee_id, week_start, regular_hours || 0, overtime_hours || 0, double_time_hours || 0, status || 'pending']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating overtime record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/overtime/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { regular_hours, overtime_hours, double_time_hours, status } = req.body;

    const result = await pool.query(`
      UPDATE overtime_records
      SET regular_hours = COALESCE($1, regular_hours),
          overtime_hours = COALESCE($2, overtime_hours),
          double_time_hours = COALESCE($3, double_time_hours),
          status = COALESCE($4, status)
      WHERE id = $5
      RETURNING *
    `, [regular_hours, overtime_hours, double_time_hours, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Overtime record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating overtime record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/overtime/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM overtime_records WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Overtime record not found' });
    }
    res.json({ message: 'Overtime record deleted successfully', overtime: result.rows[0] });
  } catch (error) {
    console.error('Error deleting overtime record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
