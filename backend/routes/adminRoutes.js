import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getDashboardStats,
  getSyllabusDocuments,
  addSyllabusDocument,
  deleteSyllabusDocument,
  addManualQuestion,
  getQuestions,
  deleteQuestion,
  deleteExam,
} from '../controllers/adminController.js';

const router = Router();

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/syllabus', getSyllabusDocuments);
router.post('/syllabus', addSyllabusDocument);
router.delete('/syllabus/:id', deleteSyllabusDocument);
router.get('/questions', getQuestions);
router.post('/questions', addManualQuestion);
router.delete('/questions/:id', deleteQuestion);
router.delete('/exams/:id', deleteExam);

export default router;
