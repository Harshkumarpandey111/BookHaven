const express = require('express');
const router = express.Router();

const authController = require('../../controllers/auth.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimit.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { registerValidator, loginValidator } = require('../../validators/auth.validator');

router.post('/register', authLimiter, registerValidator, validateRequest, authController.register);
router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getProfile);

module.exports = router;
