const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must include at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must include at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must include at least one number'),
  body('confirm').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
  registerValidator,
  loginValidator
};
