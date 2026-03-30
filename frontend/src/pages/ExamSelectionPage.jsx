import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiAcademicCap, HiLightningBolt, HiAdjustments, HiPlay } from 'react-icons/hi';
import api from '../services/api.js';

const EXAMS = [
  { id: 'jee_main', name: 'JEE Main', desc: '180 min • 90 questions • 300 marks', color: 'from-blue-500 to-indigo-600', icon: '🎯' },
  { id: 'jee_advanced', name: 'JEE Advanced', desc: '180 min • 54 questions • 186 marks', color: 'from-purple-500 to-pink-600', icon: '🚀' },
  { id: 'neet', name: 'NEET', desc: '200 min • 200 questions • 720 marks', color: 'from-emerald-500 to-teal-600', icon: '🧬' },
];

const TEST_TYPES = [
  { id: 'full_mock', name: 'Full Mock Test', desc: 'Complete exam simulation' },
  { id: 'subject_wise', name: 'Subject-wise', desc: 'Focus on one subject' },
  { id: 'chapter_wise', name: 'Chapter-wise', desc: 'Practice specific chapters' },
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Easy', color: 'text-emerald-400' },
  { id: 'medium', name: 'Medium', color: 'text-amber-400' },
  { id: 'hard', name: 'Hard', color: 'text-red-400' },
  { id: 'mixed', name: 'Mixed', color: 'text-primary-400' },
];

export default function ExamSelectionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [examType, setExamType] = useState('');
  const [testType, setTestType] = useState('full_mock');
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [difficulty, setDifficulty] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(30);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.get('/exams/config').then(res => setConfig(res.data));
  }, []);

  const availableSubjects = config?.configs?.[examType]?.subjects || [];
  const availableChapters = subjects.length > 0
    ? subjects.flatMap(s => config?.chapters?.[s] || [])
    : [];

  const handleSubjectToggle = (subject) => {
    setSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };

  const handleChapterToggle = (chapter) => {
    setChapters(prev => prev.includes(chapter) ? prev.filter(c => c !== chapter) : [...prev, chapter]);
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/exams/generate', {
        examType,
        testType,
        subjects: testType !== 'full_mock' ? subjects : undefined,
        chapters: testType === 'chapter_wise' ? chapters : undefined,
        difficulty,
        questionCount: testType !== 'full_mock' ? questionCount : undefined,
      });
      navigate(`/exam/${data.exam.id}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to generate exam');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Take a Test</h1>
        <p className="text-gray-400 mt-1">Configure your AI-generated mock test</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-primary-500 text-white' : 'bg-surface-700 text-gray-500'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-16 h-0.5 ${step > s ? 'bg-primary-500' : 'bg-surface-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Exam Type */}
      {step === 1 && (
        <div className="space-y-4 animate-slide-up">
          <h2 className="text-xl font-semibold">Select Exam</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXAMS.map((exam) => (
              <button
                key={exam.id}
                onClick={() => { setExamType(exam.id); setStep(2); }}
                className={`glass-card-hover p-6 text-left transition-all ${examType === exam.id ? 'border-primary-500/50 shadow-primary-500/10 shadow-lg' : ''}`}
              >
                <span className="text-3xl mb-3 block">{exam.icon}</span>
                <h3 className="text-lg font-bold mb-1">{exam.name}</h3>
                <p className="text-sm text-gray-400">{exam.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Test Type & Subject */}
      {step === 2 && (
        <div className="space-y-6 animate-slide-up">
          <h2 className="text-xl font-semibold">Test Configuration</h2>

          {/* Test type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Test Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TEST_TYPES.map((tt) => (
                <button
                  key={tt.id}
                  onClick={() => { setTestType(tt.id); setSubjects([]); setChapters([]); }}
                  className={`p-4 rounded-xl border text-left transition-all ${testType === tt.id ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-surface-800 hover:border-white/20'}`}
                >
                  <p className="font-medium text-sm">{tt.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{tt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Subject selection */}
          {testType !== 'full_mock' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Select Subject(s)</label>
              <div className="flex flex-wrap gap-3">
                {availableSubjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => handleSubjectToggle(sub)}
                    className={`px-4 py-2 rounded-xl border text-sm transition-all ${subjects.includes(sub) ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chapter selection */}
          {testType === 'chapter_wise' && subjects.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Select Chapter(s)</label>
              <div className="flex flex-wrap gap-2">
                {availableChapters.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => handleChapterToggle(ch)}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${chapters.includes(ch) ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question count */}
          {testType !== 'full_mock' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Number of Questions: {questionCount}</label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={testType !== 'full_mock' && subjects.length === 0}
              className="btn-primary"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Difficulty & Start */}
      {step === 3 && (
        <div className="space-y-6 animate-slide-up">
          <h2 className="text-xl font-semibold">Difficulty & Start</h2>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Difficulty Level</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`p-4 rounded-xl border text-center transition-all ${difficulty === d.id ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-surface-800 hover:border-white/20'}`}
                >
                  <p className={`font-semibold ${d.color}`}>{d.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="glass-card p-6 space-y-3">
            <h3 className="font-semibold text-lg">Test Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Exam:</span> <span className="font-medium">{EXAMS.find(e => e.id === examType)?.name}</span></div>
              <div><span className="text-gray-400">Type:</span> <span className="font-medium">{TEST_TYPES.find(t => t.id === testType)?.name}</span></div>
              <div><span className="text-gray-400">Difficulty:</span> <span className="font-medium capitalize">{difficulty}</span></div>
              {testType !== 'full_mock' && (
                <div><span className="text-gray-400">Questions:</span> <span className="font-medium">{questionCount}</span></div>
              )}
              {subjects.length > 0 && (
                <div className="col-span-2"><span className="text-gray-400">Subjects:</span> <span className="font-medium">{subjects.join(', ')}</span></div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
            <button onClick={handleStart} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Test...
                </>
              ) : (
                <>
                  <HiPlay className="w-5 h-5" />
                  Start Test
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
