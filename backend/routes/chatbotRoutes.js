import { Router } from 'express';
import { sendMessage, explainQuestion } from '../controllers/chatbotController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/message', protect, sendMessage);
router.get('/explain/:questionId', protect, explainQuestion);

export default router;
