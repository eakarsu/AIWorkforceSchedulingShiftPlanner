const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/audit-log - list all with filtering
router.get('/', async (req, res) => {
  try {
    const { action, entity_type, user_name, limit: queryLimit } = req.query;
    let query = 'SELECT * FROM audit_log';
    const conditions = [];
    const params = [];

    if (action) {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }
    if (entity_type) {
      params.push(entity_type);
      conditions.push(`entity_type = $${params.length}`);
    }
    if (user_name) {
      params.push(`%${user_name}%`);
      conditions.push(`user_name ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const recordLimit = Math.min(parseInt(queryLimit) || 100, 500);
    params.push(recordLimit);
    query += ` LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/audit-log - create entry
router.post('/', async (req, res) => {
  try {
    const { action, entity_type, entity_id, user_name, details } = req.body;

    const result = await pool.query(`
      INSERT INTO audit_log (action, entity_type, entity_id, user_name, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [action, entity_type, entity_id, user_name, details ? JSON.stringify(details) : null]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating audit log entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/audit-log/stats - get summary stats
router.get('/stats', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM audit_log');
    const todayResult = await pool.query("SELECT COUNT(*) as today FROM audit_log WHERE DATE(created_at) = CURRENT_DATE");
    const byAction = await pool.query('SELECT action, COUNT(*) as count FROM audit_log GROUP BY action ORDER BY count DESC');
    const byEntity = await pool.query('SELECT entity_type, COUNT(*) as count FROM audit_log GROUP BY entity_type ORDER BY count DESC');
    const recentUsers = await pool.query('SELECT DISTINCT user_name FROM audit_log WHERE created_at > NOW() - INTERVAL \'7 days\' ORDER BY user_name');

    res.json({
      total: parseInt(totalResult.rows[0].total),
      today: parseInt(todayResult.rows[0].today),
      by_action: byAction.rows,
      by_entity: byEntity.rows,
      recent_users: recentUsers.rows.map(r => r.user_name)
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
