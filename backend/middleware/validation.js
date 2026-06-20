const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Validation failed", 
      errors: errors.array().map(e => e.msg) 
    });
  }
  next();
};

const loginRules = [
  body('slug')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Shop URL must be lowercase letters, numbers, and hyphens only'),
  body('pin')
    .trim()
    .isLength({ min: 4, max: 20 })
    .isNumeric()
    .withMessage('PIN must be 4-20 digits'),
];

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Shop name is required'),
  body('slug')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Shop URL must be lowercase letters, numbers, and hyphens only'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('adminPin')
    .trim()
    .isLength({ min: 4, max: 20 })
    .isNumeric()
    .withMessage('Admin PIN must be 4-20 digits'),
  body('adminName').trim().isLength({ min: 2, max: 100 }).withMessage('Admin name is required'),
];

module.exports = { validate, loginRules, registerRules };