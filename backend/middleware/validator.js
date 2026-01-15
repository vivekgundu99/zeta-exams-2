const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phoneNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phoneNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid phone number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// OTP validation
const validateOTP = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  handleValidationErrors
];

// User details validation
const validateUserDetails = [
  body('name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('profession')
    .isIn(['student', 'teacher'])
    .withMessage('Profession must be either student or teacher'),
  body('grade')
    .optional()
    .isIn(['9th', '10th', '11th', '12th', '12th passout', 'other'])
    .withMessage('Invalid grade'),
  body('exam')
    .isIn(['jee', 'neet'])
    .withMessage('Exam must be either jee or neet'),
  body('collegeName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('College name must not exceed 50 characters'),
  body('lifeAmbition')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Life ambition must not exceed 50 characters'),
  handleValidationErrors
];

// Gift code validation
const validateGiftCode = [
  body('code')
    .isLength({ min: 8, max: 8 })
    .isAlphanumeric()
    .withMessage('Gift code must be 8 alphanumeric characters'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateOTP,
  validateUserDetails,
  validateGiftCode,
  handleValidationErrors
};