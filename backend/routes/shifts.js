const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/shifts - list all with employee and location
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.position as employee_position,
        l.name as location_name,
        l.city as location_city
      FROM shifts s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN locations l ON s.location_id = l.id
      ORDER BY s.start_time DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/shifts/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.position as employee_position,
        e.email as employee_email,
        l.name as location_name,
        l.city as location_city,
        l.address as location_address
      FROM shifts s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shifts - create new
router.post('/', async (req, res) => {
  try {
    const { employee_id, location_id, start_time, end_time, break_duration, status, shift_type, notes } = req.body;

    const result = await pool.query(`
      INSERT INTO shifts (employee_id, location_id, start_time, end_time, break_duration, status, shift_type, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [employee_id, location_id, start_time, end_time, break_duration || 30, status || 'scheduled', shift_type || 'regular', notes]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/shifts/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, location_id, start_time, end_time, break_duration, status, shift_type, notes } = req.body;

    const result = await pool.query(`
      UPDATE shifts
      SET employee_id = COALESCE($1, employee_id),
          location_id = COALESCE($2, location_id),
          start_time = COALESCE($3, start_time),
          end_time = COALESCE($4, end_time),
          break_duration = COALESCE($5, break_duration),
          status = COALESCE($6, status),
          shift_type = COALESCE($7, shift_type),
          notes = COALESCE($8, notes)
      WHERE id = $9
      RETURNING *
    `, [employee_id, location_id, start_time, end_time, break_duration, status, shift_type, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/shifts/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM shifts WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json({ message: 'Shift deleted successfully', shift: result.rows[0] });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
