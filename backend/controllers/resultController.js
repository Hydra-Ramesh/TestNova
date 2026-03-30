import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import { generateScorecard } from '../services/pdfService.js';
import { cacheGet, cacheSet } from '../services/cacheService.js';

export const getResults = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user._id })
      .populate('examId', 'title examType testType duration')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate({
        path: 'examId',
        populate: { path: 'questions' },
      });

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const cacheKey = `analytics:${req.user._id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const results = await Result.find({ userId: req.user._id }).sort({ createdAt: -1 });

    if (results.length === 0) {
      return res.json({
        totalTests: 0,
        averageScore: 0,
        averageAccuracy: 0,
        subjectPerformance: [],
        weakTopics: [],
        strongTopics: [],
        recentTrend: [],
        chapterAnalysis: [],
      });
    }

    const totalTests = results.length;
    const averageScore = results.reduce((sum, r) => sum + (r.score / r.totalMarks) * 100, 0) / totalTests;
    const averageAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;

    // Subject performance aggregation
    const subjectData = {};
    results.forEach(r => {
      r.subjectWise.forEach(sw => {
        if (!subjectData[sw.subject]) {
          subjectData[sw.subject] = { subject: sw.subject, totalScore: 0, totalMarks: 0, correct: 0, wrong: 0, tests: 0 };
        }
        subjectData[sw.subject].totalScore += sw.score;
        subjectData[sw.subject].totalMarks += sw.totalMarks;
        subjectData[sw.subject].correct += sw.correct;
        subjectData[sw.subject].wrong += sw.wrong;
        subjectData[sw.subject].tests++;
      });
    });

    const subjectPerformance = Object.values(subjectData).map(s => ({
      subject: s.subject,
      averageScore: ((s.totalScore / s.totalMarks) * 100).toFixed(1),
      accuracy: ((s.correct / (s.correct + s.wrong || 1)) * 100).toFixed(1),
      testsCount: s.tests,
    }));

    // Chapter analysis
    const chapterData = {};
    results.forEach(r => {
      r.chapterWise.forEach(cw => {
        const key = `${cw.subject}-${cw.chapter}`;
        if (!chapterData[key]) {
          chapterData[key] = { chapter: cw.chapter, subject: cw.subject, correct: 0, wrong: 0, total: 0 };
        }
        chapterData[key].correct += cw.correct;
        chapterData[key].wrong += cw.wrong;
        chapterData[key].total += cw.total;
      });
    });

    const chapterAnalysis = Object.values(chapterData).map(c => ({
      ...c,
      accuracy: ((c.correct / c.total) * 100).toFixed(1),
    }));

    const sortedChapters = [...chapterAnalysis].sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
    const weakTopics = sortedChapters.slice(0, 5);
    const strongTopics = sortedChapters.slice(-5).reverse();

    // Recent trend (last 10 tests)
    const recentTrend = results.slice(0, 10).reverse().map(r => ({
      date: r.createdAt,
      score: ((r.score / r.totalMarks) * 100).toFixed(1),
      accuracy: r.accuracy.toFixed(1),
    }));

    const analytics = {
      totalTests,
      averageScore: averageScore.toFixed(1),
      averageAccuracy: averageAccuracy.toFixed(1),
      subjectPerformance,
      weakTopics,
      strongTopics,
      recentTrend,
      chapterAnalysis,
    };

    await cacheSet(cacheKey, analytics, 300); // 5 min cache
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadScorecard = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Result not found' });

    const exam = await Exam.findById(result.examId);
    const user = await User.findById(result.userId);

    const pdfBuffer = await generateScorecard(result, exam, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TestNova_Scorecard_${result._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
