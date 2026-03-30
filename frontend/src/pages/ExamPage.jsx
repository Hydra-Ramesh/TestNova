import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setExam, setAnswer, clearAnswer, markForReview, goToQuestion, nextQuestion, prevQuestion, updateTimer, addViolation, setSubmitting, resetExam } from '../store/examSlice.js';
import { connectSocket, getSocket, disconnectSocket } from '../sockets/socketClient.js';
import api from '../services/api.js';
import QuestionPalette from '../components/exam/QuestionPalette.jsx';
import ExamTimer from '../components/exam/ExamTimer.jsx';
import Calculator from '../components/calculator/Calculator.jsx';

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentExam, session, questions, currentQuestionIndex, answers, questionStatuses, timeRemaining, isSubmitting, violations } = useSelector((state) => state.exam);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // Load exam
  useEffect(() => {
    const loadExam = async () => {
      try {
        const { data } = await api.get(`/exams/${examId}/start`);
        dispatch(setExam({ exam: data.exam, session: data.session }));
        setLoading(false);

        // Connect socket
        const socket = connectSocket();
        socketRef.current = socket;

        socket.emit('exam_start', { examId, sessionId: data.session._id });

        socket.on('warning_event', (data) => {
          setWarning(data.message);
          setTimeout(() => setWarning(''), 5000);
        });

        socket.on('exam_terminated', (data) => {
          alert(data.message);
          handleSubmit(true);
        });

        socket.on('answer_saved', (data) => {
          // Silent save confirmation
        });
      } catch (error) {
        alert('Failed to load exam');
        navigate('/exam-selection');
      }
    };
    loadExam();

    return () => {
      disconnectSocket();
    };
  }, [examId]);

  // Anti-cheating
  useEffect(() => {
    if (!session) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        dispatch(addViolation());
        getSocket()?.emit('violation', { sessionId: session._id, type: 'tab_switch' });
      }
    };

    const handleBlur = () => {
      dispatch(addViolation());
      getSocket()?.emit('violation', { sessionId: session._id, type: 'window_blur' });
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [session]);

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const socket = getSocket();
      if (socket && Object.keys(answers).length > 0) {
        Object.entries(answers).forEach(([questionId, answer]) => {
          socket.emit('answer_update', {
            sessionId: session._id,
            questionId,
            answer,
            status: questionStatuses[questionId],
          });
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [session, answers, questionStatuses]);

  const handleSubmit = useCallback(async (forced = false) => {
    if (isSubmitting) return;
    if (!forced && !window.confirm('Are you sure you want to submit the exam?')) return;

    dispatch(setSubmitting(true));
    try {
      const socket = getSocket();
      socket?.emit('exam_submit', { sessionId: session._id });

      const { data } = await api.post(`/exams/${examId}/submit`, { answers });
      dispatch(resetExam());
      navigate(`/results/${data.result._id}`);
    } catch (error) {
      alert('Failed to submit exam');
      dispatch(setSubmitting(false));
    }
  }, [answers, session, examId, isSubmitting]);

  // Timer callback
  const handleTimeUp = useCallback(() => {
    handleSubmit(true);
  }, [handleSubmit]);

  const handleTimerSync = useCallback((remaining) => {
    dispatch(updateTimer(remaining));
    getSocket()?.emit('timer_sync', { sessionId: session?._id, timeRemaining: remaining });
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading exam...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id];
  const answeredCount = Object.values(questionStatuses).filter(s => s === 'answered' || s === 'answered_marked').length;
  const markedCount = Object.values(questionStatuses).filter(s => s === 'marked_review' || s === 'answered_marked').length;

  const handleAnswerSelect = (answer) => {
    if (currentQuestion.questionType === 'multiple_correct') {
      const current = Array.isArray(currentAnswer) ? currentAnswer : [];
      const updated = current.includes(answer) ? current.filter(a => a !== answer) : [...current, answer];
      dispatch(setAnswer({ questionId: currentQuestion.id, answer: updated }));
    } else {
      dispatch(setAnswer({ questionId: currentQuestion.id, answer }));
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col select-none">
      {/* Warning banner */}
      {warning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/90 text-white text-center py-3 font-semibold animate-slide-up">
          {warning}
        </div>
      )}

      {/* Top bar */}
      <div className="bg-surface-800 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm font-bold">T</div>
            <span className="font-semibold text-sm hidden md:block">{currentExam?.title}</span>
          </div>
        </div>

        <ExamTimer
          initialTime={currentExam?.duration * 60}
          onTimeUp={handleTimeUp}
          onSync={handleTimerSync}
        />

        <div className="flex items-center gap-3">
          <button onClick={() => setShowCalculator(!showCalculator)} className="btn-secondary text-sm px-3 py-2">
            🔢 Calc
          </button>
          <button onClick={() => setShowPalette(!showPalette)} className="btn-secondary text-sm px-3 py-2 lg:hidden">
            Palette
          </button>
          <button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="btn-primary text-sm px-4 py-2">
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Main exam area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question display */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Question header */}
          <div className="px-6 py-4 border-b border-white/5 bg-surface-800/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="badge-blue">{currentQuestion?.subject}</span>
              <span className="text-xs text-gray-500">{currentQuestion?.chapter}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="badge-green">{currentQuestion?.marks?.correct > 0 ? `+${currentQuestion.marks.correct}` : ''}</span>
              <span className="badge-red">{currentQuestion?.marks?.incorrect < 0 ? currentQuestion.marks.incorrect : ''}</span>
            </div>
          </div>

          {/* Question content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl">
              <p className="text-lg leading-relaxed mb-8 whitespace-pre-wrap">{currentQuestion?.question}</p>

              {/* Options */}
              {currentQuestion?.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = currentQuestion.questionType === 'multiple_correct'
                      ? (Array.isArray(currentAnswer) && currentAnswer.includes(option.id))
                      : currentAnswer === option.id;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-4 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/10 bg-surface-800 hover:border-white/20'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          isSelected ? 'bg-primary-500 text-white' : 'bg-surface-700 text-gray-400'
                        }`}>
                          {option.id}
                        </span>
                        <span className="text-sm leading-relaxed pt-1">{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Numerical input */}
              {(currentQuestion?.questionType === 'numerical' || currentQuestion?.questionType === 'integer') && (
                <div className="mt-4">
                  <label className="block text-sm text-gray-400 mb-2">Enter your answer:</label>
                  <input
                    type="number"
                    value={currentAnswer || ''}
                    onChange={(e) => dispatch(setAnswer({ questionId: currentQuestion.id, answer: e.target.value }))}
                    className="input-field max-w-xs"
                    placeholder="Enter numerical value"
                    step={currentQuestion.questionType === 'integer' ? '1' : 'any'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-white/5 bg-surface-800/30 flex items-center justify-between">
            <div className="flex gap-3">
              <button onClick={() => dispatch(prevQuestion())} disabled={currentQuestionIndex === 0} className="btn-secondary text-sm">
                ← Previous
              </button>
              <button
                onClick={() => dispatch(clearAnswer({ questionId: currentQuestion.id }))}
                className="btn-secondary text-sm"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => dispatch(markForReview({ questionId: currentQuestion.id }))}
                className="btn-secondary text-sm text-purple-400 border-purple-500/20"
              >
                Mark for Review
              </button>
              <button
                onClick={() => dispatch(nextQuestion())}
                disabled={currentQuestionIndex === questions.length - 1}
                className="btn-primary text-sm"
              >
                Save & Next →
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette */}
        {showPalette && (
          <QuestionPalette
            questions={questions}
            questionStatuses={questionStatuses}
            currentIndex={currentQuestionIndex}
            onGoTo={(i) => dispatch(goToQuestion(i))}
            answeredCount={answeredCount}
            markedCount={markedCount}
            totalCount={questions.length}
          />
        )}
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}
    </div>
  );
}
