import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const examGenerationValidation = [
  body('examType').isIn(['jee_main', 'jee_advanced', 'neet']).withMessage('Invalid exam type'),
  body('testType').isIn(['full_mock', 'subject_wise', 'chapter_wise']).withMessage('Invalid test type'),
  body('difficulty').isIn(['easy', 'medium', 'hard', 'mixed']).withMessage('Invalid difficulty'),
  handleValidationErrors,
];
