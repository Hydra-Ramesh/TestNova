import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiMinusCircle } from 'react-icons/hi';
import api from '../services/api.js';
import ChatbotWidget from '../components/chatbot/ChatbotWidget.jsx';

export default function AnalysisPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeQuestion, setActiveQuestion] = useState(null);

  useEffect(() => {
    api.get(`/results/${id}`).then(res => {
      setResult(res.data.result);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const exam = result.examId;
  const questions = exam?.questions || [];
  const answers = result.answers || [];

  const filteredQuestions = questions.map((q, i) => {
    const answer = answers[i];
    return { ...q, answer, index: i };
  }).filter((q) => {
    if (filter === 'correct') return q.answer?.isCorrect;
    if (filter === 'wrong') return q.answer && !q.answer.isCorrect && q.answer.selectedAnswer != null;
    if (filter === 'unattempted') return !q.answer?.selectedAnswer && q.answer?.selectedAnswer !== 0;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Detailed Analysis</h1>
          <p className="text-gray-400 text-sm">{exam?.title}</p>
        </div>
        <Link to="/dashboard" className="btn-secondary text-sm">Back to Dashboard</Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'correct', 'wrong', 'unattempted'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? 'bg-primary-500/10 border border-primary-500/30 text-primary-300' : 'bg-surface-800 border border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({
              f === 'all' ? questions.length :
              f === 'correct' ? result.correctCount :
              f === 'wrong' ? result.wrongCount :
              result.unattempted
            })
          </button>
        ))}
      </div>

      {/* Question list */}
      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => {
          const isCorrect = q.answer?.isCorrect;
          const selectedAnswer = q.answer?.selectedAnswer;
          const isUnattempted = selectedAnswer === null || selectedAnswer === undefined;

          return (
            <div key={q._id || idx} className="glass-card overflow-hidden">
              {/* Question header */}
              <div className={`px-6 py-3 flex items-center justify-between border-b ${
                isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' :
                isUnattempted ? 'border-gray-500/20 bg-surface-800/50' :
                'border-red-500/20 bg-red-500/5'
              }`}>
                <div className="flex items-center gap-3">
                  {isCorrect ? <HiCheckCircle className="w-5 h-5 text-emerald-400" /> :
                   isUnattempted ? <HiMinusCircle className="w-5 h-5 text-gray-500" /> :
                   <HiXCircle className="w-5 h-5 text-red-400" />}
                  <span className="text-sm font-medium">Q{q.index + 1}</span>
                  <span className="badge-blue text-xs">{q.subject}</span>
                  <span className="text-xs text-gray-500">{q.chapter}</span>
                </div>
                <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-400' : isUnattempted ? 'text-gray-500' : 'text-red-400'}`}>
                  {q.answer?.marksAwarded > 0 ? '+' : ''}{q.answer?.marksAwarded || 0}
                </span>
              </div>

              {/* Question body */}
              <div className="p-6">
                <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{q.question}</p>

                {/* Options */}
                {q.options && (
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt) => {
                      const isSelected = Array.isArray(selectedAnswer) ? selectedAnswer.includes(opt.id) : selectedAnswer === opt.id;
                      const isCorrectOption = Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt.id) : q.correctAnswer === opt.id;

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-start gap-3 p-3 rounded-xl text-sm border ${
                            isCorrectOption ? 'border-emerald-500/30 bg-emerald-500/5' :
                            (isSelected && !isCorrect) ? 'border-red-500/30 bg-red-500/5' :
                            'border-white/5'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCorrectOption ? 'bg-emerald-500 text-white' :
                            (isSelected && !isCorrect) ? 'bg-red-500 text-white' :
                            'bg-surface-700 text-gray-400'
                          }`}>
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                          {isCorrectOption && <span className="ml-auto text-xs text-emerald-400">✓ Correct</span>}
                          {isSelected && !isCorrectOption && <span className="ml-auto text-xs text-red-400">✗ Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Numerical answer display */}
                {(q.questionType === 'numerical' || q.questionType === 'integer') && (
                  <div className="mb-4 text-sm">
                    <p className="text-gray-400">Your answer: <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedAnswer ?? 'Not answered'}</span></p>
                    <p className="text-gray-400">Correct answer: <span className="text-emerald-400 font-bold">{q.correctAnswer}</span></p>
                  </div>
                )}

                {/* Solution */}
                {q.solutionSteps && q.solutionSteps.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-primary-500/5 border border-primary-500/10">
                    <p className="text-sm font-semibold text-primary-400 mb-2">💡 Solution</p>
                    <div className="space-y-2">
                      {q.solutionSteps.map((step, si) => (
                        <p key={si} className="text-sm text-gray-300">
                          <span className="text-primary-400 font-mono mr-2">Step {step.step}:</span>
                          {step.content}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {q.conceptExplanation && (
                  <div className="mt-3 p-3 rounded-xl bg-surface-800 border border-white/5">
                    <p className="text-xs font-semibold text-gray-400 mb-1">📚 Concept</p>
                    <p className="text-sm text-gray-300">{q.conceptExplanation}</p>
                  </div>
                )}

                <button
                  onClick={() => setActiveQuestion(activeQuestion === q._id ? null : q._id)}
                  className="mt-3 text-xs text-primary-400 hover:text-primary-300"
                >
                  {activeQuestion === q._id ? 'Hide AI Tutor' : '🤖 Ask AI Tutor'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Chatbot */}
      <ChatbotWidget questionId={activeQuestion} />
    </div>
  );
}
