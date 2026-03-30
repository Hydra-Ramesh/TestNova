import SyllabusDocument from '../models/SyllabusDocument.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalExams = await Exam.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalResults = await Result.countDocuments();

    const recentUsers = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email examsTaken createdAt');

    res.json({
      stats: { totalUsers, totalExams, totalQuestions, totalResults },
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSyllabusDocuments = async (req, res) => {
  try {
    const docs = await SyllabusDocument.find().sort({ createdAt: -1 });
    res.json({ documents: docs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addSyllabusDocument = async (req, res) => {
  try {
    const { title, content, subject, chapter, examType, tags } = req.body;
    const doc = await SyllabusDocument.create({ title, content, subject, chapter, examType, tags });

    // Trigger embedding generation in AI service
    try {
      await axios.post(`${AI_SERVICE_URL}/api/embeddings/process`, {
        document_id: doc._id.toString(),
        content,
        subject,
        chapter,
        exam_type: examType,
      });
      doc.isProcessed = true;
      await doc.save();
    } catch (err) {
      console.warn('AI embedding processing failed:', err.message);
    }

    res.status(201).json({ document: doc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSyllabusDocument = async (req, res) => {
  try {
    await SyllabusDocument.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addManualQuestion = async (req, res) => {
  try {
    const question = await Question.create({ ...req.body, isAIGenerated: false });
    res.status(201).json({ question });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 20, subject, examType } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (examType) filter.examType = examType;

    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(filter);
    res.json({ questions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
