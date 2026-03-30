import axios from 'axios';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamSession from '../models/ExamSession.js';
import User from '../models/User.js';
import { cacheGet, cacheSet } from '../services/cacheService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const EXAM_CONFIGS = {
  jee_main: {
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    duration: 180,
    questionsPerSubject: { mcq: 20, numerical: 10 },
    totalQuestions: 90,
    totalMarks: 300,
    marking: { correct: 4, incorrect: -1, numerical_correct: 4, numerical_incorrect: 0 },
  },
  jee_advanced: {
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    duration: 180,
    totalQuestions: 54,
    totalMarks: 186,
    marking: { correct: 4, incorrect: -2, partial: 1, numerical_correct: 3, numerical_incorrect: 0 },
  },
  neet: {
    subjects: ['Physics', 'Chemistry', 'Biology'],
    duration: 200,
    questionsPerSubject: { section_a: 35, section_b: 15 },
    totalQuestions: 200,
    totalMarks: 720,
    marking: { correct: 4, incorrect: -1 },
  },
};

const SUBJECT_CHAPTERS = {
  Physics: ['Mechanics', 'Thermodynamics', 'Waves & Oscillations', 'Optics', 'Electrostatics', 'Current Electricity', 'Magnetism', 'EMI & AC', 'Modern Physics', 'Semiconductor'],
  Chemistry: ['Atomic Structure', 'Chemical Bonding', 'Thermodynamics', 'Equilibrium', 'Redox', 'Organic Chemistry', 'Coordination Compounds', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry'],
  Mathematics: ['Algebra', 'Trigonometry', 'Coordinate Geometry', 'Calculus', 'Vectors & 3D', 'Probability', 'Matrices', 'Complex Numbers', 'Sequences & Series', 'Differential Equations'],
  Biology: ['Cell Biology', 'Genetics', 'Ecology', 'Human Physiology', 'Plant Physiology', 'Biotechnology', 'Evolution', 'Reproduction', 'Microorganisms', 'Anatomy'],
};

export const generateExam = async (req, res) => {
  try {
    const { examType, testType, subjects, chapters, difficulty, questionCount } = req.body;
    const config = EXAM_CONFIGS[examType];
    if (!config) {
      return res.status(400).json({ error: 'Invalid exam type' });
    }

    let selectedSubjects = config.subjects;
    let selectedChapters = [];
    let numQuestions = config.totalQuestions;
    let duration = config.duration;

    if (testType === 'subject_wise' && subjects && subjects.length > 0) {
      selectedSubjects = subjects;
      numQuestions = questionCount || 30;
      duration = Math.ceil(numQuestions * 2);
    }

    if (testType === 'chapter_wise' && chapters && chapters.length > 0) {
      selectedChapters = chapters;
      numQuestions = questionCount || 20;
      duration = Math.ceil(numQuestions * 2.5);
    }

    // Call AI service to generate questions
    let questions = [];
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/generate/questions`, {
        exam_type: examType,
        subjects: selectedSubjects,
        chapters: selectedChapters,
        difficulty: difficulty || 'mixed',
        num_questions: numQuestions,
        test_type: testType,
      }, { timeout: 120000 });

      questions = aiResponse.data.questions;
    } catch (aiError) {
      console.error('AI service error, using fallback:', aiError.message);
      // Fallback: generate simple questions
      questions = generateFallbackQuestions(examType, selectedSubjects, numQuestions, difficulty);
    }

    // Save questions to DB
    const savedQuestions = await Question.insertMany(questions);
    const questionIds = savedQuestions.map(q => q._id);

    // Create sections
    const sections = selectedSubjects.map(subject => {
      const subjectQs = savedQuestions.filter(q => q.subject === subject);
      return {
        name: subject,
        subject,
        questionCount: subjectQs.length,
        questionIds: subjectQs.map(q => q._id),
      };
    });

    const totalMarks = savedQuestions.reduce((sum, q) => sum + q.marks.correct, 0);

    const exam = await Exam.create({
      title: `${examType.replace('_', ' ').toUpperCase()} - ${testType.replace('_', ' ')} Mock Test`,
      examType,
      testType,
      subjects: selectedSubjects,
      chapters: selectedChapters,
      difficulty: difficulty || 'mixed',
      questions: questionIds,
      duration,
      totalMarks,
      totalQuestions: savedQuestions.length,
      sections,
      createdBy: req.user._id,
      isAIGenerated: true,
    });

    await exam.populate('questions');

    res.status(201).json({
      exam: {
        id: exam._id,
        title: exam.title,
        examType: exam.examType,
        testType: exam.testType,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        totalQuestions: exam.totalQuestions,
        sections: exam.sections,
        questions: exam.questions.map(q => ({
          id: q._id,
          question: q.question,
          questionType: q.questionType,
          options: q.options,
          marks: q.marks,
          subject: q.subject,
          chapter: q.chapter,
        })),
      },
    });
  } catch (error) {
    console.error('Generate exam error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check for active session
    const existingSession = await ExamSession.findOne({
      userId: req.user._id,
      examId,
      status: 'active',
    });

    if (existingSession) {
      return res.json({
        session: existingSession,
        exam: {
          id: exam._id,
          title: exam.title,
          duration: exam.duration,
          questions: exam.questions.map(q => ({
            id: q._id,
            question: q.question,
            questionType: q.questionType,
            options: q.options,
            marks: q.marks,
            subject: q.subject,
            chapter: q.chapter,
          })),
          sections: exam.sections,
        },
      });
    }

    const session = await ExamSession.create({
      userId: req.user._id,
      examId,
      endsAt: new Date(Date.now() + exam.duration * 60 * 1000),
      timeRemaining: exam.duration * 60,
    });

    res.json({
      session,
      exam: {
        id: exam._id,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        totalQuestions: exam.totalQuestions,
        questions: exam.questions.map(q => ({
          id: q._id,
          question: q.question,
          questionType: q.questionType,
          options: q.options,
          marks: q.marks,
          subject: q.subject,
          chapter: q.chapter,
        })),
        sections: exam.sections,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;

    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const session = await ExamSession.findOne({
      userId: req.user._id,
      examId,
      status: 'active',
    });

    // Calculate results
    let score = 0, correctCount = 0, wrongCount = 0, unattempted = 0;
    const processedAnswers = [];
    const subjectMap = {};
    const chapterMap = {};

    exam.questions.forEach((question) => {
      const answer = answers?.[question._id.toString()];
      const subject = question.subject;
      const chapter = question.chapter;

      if (!subjectMap[subject]) {
        subjectMap[subject] = { subject, score: 0, totalMarks: question.marks.correct, correct: 0, wrong: 0, unattempted: 0, accuracy: 0 };
      } else {
        subjectMap[subject].totalMarks += question.marks.correct;
      }

      if (!chapterMap[`${subject}-${chapter}`]) {
        chapterMap[`${subject}-${chapter}`] = { chapter, subject, correct: 0, wrong: 0, total: 0 };
      }
      chapterMap[`${subject}-${chapter}`].total++;

      if (answer === null || answer === undefined || answer === '') {
        unattempted++;
        subjectMap[subject].unattempted++;
        processedAnswers.push({
          questionId: question._id,
          selectedAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
          status: 'not_visited',
        });
      } else {
        let isCorrect = false;
        if (question.questionType === 'multiple_correct') {
          const correct = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
          const selected = Array.isArray(answer) ? answer : [answer];
          isCorrect = correct.length === selected.length && correct.every(a => selected.includes(a));
        } else if (question.questionType === 'numerical' || question.questionType === 'integer') {
          isCorrect = parseFloat(answer) === parseFloat(question.correctAnswer);
        } else {
          isCorrect = answer === question.correctAnswer;
        }

        const marksAwarded = isCorrect ? question.marks.correct : question.marks.incorrect;
        score += marksAwarded;

        if (isCorrect) {
          correctCount++;
          subjectMap[subject].correct++;
          subjectMap[subject].score += question.marks.correct;
          chapterMap[`${subject}-${chapter}`].correct++;
        } else {
          wrongCount++;
          subjectMap[subject].wrong++;
          subjectMap[subject].score += question.marks.incorrect;
          chapterMap[`${subject}-${chapter}`].wrong++;
        }

        processedAnswers.push({
          questionId: question._id,
          selectedAnswer: answer,
          isCorrect,
          marksAwarded,
          status: 'answered',
        });
      }
    });

    // Calculate accuracy
    const attempted = correctCount + wrongCount;
    const accuracy = attempted > 0 ? (correctCount / attempted) * 100 : 0;
    const percentile = Math.min(99.9, Math.max(0, (score / exam.totalMarks) * 100 * 0.95 + Math.random() * 5));

    const subjectWise = Object.values(subjectMap).map(sw => ({
      ...sw,
      accuracy: (sw.correct + sw.wrong) > 0 ? (sw.correct / (sw.correct + sw.wrong)) * 100 : 0,
    }));

    const result = await (await import('../models/Result.js')).default.create({
      userId: req.user._id,
      examId,
      answers: processedAnswers,
      score,
      totalMarks: exam.totalMarks,
      correctCount,
      wrongCount,
      unattempted,
      accuracy,
      percentile,
      timeTaken: session ? (exam.duration * 60 - (session.timeRemaining || 0)) : exam.duration * 60,
      subjectWise,
      chapterWise: Object.values(chapterMap),
    });

    // Update session
    if (session) {
      session.status = 'completed';
      await session.save();
    }

    // Update user exam count
    await User.findByIdAndUpdate(req.user._id, { $inc: { examsTaken: 1 } });

    res.json({ result });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getExamConfig = async (req, res) => {
  res.json({ configs: EXAM_CONFIGS, chapters: SUBJECT_CHAPTERS });
};

// Fallback question generator (when AI service is unavailable)
function generateFallbackQuestions(examType, subjects, count, difficulty) {
  const questions = [];
  const perSubject = Math.ceil(count / subjects.length);
  const chapters = SUBJECT_CHAPTERS;

  subjects.forEach(subject => {
    const subjectChapters = chapters[subject] || ['General'];
    for (let i = 0; i < perSubject && questions.length < count; i++) {
      const chapter = subjectChapters[i % subjectChapters.length];
      const diff = difficulty === 'mixed' ? ['easy', 'medium', 'hard'][i % 3] : difficulty;
      questions.push({
        question: `[${subject}] ${chapter} - Practice Question ${i + 1}: This is a ${diff} level question about ${chapter.toLowerCase()} concepts. Solve the following problem.`,
        questionType: 'single_correct',
        options: [
          { id: 'A', text: `Option A for question ${i + 1}` },
          { id: 'B', text: `Option B for question ${i + 1}` },
          { id: 'C', text: `Option C for question ${i + 1}` },
          { id: 'D', text: `Option D for question ${i + 1}` },
        ],
        correctAnswer: 'A',
        difficulty: diff,
        subject,
        chapter,
        examType,
        solutionSteps: [{ step: 1, content: `Solution for this ${chapter} problem will be provided by AI.` }],
        conceptExplanation: `This question tests your understanding of ${chapter} in ${subject}.`,
        tags: [subject, chapter, diff],
        marks: { correct: 4, incorrect: -1, partial: 0 },
      });
    }
  });

  return questions;
}
