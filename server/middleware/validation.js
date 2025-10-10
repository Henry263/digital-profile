const { body, validationResult } = require('express-validator');

// Profile validation middleware
const validateProfile = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number required'),
  
  body('mobile')
    .optional()
    .isMobilePhone()
    .withMessage('Valid mobile number required'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Valid website URL required'),
  
  body('socialMedia.*.url')
    .optional()
    .isURL()
    .withMessage('Valid social media URL required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  }
];

// Rate limiting for specific endpoints
const createProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 profile updates per windowMs
  message: {
    success: false,
    message: 'Too many profile updates. Please try again later.'
  }
});

module.exports = {
  validateProfile,
  createProfileLimiter
};