const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/swap-requests - list all with employee and shift joins
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sr.*,
        req.first_name as requester_first_name,
        req.last_name as requester_last_name,
        reqd.first_name as requested_first_name,
        reqd.last_name as requested_last_name,
        rs.start_time as requester_shift_start,
        rs.end_time as requester_shift_end,
        rds.start_time as requested_shift_start,
        rds.end_time as requested_shift_end
      FROM shift_swap_requests sr
      LEFT JOIN employees req ON sr.requester_id = req.id
      LEFT JOIN employees reqd ON sr.requested_id = reqd.id
      LEFT JOIN shifts rs ON sr.requester_shift_id = rs.id
      LEFT JOIN shifts rds ON sr.requested_shift_id = rds.id
      ORDER BY sr.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching swap requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/swap-requests/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT sr.*,
        req.first_name as requester_first_name,
        req.last_name as requester_last_name,
        req.email as requester_email,
        reqd.first_name as requested_first_name,
        reqd.last_name as requested_last_name,
        reqd.email as requested_email,
        rs.start_time as requester_shift_start,
        rs.end_time as requester_shift_end,
        rds.start_time as requested_shift_start,
        rds.end_time as requested_shift_end
      FROM shift_swap_requests sr
      LEFT JOIN employees req ON sr.requester_id = req.id
      LEFT JOIN employees reqd ON sr.requested_id = reqd.id
      LEFT JOIN shifts rs ON sr.requester_shift_id = rs.id
      LEFT JOIN shifts rds ON sr.requested_shift_id = rds.id
      WHERE sr.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching swap request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/swap-requests - create
router.post('/', async (req, res) => {
  try {
    const { requester_id, requester_shift_id, requested_id, requested_shift_id, reason } = req.body;

    const result = await pool.query(`
      INSERT INTO shift_swap_requests (requester_id, requester_shift_id, requested_id, requested_shift_id, status, reason)
      VALUES ($1, $2, $3, $4, 'pending', $5)
      RETURNING *
    `, [requester_id, requester_shift_id, requested_id, requested_shift_id, reason]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating swap request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/swap-requests/:id - update status (approve/deny)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const result = await pool.query(`
      UPDATE shift_swap_requests
      SET status = COALESCE($1, status),
          reason = COALESCE($2, reason)
      WHERE id = $3
      RETURNING *
    `, [status, reason, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found' });
    }

    // If approved, swap the employee assignments on the shifts
    if (status === 'approved') {
      const swap = result.rows[0];
      await pool.query(`
        UPDATE shifts SET employee_id = $1 WHERE id = $2;
      `, [swap.requested_id, swap.requester_shift_id]);
      await pool.query(`
        UPDATE shifts SET employee_id = $1 WHERE id = $2;
      `, [swap.requester_id, swap.requested_shift_id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating swap request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/swap-requests/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM shift_swap_requests WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found' });
    }
    res.json({ message: 'Swap request deleted successfully', swap_request: result.rows[0] });
  } catch (error) {
    console.error('Error deleting swap request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
