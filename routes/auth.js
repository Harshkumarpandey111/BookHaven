const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const {
	registerValidator,
	verifyEmailValidator,
	loginValidator,
	forgotPasswordValidator,
	resetPasswordValidator
} = require('../validators/auth.validator');

// ── GET /register ─────────────────────────────────────────────────────────────
router.get('/register', optionalAuth, authController.renderRegister);

// ── POST /register ────────────────────────────────────────────────────────────
router.post('/register', authLimiter, registerValidator, validateRequest, authController.register);

// ── GET /verify-email ────────────────────────────────────────────────────────
router.get('/verify-email', optionalAuth, authController.renderVerifyEmail);

// ── POST /verify-email ───────────────────────────────────────────────────────
router.post('/verify-email', authLimiter, verifyEmailValidator, validateRequest, authController.verifyEmail);

// ── GET /login ────────────────────────────────────────────────────────────────
router.get('/login', optionalAuth, authController.renderLogin);

// ── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);

// ── GET /forgot-password ─────────────────────────────────────────────────────
router.get('/forgot-password', optionalAuth, authController.renderForgotPassword);

// ── POST /forgot-password ────────────────────────────────────────────────────
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validateRequest, authController.forgotPassword);

// ── GET /reset-password ──────────────────────────────────────────────────────
router.get('/reset-password', optionalAuth, authController.renderResetPassword);

// ── POST /reset-password ─────────────────────────────────────────────────────
router.post('/reset-password', authLimiter, resetPasswordValidator, validateRequest, authController.resetPassword);

// ── GET /logout ───────────────────────────────────────────────────────────────
router.get('/logout', authController.logout);

module.exports = router;
