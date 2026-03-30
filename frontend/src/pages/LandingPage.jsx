import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HiAcademicCap, HiLightningBolt, HiChartBar, HiChatAlt2 } from 'react-icons/hi';

const features = [
  { icon: HiLightningBolt, title: 'AI-Generated Tests', desc: 'Unlimited unique mock tests powered by AI for JEE & NEET', color: 'from-yellow-400 to-orange-500' },
  { icon: HiAcademicCap, title: 'Real CBT Simulation', desc: 'Experience the exact exam interface with timer, palette, and calculator', color: 'from-emerald-400 to-cyan-500' },
  { icon: HiChartBar, title: 'Deep Analytics', desc: 'Subject-wise, chapter-wise performance analysis with trend tracking', color: 'from-blue-400 to-indigo-500' },
  { icon: HiChatAlt2, title: 'AI Tutor', desc: 'Get step-by-step explanations and concept clarity from AI chatbot', color: 'from-purple-400 to-pink-500' },
];

export default function LandingPage() {
  const { token } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-surface-900 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-lg">T</div>
          <span className="text-xl font-bold gradient-text">TestNova</span>
        </div>
        <div className="flex items-center gap-4">
          {token ? (
            <Link to="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">Log In</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-primary-300">Powered by Groq AI & RAG Pipeline</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight animate-slide-up">
          Ace Your <span className="gradient-text">JEE & NEET</span>
          <br />With AI Mock Tests
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Generate unlimited unique practice tests, get real CBT experience, and receive AI-powered explanations — all in one platform.
        </p>

        <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/register" className="btn-primary text-lg px-8 py-4">
            Start Free Practice
          </Link>
          <Link to="/login" className="btn-secondary text-lg px-8 py-4">
            Login
          </Link>
        </div>

        {/* Exam badges */}
        <div className="flex items-center justify-center gap-3 mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {['JEE Main', 'JEE Advanced', 'NEET'].map((exam) => (
            <span key={exam} className="px-4 py-2 rounded-full bg-surface-800 border border-white/10 text-sm text-gray-300">
              {exam}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card-hover p-6 animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-32">
        <div className="glass-card p-12 text-center">
          <div className="grid grid-cols-3 gap-8">
            {[
              { num: '∞', label: 'Unique Tests' },
              { num: '1000+', label: 'Concept Topics' },
              { num: 'Real', label: 'CBT Experience' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{s.num}</div>
                <div className="text-gray-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-gray-500">
        <p>© 2026 TestNova. AI-Powered Exam Preparation Platform.</p>
      </footer>
    </div>
  );
}
