import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  },
  selectedAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: Boolean,
  marksAwarded: Number,
  timeTaken: Number, // seconds spent on this question
  status: {
    type: String,
    enum: ['not_visited', 'visited', 'answered', 'marked_review', 'answered_marked'],
    default: 'not_visited',
  },
}, { _id: false });

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  answers: [answerSchema],
  score: {
    type: Number,
    default: 0,
  },
  totalMarks: Number,
  correctCount: {
    type: Number,
    default: 0,
  },
  wrongCount: {
    type: Number,
    default: 0,
  },
  unattempted: {
    type: Number,
    default: 0,
  },
  accuracy: {
    type: Number,
    default: 0,
  },
  percentile: {
    type: Number,
    default: 0,
  },
  timeTaken: Number, // total seconds
  subjectWise: [{
    subject: String,
    score: Number,
    totalMarks: Number,
    correct: Number,
    wrong: Number,
    unattempted: Number,
    accuracy: Number,
  }],
  chapterWise: [{
    chapter: String,
    subject: String,
    correct: Number,
    wrong: Number,
    total: Number,
  }],
}, { timestamps: true });

resultSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Result', resultSchema);
