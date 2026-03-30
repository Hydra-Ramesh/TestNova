import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
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
  currentAnswers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map(),
  },
  questionStatuses: {
    type: Map,
    of: String,
    default: new Map(),
  },
  currentQuestionIndex: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endsAt: {
    type: Date,
    required: true,
  },
  timeRemaining: {
    type: Number, // seconds
  },
  violations: [{
    type: {
      type: String,
      enum: ['tab_switch', 'window_blur', 'page_refresh', 'multi_device', 'copy_paste'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  violationCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated', 'expired'],
    default: 'active',
  },
}, { timestamps: true });

examSessionSchema.index({ userId: 1, status: 1 });

export default mongoose.model('ExamSession', examSessionSchema);
