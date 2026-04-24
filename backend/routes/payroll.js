const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/payroll - list all with employee
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.position as employee_position,
        e.hourly_rate as employee_hourly_rate
      FROM payroll p
      LEFT JOIN employees e ON p.employee_id = e.id
      ORDER BY p.period_end DESC, e.last_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payroll/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.email as employee_email,
        e.position as employee_position,
        e.hourly_rate as employee_hourly_rate
      FROM payroll p
      LEFT JOIN employees e ON p.employee_id = e.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching payroll record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payroll - create/generate
router.post('/', async (req, res) => {
  try {
    const { employee_id, period_start, period_end, regular_hours, overtime_hours, gross_pay, deductions, net_pay, status } = req.body;

    const result = await pool.query(`
      INSERT INTO payroll (employee_id, period_start, period_end, regular_hours, overtime_hours, gross_pay, deductions, net_pay, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [employee_id, period_start, period_end, regular_hours || 0, overtime_hours || 0, gross_pay || 0, deductions || 0, net_pay || 0, status || 'pending']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payroll record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/payroll/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { regular_hours, overtime_hours, gross_pay, deductions, net_pay, status } = req.body;

    const result = await pool.query(`
      UPDATE payroll
      SET regular_hours = COALESCE($1, regular_hours),
          overtime_hours = COALESCE($2, overtime_hours),
          gross_pay = COALESCE($3, gross_pay),
          deductions = COALESCE($4, deductions),
          net_pay = COALESCE($5, net_pay),
          status = COALESCE($6, status)
      WHERE id = $7
      RETURNING *
    `, [regular_hours, overtime_hours, gross_pay, deductions, net_pay, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payroll record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/payroll/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM payroll WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json({ message: 'Payroll record deleted successfully', payroll: result.rows[0] });
  } catch (error) {
    console.error('Error deleting payroll record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
