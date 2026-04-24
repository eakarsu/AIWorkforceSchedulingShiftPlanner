const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/compliance - list all with employee and shift
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.position as employee_position,
        s.start_time as shift_start_time,
        s.end_time as shift_end_time
      FROM compliance_records c
      LEFT JOIN employees e ON c.employee_id = e.id
      LEFT JOIN shifts s ON c.shift_id = s.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/compliance/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT c.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.email as employee_email,
        s.start_time as shift_start_time,
        s.end_time as shift_end_time,
        s.shift_type
      FROM compliance_records c
      LEFT JOIN employees e ON c.employee_id = e.id
      LEFT JOIN shifts s ON c.shift_id = s.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching compliance record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/compliance - create
router.post('/', async (req, res) => {
  try {
    const { employee_id, shift_id, type, description, status, severity } = req.body;

    const result = await pool.query(`
      INSERT INTO compliance_records (employee_id, shift_id, type, description, status, severity)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [employee_id, shift_id, type, description, status || 'flagged', severity || 'warning']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating compliance record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/compliance/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, status, severity } = req.body;

    const result = await pool.query(`
      UPDATE compliance_records
      SET type = COALESCE($1, type),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          severity = COALESCE($4, severity)
      WHERE id = $5
      RETURNING *
    `, [type, description, status, severity, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating compliance record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/compliance/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM compliance_records WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }
    res.json({ message: 'Compliance record deleted successfully', compliance: result.rows[0] });
  } catch (error) {
    console.error('Error deleting compliance record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
