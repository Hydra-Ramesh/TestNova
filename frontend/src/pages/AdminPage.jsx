import { useState, useEffect } from 'react';
import { HiUsers, HiClipboardList, HiDocumentText, HiPlus, HiTrash } from 'react-icons/hi';
import api from '../services/api.js';

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [newDoc, setNewDoc] = useState({ title: '', content: '', subject: '', chapter: '', examType: 'jee_main' });
  const [showAddDoc, setShowAddDoc] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, docsRes, qRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/syllabus'),
        api.get('/admin/questions?limit=20'),
      ]);
      setStats(statsRes.data.stats);
      setRecentUsers(statsRes.data.recentUsers);
      setDocuments(docsRes.data.documents);
      setQuestions(qRes.data.questions);
    } catch (err) {
      console.error('Admin load error:', err);
    }
  };

  const handleAddDocument = async () => {
    try {
      await api.post('/admin/syllabus', newDoc);
      setNewDoc({ title: '', content: '', subject: '', chapter: '', examType: 'jee_main' });
      setShowAddDoc(false);
      loadData();
    } catch (err) {
      alert('Failed to add document');
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/admin/syllabus/${id}`);
    loadData();
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    await api.delete(`/admin/questions/${id}`);
    loadData();
  };

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: HiClipboardList },
    { id: 'syllabus', label: 'Syllabus', icon: HiDocumentText },
    { id: 'questions', label: 'Questions', icon: HiClipboardList },
    { id: 'users', label: 'Users', icon: HiUsers },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-primary-500/10 border border-primary-500/30 text-primary-300' : 'bg-surface-800 border border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: stats.totalUsers, color: 'from-blue-500 to-indigo-600' },
            { label: 'Total Exams', value: stats.totalExams, color: 'from-emerald-500 to-teal-600' },
            { label: 'Total Questions', value: stats.totalQuestions, color: 'from-purple-500 to-pink-600' },
            { label: 'Total Results', value: stats.totalResults, color: 'from-amber-500 to-orange-600' },
          ].map((s) => (
            <div key={s.label} className="stat-card text-center">
              <p className="text-3xl font-bold gradient-text">{s.value}</p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Syllabus Management */}
      {tab === 'syllabus' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Syllabus Documents</h2>
            <button onClick={() => setShowAddDoc(!showAddDoc)} className="btn-primary text-sm flex items-center gap-2">
              <HiPlus className="w-4 h-4" /> Add Document
            </button>
          </div>

          {showAddDoc && (
            <div className="glass-card p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={newDoc.title} onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })} className="input-field" placeholder="Title" />
                <input value={newDoc.subject} onChange={(e) => setNewDoc({ ...newDoc, subject: e.target.value })} className="input-field" placeholder="Subject" />
                <input value={newDoc.chapter} onChange={(e) => setNewDoc({ ...newDoc, chapter: e.target.value })} className="input-field" placeholder="Chapter" />
                <select value={newDoc.examType} onChange={(e) => setNewDoc({ ...newDoc, examType: e.target.value })} className="input-field">
                  <option value="jee_main">JEE Main</option>
                  <option value="jee_advanced">JEE Advanced</option>
                  <option value="neet">NEET</option>
                </select>
              </div>
              <textarea value={newDoc.content} onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })} className="input-field h-32" placeholder="Document content..." />
              <div className="flex gap-3">
                <button onClick={handleAddDocument} className="btn-primary text-sm">Save Document</button>
                <button onClick={() => setShowAddDoc(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc._id} className="glass-card-hover p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{doc.title}</p>
                  <p className="text-xs text-gray-500">{doc.subject} • {doc.chapter} • {doc.examType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${doc.isProcessed ? 'badge-green' : 'badge-amber'}`}>
                    {doc.isProcessed ? 'Processed' : 'Pending'}
                  </span>
                  <button onClick={() => handleDeleteDoc(doc._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {documents.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No documents yet</p>}
          </div>
        </div>
      )}

      {/* Questions */}
      {tab === 'questions' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Questions</h2>
          {questions.map((q) => (
            <div key={q._id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{q.question}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="badge-blue">{q.subject}</span>
                    <span className="text-xs text-gray-500">{q.chapter}</span>
                    <span className={`badge ${q.isAIGenerated ? 'badge-green' : 'badge-amber'}`}>
                      {q.isAIGenerated ? 'AI' : 'Manual'}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleDeleteQuestion(q._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 shrink-0">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tests</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u._id} className="border-b border-white/5">
                  <td className="py-3 px-4 text-sm">{u.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">{u.email}</td>
                  <td className="py-3 px-4 text-sm">{u.examsTaken || 0}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
