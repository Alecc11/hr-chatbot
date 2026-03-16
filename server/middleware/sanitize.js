'use strict';

const { body, validationResult } = require('express-validator');

// Validation rules for the live agent intake form
const intakeRules = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isAlpha().withMessage('First name must contain letters only.')
    .isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters.'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isAlpha().withMessage('Last name must contain letters only.')
    .isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters.'),

  body('employeeId')
    .trim()
    .notEmpty().withMessage('Employee ID is required.')
    .isAlphanumeric().withMessage('Employee ID must be alphanumeric.')
    .isLength({ min: 1, max: 20 }).withMessage('Employee ID must be between 1 and 20 characters.'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category value too long.'),

  body('topic')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Topic value too long.'),

  body('lang')
    .optional()
    .trim()
    .isIn(['en', 'es']).withMessage('Invalid language value.'),
];

// Validation rules for the HR dashboard login form
const loginRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 1, max: 50 }).withMessage('Username must be between 1 and 50 characters.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 1, max: 128 }).withMessage('Password exceeds maximum length.'),
];

// Middleware to check validation results and short-circuit with 400 on failure
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { intakeRules, loginRules, handleValidationErrors };
