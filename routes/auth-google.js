const express = require('express');
const router = express.Router();
const passport = require('passport');
const { signAccessToken } = require('../utils/jwt');
const { sanitizeUser } = require('../services/auth.service');

// GET /auth/google — initiate OAuth flow
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

// GET /auth/google/callback — handle Google callback
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login?error=Google+login+failed'
  }),
  (req, res) => {
    try {
      // Create JWT token for the authenticated user
      const safeUser = sanitizeUser(req.user);
      const accessToken = signAccessToken(safeUser);

      // Set JWT cookie (same as normal login)
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
      });

      // Redirect to dashboard
      res.redirect('/user/dashboard');
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.redirect('/login?error=Authentication+failed');
    }
  }
);

module.exports = router;
