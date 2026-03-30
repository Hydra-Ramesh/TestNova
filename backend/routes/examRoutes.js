import { Router } from 'express';
import { generateExam, startExam, submitExam, getExamConfig } from '../controllers/examController.js';
import { protect } from '../middleware/auth.js';
import { examGenerationValidation } from '../middleware/validator.js';

const router = Router();

router.get('/config', protect, getExamConfig);
router.post('/generate', protect, examGenerationValidation, generateExam);
router.get('/:examId/start', protect, startExam);
router.post('/:examId/submit', protect, submitExam);

export default router;
