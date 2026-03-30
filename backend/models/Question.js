import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['single_correct', 'multiple_correct', 'numerical', 'integer', 'matrix_match'],
    required: true,
  },
  options: [{
    id: String,
    text: String,
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  chapter: {
    type: String,
    required: true,
  },
  examType: {
    type: String,
    enum: ['jee_main', 'jee_advanced', 'neet'],
    required: true,
  },
  solutionSteps: [{
    step: Number,
    content: String,
  }],
  conceptExplanation: String,
  tags: [String],
  isAIGenerated: {
    type: Boolean,
    default: true,
  },
  marks: {
    correct: { type: Number, default: 4 },
    incorrect: { type: Number, default: -1 },
    partial: { type: Number, default: 0 },
  },
}, { timestamps: true });

questionSchema.index({ examType: 1, subject: 1, chapter: 1, difficulty: 1 });

export default mongoose.model('Question', questionSchema);
