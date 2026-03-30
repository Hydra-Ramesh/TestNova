import { Router } from 'express';
import { getResults, getResultById, getAnalytics, downloadScorecard } from '../controllers/resultController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getResults);
router.get('/analytics', protect, getAnalytics);
router.get('/:id', protect, getResultById);
router.get('/:id/scorecard', protect, downloadScorecard);

export default router;
