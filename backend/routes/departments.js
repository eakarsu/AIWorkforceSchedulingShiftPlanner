const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/departments - list all with employee count
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department = d.name AND e.status = 'active'
      GROUP BY d.id
      ORDER BY d.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/departments/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT d.*,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department = d.name AND e.status = 'active'
      WHERE d.id = $1
      GROUP BY d.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/departments - create
router.post('/', async (req, res) => {
  try {
    const { name, description, manager_name, budget, status } = req.body;

    const result = await pool.query(`
      INSERT INTO departments (name, description, manager_name, budget, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description, manager_name, budget || 0, status || 'active']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/departments/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, manager_name, budget, status } = req.body;

    const result = await pool.query(`
      UPDATE departments
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          manager_name = COALESCE($3, manager_name),
          budget = COALESCE($4, budget),
          status = COALESCE($5, status)
      WHERE id = $6
      RETURNING *
    `, [name, description, manager_name, budget, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/departments/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json({ message: 'Department deleted successfully', department: result.rows[0] });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
