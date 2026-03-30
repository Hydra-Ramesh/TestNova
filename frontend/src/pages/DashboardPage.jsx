import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAnalytics, fetchTestHistory } from '../store/dashboardSlice.js';
import { HiClipboardCheck, HiTrendingUp, HiStar, HiChartBar } from 'react-icons/hi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { analytics, testHistory, loading } = useSelector((state) => state.dashboard);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchAnalytics());
    dispatch(fetchTestHistory());
  }, [dispatch]);

  const subjectRadar = analytics?.subjectPerformance?.map(s => ({
    subject: s.subject,
    accuracy: parseFloat(s.accuracy),
    score: parseFloat(s.averageScore),
  })) || [];

  const trendData = analytics?.recentTrend?.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    score: parseFloat(t.score),
    accuracy: parseFloat(t.accuracy),
  })) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-400 mt-1">Here's your preparation overview</p>
        </div>
        <Link to="/exam-selection" className="btn-primary">
          Take New Test
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={HiClipboardCheck} title="Tests Taken" value={analytics?.totalTests || 0} color="from-primary-500 to-primary-600" />
        <StatCard icon={HiTrendingUp} title="Average Score" value={`${analytics?.averageScore || 0}%`} color="from-emerald-500 to-emerald-600" />
        <StatCard icon={HiStar} title="Accuracy" value={`${analytics?.averageAccuracy || 0}%`} color="from-amber-500 to-amber-600" />
        <StatCard icon={HiChartBar} title="Strong Topics" value={analytics?.strongTopics?.length || 0} color="from-cyan-500 to-cyan-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Score %" />
                <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Accuracy %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              Take tests to see your performance trend
            </div>
          )}
        </div>

        {/* Subject Performance */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
          {subjectRadar.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={subjectRadar}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                <PolarRadiusAxis stroke="#334155" fontSize={10} />
                <Radar name="Accuracy" dataKey="accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              Take tests to see subject analysis
            </div>
          )}
        </div>
      </div>

      {/* Weak / Strong topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-400">⚠ Weak Topics</h3>
          {analytics?.weakTopics?.length > 0 ? (
            <div className="space-y-3">
              {analytics.weakTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div>
                    <p className="text-sm font-medium">{t.chapter}</p>
                    <p className="text-xs text-gray-500">{t.subject}</p>
                  </div>
                  <span className="badge-red">{t.accuracy}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data yet</p>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-emerald-400">✓ Strong Topics</h3>
          {analytics?.strongTopics?.length > 0 ? (
            <div className="space-y-3">
              {analytics.strongTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div>
                    <p className="text-sm font-medium">{t.chapter}</p>
                    <p className="text-xs text-gray-500">{t.subject}</p>
                  </div>
                  <span className="badge-green">{t.accuracy}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* Recent Tests */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Test History</h3>
        {testHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Exam</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Accuracy</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {testHistory.slice(0, 10).map((r) => (
                  <tr key={r._id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="py-3 px-4 text-sm">{r.examId?.title || 'Mock Test'}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="font-semibold">{r.score}</span>
                      <span className="text-gray-500">/{r.totalMarks}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${r.accuracy >= 70 ? 'badge-green' : r.accuracy >= 40 ? 'badge-amber' : 'badge-red'}`}>
                        {r.accuracy?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/analysis/${r._id}`} className="text-sm text-primary-400 hover:text-primary-300">
                        View Analysis →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">No tests taken yet</p>
            <Link to="/exam-selection" className="btn-primary">Take Your First Test</Link>
          </div>
        )}
      </div>
    </div>
  );
}
