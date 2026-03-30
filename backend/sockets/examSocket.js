import ExamSession from '../models/ExamSession.js';
import jwt from 'jsonwebtoken';

export const setupExamSocket = (io) => {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'testnova_secret');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join user's room
    socket.join(`user:${socket.userId}`);

    // Exam start
    socket.on('exam_start', async ({ examId, sessionId }) => {
      socket.join(`exam:${sessionId}`);
      socket.examSessionId = sessionId;
      console.log(`📝 User ${socket.userId} started exam ${examId}`);
    });

    // Answer update (auto-save)
    socket.on('answer_update', async ({ sessionId, questionId, answer, status }) => {
      try {
        const session = await ExamSession.findById(sessionId);
        if (!session || session.status !== 'active') return;

        session.currentAnswers.set(questionId, answer);
        session.questionStatuses.set(questionId, status);
        await session.save();

        socket.emit('answer_saved', { questionId, saved: true });
      } catch (error) {
        socket.emit('answer_saved', { questionId, saved: false, error: error.message });
      }
    });

    // Timer sync
    socket.on('timer_sync', async ({ sessionId, timeRemaining }) => {
      try {
        await ExamSession.findByIdAndUpdate(sessionId, { timeRemaining });
        
        // Check time warning
        if (timeRemaining <= 600 && timeRemaining > 595) {
          socket.emit('warning_event', {
            type: 'time_warning',
            message: '⚠️ Only 10 minutes remaining!',
          });
        }
      } catch (error) {
        console.error('Timer sync error:', error.message);
      }
    });

    // Violation report
    socket.on('violation', async ({ sessionId, type }) => {
      try {
        const session = await ExamSession.findById(sessionId);
        if (!session || session.status !== 'active') return;

        session.violations.push({ type, timestamp: new Date() });
        session.violationCount += 1;
        await session.save();

        if (session.violationCount >= 2) {
          session.status = 'terminated';
          await session.save();
          socket.emit('exam_terminated', {
            message: 'Exam terminated due to multiple violations. Your answers have been auto-submitted.',
          });
        } else {
          socket.emit('warning_event', {
            type: 'violation_warning',
            message: `⚠️ Warning: ${type.replace('_', ' ')} detected. One more violation will terminate the exam.`,
            violationCount: session.violationCount,
          });
        }
      } catch (error) {
        console.error('Violation error:', error.message);
      }
    });

    // Exam submit
    socket.on('exam_submit', async ({ sessionId }) => {
      try {
        const session = await ExamSession.findById(sessionId);
        if (session) {
          session.status = 'completed';
          await session.save();
        }
        socket.leave(`exam:${sessionId}`);
      } catch (error) {
        console.error('Submit error:', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });
};
