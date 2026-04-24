const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/shift-templates - list all
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT st.*,
        l.name as location_name
      FROM shift_templates st
      LEFT JOIN locations l ON st.location_id = l.id
      ORDER BY st.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shift templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/shift-templates/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT st.*,
        l.name as location_name
      FROM shift_templates st
      LEFT JOIN locations l ON st.location_id = l.id
      WHERE st.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift template not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching shift template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shift-templates - create
router.post('/', async (req, res) => {
  try {
    const { name, location_id, start_time, end_time, break_duration, shift_type, required_employees, days_of_week, status } = req.body;

    const result = await pool.query(`
      INSERT INTO shift_templates (name, location_id, start_time, end_time, break_duration, shift_type, required_employees, days_of_week, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [name, location_id, start_time, end_time, break_duration || 30, shift_type || 'regular', required_employees || 1, days_of_week || '[]', status || 'active']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shift template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/shift-templates/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location_id, start_time, end_time, break_duration, shift_type, required_employees, days_of_week, status } = req.body;

    const result = await pool.query(`
      UPDATE shift_templates
      SET name = COALESCE($1, name),
          location_id = COALESCE($2, location_id),
          start_time = COALESCE($3, start_time),
          end_time = COALESCE($4, end_time),
          break_duration = COALESCE($5, break_duration),
          shift_type = COALESCE($6, shift_type),
          required_employees = COALESCE($7, required_employees),
          days_of_week = COALESCE($8, days_of_week),
          status = COALESCE($9, status)
      WHERE id = $10
      RETURNING *
    `, [name, location_id, start_time, end_time, break_duration, shift_type, required_employees, days_of_week, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift template not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shift template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shift-templates/:id/apply - apply template to create shifts
router.post('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, employee_ids } = req.body;

    const template = await pool.query('SELECT * FROM shift_templates WHERE id = $1', [id]);
    if (template.rows.length === 0) {
      return res.status(404).json({ error: 'Shift template not found' });
    }

    const t = template.rows[0];
    const createdShifts = [];

    for (const empId of employee_ids) {
      const startTime = `${date}T${t.start_time}`;
      const endTime = `${date}T${t.end_time}`;

      const result = await pool.query(`
        INSERT INTO shifts (employee_id, location_id, start_time, end_time, break_duration, shift_type, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [empId, t.location_id, startTime, endTime, t.break_duration, t.shift_type, `Created from template: ${t.name}`]);

      createdShifts.push(result.rows[0]);
    }

    res.status(201).json({ message: `${createdShifts.length} shifts created from template`, shifts: createdShifts });
  } catch (error) {
    console.error('Error applying shift template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/shift-templates/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM shift_templates WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift template not found' });
    }
    res.json({ message: 'Shift template deleted successfully', template: result.rows[0] });
  } catch (error) {
    console.error('Error deleting shift template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
