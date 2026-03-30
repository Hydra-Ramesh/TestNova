import { createSlice } from '@reduxjs/toolkit';

const examSlice = createSlice({
  name: 'exam',
  initialState: {
    currentExam: null,
    session: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    questionStatuses: {},
    timeRemaining: 0,
    isSubmitting: false,
    violations: 0,
  },
  reducers: {
    setExam: (state, action) => {
      state.currentExam = action.payload.exam;
      state.session = action.payload.session;
      state.questions = action.payload.exam.questions || [];
      state.currentQuestionIndex = 0;
      state.timeRemaining = action.payload.exam.duration * 60;

      // Initialize statuses
      const statuses = {};
      state.questions.forEach((q) => {
        statuses[q.id] = 'not_visited';
      });
      if (state.questions.length > 0) {
        statuses[state.questions[0].id] = 'visited';
      }
      state.questionStatuses = statuses;

      // Restore answers from session
      if (action.payload.session?.currentAnswers) {
        const restored = {};
        Object.entries(action.payload.session.currentAnswers).forEach(([k, v]) => {
          restored[k] = v;
        });
        state.answers = restored;
      }
    },
    setAnswer: (state, action) => {
      const { questionId, answer } = action.payload;
      state.answers[questionId] = answer;
      state.questionStatuses[questionId] = 'answered';
    },
    clearAnswer: (state, action) => {
      const { questionId } = action.payload;
      delete state.answers[questionId];
      state.questionStatuses[questionId] = 'visited';
    },
    markForReview: (state, action) => {
      const { questionId } = action.payload;
      const hasAnswer = state.answers[questionId] !== undefined;
      state.questionStatuses[questionId] = hasAnswer ? 'answered_marked' : 'marked_review';
    },
    goToQuestion: (state, action) => {
      state.currentQuestionIndex = action.payload;
      const qId = state.questions[action.payload]?.id;
      if (qId && state.questionStatuses[qId] === 'not_visited') {
        state.questionStatuses[qId] = 'visited';
      }
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
        const qId = state.questions[state.currentQuestionIndex]?.id;
        if (qId && state.questionStatuses[qId] === 'not_visited') {
          state.questionStatuses[qId] = 'visited';
        }
      }
    },
    prevQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },
    updateTimer: (state, action) => {
      state.timeRemaining = action.payload;
    },
    addViolation: (state) => {
      state.violations += 1;
    },
    setSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },
    resetExam: (state) => {
      state.currentExam = null;
      state.session = null;
      state.questions = [];
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.questionStatuses = {};
      state.timeRemaining = 0;
      state.isSubmitting = false;
      state.violations = 0;
    },
  },
});

export const {
  setExam, setAnswer, clearAnswer, markForReview,
  goToQuestion, nextQuestion, prevQuestion,
  updateTimer, addViolation, setSubmitting, resetExam,
} = examSlice.actions;
export default examSlice.reducer;
