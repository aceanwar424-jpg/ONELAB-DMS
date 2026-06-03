const express = require('express');
const { isAuthenticated } = require('../middleware/auth');

module.exports = function(passport) {
  const router = express.Router();

  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
    (req, res) => {
      // Redirect tanpa trailing slash, tanpa double slash
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
      res.redirect(`${frontendUrl}/dashboard`)
    }
  );

  router.get('/me', isAuthenticated, (req, res) => {
    const { id, email, name, avatar, role, created_at } = req.user;
    res.json({ id, email, name, avatar, role, created_at });
  });

  router.post('/logout', (req, res) => {
    req.logout(() => res.json({ success: true }));
  });

  return router;
};
