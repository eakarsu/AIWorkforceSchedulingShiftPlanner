const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/forecasts - list all with location
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*,
        l.name as location_name,
        l.city as location_city
      FROM demand_forecasts f
      LEFT JOIN locations l ON f.location_id = l.id
      ORDER BY f.forecast_date DESC, f.hour
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/forecasts/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT f.*,
        l.name as location_name,
        l.city as location_city,
        l.address as location_address
      FROM demand_forecasts f
      LEFT JOIN locations l ON f.location_id = l.id
      WHERE f.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forecast not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/forecasts - create
router.post('/', async (req, res) => {
  try {
    const { location_id, forecast_date, hour, predicted_demand, actual_demand, confidence } = req.body;

    const result = await pool.query(`
      INSERT INTO demand_forecasts (location_id, forecast_date, hour, predicted_demand, actual_demand, confidence)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [location_id, forecast_date, hour, predicted_demand, actual_demand, confidence]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating forecast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/forecasts/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { predicted_demand, actual_demand, confidence } = req.body;

    const result = await pool.query(`
      UPDATE demand_forecasts
      SET predicted_demand = COALESCE($1, predicted_demand),
          actual_demand = COALESCE($2, actual_demand),
          confidence = COALESCE($3, confidence)
      WHERE id = $4
      RETURNING *
    `, [predicted_demand, actual_demand, confidence, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forecast not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating forecast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/forecasts/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM demand_forecasts WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forecast not found' });
    }
    res.json({ message: 'Forecast deleted successfully', forecast: result.rows[0] });
  } catch (error) {
    console.error('Error deleting forecast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
