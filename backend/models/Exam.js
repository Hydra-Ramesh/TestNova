import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  examType: {
    type: String,
    enum: ['jee_main', 'jee_advanced', 'neet'],
    required: true,
  },
  testType: {
    type: String,
    enum: ['full_mock', 'subject_wise', 'chapter_wise'],
    required: true,
  },
  subjects: [String],
  chapters: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed',
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  duration: {
    type: Number,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  sections: [{
    name: String,
    subject: String,
    questionCount: Number,
    questionIds: [mongoose.Schema.Types.ObjectId],
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isAIGenerated: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model('Exam', examSchema);
