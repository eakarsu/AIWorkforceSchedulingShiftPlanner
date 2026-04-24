const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/announcements - list all
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/announcements/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM announcements WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/announcements - create
router.post('/', async (req, res) => {
  try {
    const { title, content, priority, category, author_name, is_pinned, expires_at } = req.body;

    const result = await pool.query(`
      INSERT INTO announcements (title, content, priority, category, author_name, is_pinned, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, content, priority || 'normal', category || 'general', author_name, is_pinned || false, expires_at]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/announcements/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, category, author_name, is_pinned, expires_at } = req.body;

    const result = await pool.query(`
      UPDATE announcements
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          priority = COALESCE($3, priority),
          category = COALESCE($4, category),
          author_name = COALESCE($5, author_name),
          is_pinned = COALESCE($6, is_pinned),
          expires_at = COALESCE($7, expires_at)
      WHERE id = $8
      RETURNING *
    `, [title, content, priority, category, author_name, is_pinned, expires_at, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/announcements/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
