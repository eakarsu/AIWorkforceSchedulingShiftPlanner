const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/locations - list all
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/locations/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/locations - create
router.post('/', async (req, res) => {
  try {
    const { name, address, city, state, timezone, phone, status } = req.body;

    const result = await pool.query(`
      INSERT INTO locations (name, address, city, state, timezone, phone, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, address, city, state, timezone || 'America/New_York', phone, status || 'active']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/locations/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, timezone, phone, status } = req.body;

    const result = await pool.query(`
      UPDATE locations
      SET name = COALESCE($1, name),
          address = COALESCE($2, address),
          city = COALESCE($3, city),
          state = COALESCE($4, state),
          timezone = COALESCE($5, timezone),
          phone = COALESCE($6, phone),
          status = COALESCE($7, status)
      WHERE id = $8
      RETURNING *
    `, [name, address, city, state, timezone, phone, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/locations/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully', location: result.rows[0] });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
