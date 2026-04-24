const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/employees - list all with location
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, l.name as location_name, l.city as location_city
      FROM employees e
      LEFT JOIN locations l ON e.location_id = l.id
      ORDER BY e.last_name, e.first_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/employees/:id - get by id with location
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT e.*, l.name as location_name, l.city as location_city, l.address as location_address
      FROM employees e
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees - create new
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, position, department, hourly_rate, hire_date, status, location_id } = req.body;

    const result = await pool.query(`
      INSERT INTO employees (first_name, last_name, email, phone, position, department, hourly_rate, hire_date, status, location_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [first_name, last_name, email, phone, position, department, hourly_rate || 15.00, hire_date, status || 'active', location_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'An employee with that email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/employees/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, position, department, hourly_rate, hire_date, status, location_id } = req.body;

    const result = await pool.query(`
      UPDATE employees
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          position = COALESCE($5, position),
          department = COALESCE($6, department),
          hourly_rate = COALESCE($7, hourly_rate),
          hire_date = COALESCE($8, hire_date),
          status = COALESCE($9, status),
          location_id = COALESCE($10, location_id)
      WHERE id = $11
      RETURNING *
    `, [first_name, last_name, email, phone, position, department, hourly_rate, hire_date, status, location_id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/employees/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully', employee: result.rows[0] });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
