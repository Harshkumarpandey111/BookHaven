const express = require('express');
const router = express.Router();

const authController = require('../../controllers/auth.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimit.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const {
	registerValidator,
	verifyEmailValidator,
	loginValidator,
	forgotPasswordValidator,
	resetPasswordValidator
} = require('../../validators/auth.validator');

router.post('/register', authLimiter, registerValidator, validateRequest, authController.register);
router.post('/verify-email', authLimiter, verifyEmailValidator, validateRequest, authController.verifyEmail);
router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validateRequest, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validateRequest, authController.resetPassword);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getProfile);

module.exports = router;
