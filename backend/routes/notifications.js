const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/notifications - list all with employee
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.email as employee_email
      FROM notifications n
      LEFT JOIN employees e ON n.employee_id = e.id
      ORDER BY n.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT n.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.email as employee_email
      FROM notifications n
      LEFT JOIN employees e ON n.employee_id = e.id
      WHERE n.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notifications - create
router.post('/', async (req, res) => {
  try {
    const { employee_id, type, title, message } = req.body;

    const result = await pool.query(`
      INSERT INTO notifications (employee_id, type, title, message, is_read)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *
    `, [employee_id, type, title, message]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/:id/read - mark as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE notifications
      SET is_read = true
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/notifications/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully', notification: result.rows[0] });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
