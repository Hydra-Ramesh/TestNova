import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiDownload, HiChartBar } from 'react-icons/hi';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../services/api.js';

export default function ResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/results/${id}`).then(res => {
      setResult(res.data.result);
      setLoading(false);
    });
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/results/${id}/scorecard`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `TestNova_Scorecard_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download scorecard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const pieData = [
    { name: 'Correct', value: result.correctCount, color: '#10b981' },
    { name: 'Wrong', value: result.wrongCount, color: '#ef4444' },
    { name: 'Unattempted', value: result.unattempted, color: '#475569' },
  ];

  const subjectData = result.subjectWise?.map(sw => ({
    subject: sw.subject,
    score: sw.score,
    accuracy: sw.accuracy,
  })) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Score Banner */}
      <div className="glass-card p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Exam Completed! 🎉</h1>
          <p className="text-gray-400 mb-6">{result.examId?.title}</p>

          <div className="text-6xl font-extrabold gradient-text mb-2">
            {result.score} / {result.totalMarks}
          </div>
          <p className="text-gray-400">
            Accuracy: <span className={`font-bold ${result.accuracy >= 70 ? 'text-emerald-400' : result.accuracy >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {result.accuracy?.toFixed(1)}%
            </span>
            {' • '}
            Percentile: <span className="font-bold text-primary-400">{result.percentile?.toFixed(1)}</span>
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Link to={`/analysis/${id}`} className="btn-primary flex items-center gap-2">
              <HiChartBar className="w-5 h-5" /> View Analysis
            </Link>
            <button onClick={handleDownloadPDF} className="btn-secondary flex items-center gap-2">
              <HiDownload className="w-5 h-5" /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card text-center">
          <HiCheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{result.correctCount}</p>
          <p className="text-sm text-gray-400">Correct</p>
        </div>
        <div className="stat-card text-center">
          <HiXCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-400">{result.wrongCount}</p>
          <p className="text-sm text-gray-400">Wrong</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-gray-400 mt-3">{result.unattempted}</p>
          <p className="text-sm text-gray-400">Unattempted</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-primary-400 mt-3">
            {Math.floor((result.timeTaken || 0) / 60)}m
          </p>
          <p className="text-sm text-gray-400">Time Taken</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Answer Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-gray-400">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Subject-wise Score</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }} />
              <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-center pb-8">
        <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
      </div>
    </div>
  );
}
