const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/time-off - list all with employee
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.position as employee_position,
        e.department as employee_department
      FROM time_off_requests t
      LEFT JOIN employees e ON t.employee_id = e.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching time off requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/time-off/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT t.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.email as employee_email,
        e.position as employee_position
      FROM time_off_requests t
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time off request not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching time off request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/time-off - create
router.post('/', async (req, res) => {
  try {
    const { employee_id, start_date, end_date, type, reason } = req.body;

    const result = await pool.query(`
      INSERT INTO time_off_requests (employee_id, start_date, end_date, type, status, reason)
      VALUES ($1, $2, $3, $4, 'pending', $5)
      RETURNING *
    `, [employee_id, start_date, end_date, type || 'vacation', reason]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating time off request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/time-off/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, type, status, reason } = req.body;

    const result = await pool.query(`
      UPDATE time_off_requests
      SET start_date = COALESCE($1, start_date),
          end_date = COALESCE($2, end_date),
          type = COALESCE($3, type),
          status = COALESCE($4, status),
          reason = COALESCE($5, reason)
      WHERE id = $6
      RETURNING *
    `, [start_date, end_date, type, status, reason, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time off request not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating time off request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/time-off/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM time_off_requests WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time off request not found' });
    }
    res.json({ message: 'Time off request deleted successfully', time_off_request: result.rows[0] });
  } catch (error) {
    console.error('Error deleting time off request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
