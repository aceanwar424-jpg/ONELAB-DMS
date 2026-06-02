const express = require('express');
const { isAuthenticated, hasRole } = require('../middleware/auth');

module.exports = function(pool) {
  const router = express.Router();

  // GET all users (admin only)
  router.get('/', hasRole('admin'), async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, email, name, avatar, role, created_at FROM users ORDER BY created_at');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // UPDATE user role (admin only)
  router.put('/:id/role', hasRole('admin'), async (req, res) => {
    try {
      const { role } = req.body;
      if (!['admin', 'approver', 'editor', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      const { rows } = await pool.query(
        'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, email, name, avatar, role',
        [role, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'User not found' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
