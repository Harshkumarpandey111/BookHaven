const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validator');

// ── GET /register ─────────────────────────────────────────────────────────────
router.get('/register', optionalAuth, authController.renderRegister);

// ── POST /register ────────────────────────────────────────────────────────────
router.post('/register', authLimiter, registerValidator, validateRequest, authController.register);

// ── GET /login ────────────────────────────────────────────────────────────────
router.get('/login', optionalAuth, authController.renderLogin);

// ── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);

// ── GET /logout ───────────────────────────────────────────────────────────────
router.get('/logout', authController.logout);

module.exports = router;
