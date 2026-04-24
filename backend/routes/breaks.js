const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/breaks - list all with shift -> employee
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*,
        s.start_time as shift_start_time,
        s.end_time as shift_end_time,
        s.employee_id,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.position as employee_position
      FROM breaks b
      LEFT JOIN shifts s ON b.shift_id = s.id
      LEFT JOIN employees e ON s.employee_id = e.id
      ORDER BY b.start_time DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching breaks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/breaks/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT b.*,
        s.start_time as shift_start_time,
        s.end_time as shift_end_time,
        s.employee_id,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM breaks b
      LEFT JOIN shifts s ON b.shift_id = s.id
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE b.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Break not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching break:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/breaks - create
router.post('/', async (req, res) => {
  try {
    const { shift_id, start_time, end_time, break_type, status } = req.body;

    const result = await pool.query(`
      INSERT INTO breaks (shift_id, start_time, end_time, break_type, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [shift_id, start_time, end_time, break_type || 'meal', status || 'scheduled']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating break:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/breaks/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, break_type, status } = req.body;

    const result = await pool.query(`
      UPDATE breaks
      SET start_time = COALESCE($1, start_time),
          end_time = COALESCE($2, end_time),
          break_type = COALESCE($3, break_type),
          status = COALESCE($4, status)
      WHERE id = $5
      RETURNING *
    `, [start_time, end_time, break_type, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Break not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating break:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/breaks/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM breaks WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Break not found' });
    }
    res.json({ message: 'Break deleted successfully', break: result.rows[0] });
  } catch (error) {
    console.error('Error deleting break:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
