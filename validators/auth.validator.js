const { body } = require('express-validator');

const passwordRules = body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/).withMessage('Password must include at least one uppercase letter')
  .matches(/[a-z]/).withMessage('Password must include at least one lowercase letter')
  .matches(/[0-9]/).withMessage('Password must include at least one number');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  passwordRules,
  body('confirm').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
];

const verifyEmailValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric().withMessage('OTP must be numeric')
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail()
];

const resetPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric().withMessage('OTP must be numeric'),
  passwordRules,
  body('confirm').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
];

module.exports = {
  registerValidator,
  verifyEmailValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};
