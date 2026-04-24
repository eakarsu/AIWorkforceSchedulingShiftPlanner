const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/recommendations - list all with location
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
        l.name as location_name,
        l.city as location_city
      FROM ai_recommendations r
      LEFT JOIN locations l ON r.location_id = l.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/recommendations/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*,
        l.name as location_name,
        l.city as location_city
      FROM ai_recommendations r
      LEFT JOIN locations l ON r.location_id = l.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recommendations - create
router.post('/', async (req, res) => {
  try {
    const { type, location_id, title, recommendation, details, status } = req.body;

    const result = await pool.query(`
      INSERT INTO ai_recommendations (type, location_id, title, recommendation, details, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [type, location_id, title, recommendation, details ? JSON.stringify(details) : null, status || 'pending']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/recommendations/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM ai_recommendations WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    res.json({ message: 'Recommendation deleted successfully', recommendation: result.rows[0] });
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
