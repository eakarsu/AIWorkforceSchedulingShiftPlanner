const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/availability - list all with employee
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.position as employee_position
      FROM availability a
      LEFT JOIN employees e ON a.employee_id = e.id
      ORDER BY a.employee_id, a.day_of_week
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/availability/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT a.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM availability a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Availability record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/availability - create
router.post('/', async (req, res) => {
  try {
    const { employee_id, day_of_week, start_time, end_time, is_available } = req.body;

    const result = await pool.query(`
      INSERT INTO availability (employee_id, day_of_week, start_time, end_time, is_available)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [employee_id, day_of_week, start_time, end_time, is_available !== undefined ? is_available : true]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/availability/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, day_of_week, start_time, end_time, is_available } = req.body;

    const result = await pool.query(`
      UPDATE availability
      SET employee_id = COALESCE($1, employee_id),
          day_of_week = COALESCE($2, day_of_week),
          start_time = COALESCE($3, start_time),
          end_time = COALESCE($4, end_time),
          is_available = COALESCE($5, is_available)
      WHERE id = $6
      RETURNING *
    `, [employee_id, day_of_week, start_time, end_time, is_available, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Availability record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/availability/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM availability WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Availability record not found' });
    }
    res.json({ message: 'Availability record deleted successfully', availability: result.rows[0] });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
