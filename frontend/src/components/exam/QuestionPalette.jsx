export default function QuestionPalette({ questions, questionStatuses, currentIndex, onGoTo, answeredCount, markedCount, totalCount }) {
  const getStatusClass = (questionId, index) => {
    if (index === currentIndex) return 'ring-2 ring-primary-400';
    const status = questionStatuses[questionId] || 'not_visited';
    switch (status) {
      case 'answered': return 'palette-answered';
      case 'visited': return 'palette-visited';
      case 'marked_review': return 'palette-marked';
      case 'answered_marked': return 'palette-answered-marked';
      default: return 'palette-not-visited';
    }
  };

  // Group by subject
  const grouped = {};
  questions.forEach((q, i) => {
    if (!grouped[q.subject]) grouped[q.subject] = [];
    grouped[q.subject].push({ ...q, index: i });
  });

  return (
    <div className="w-72 border-l border-white/5 bg-surface-800/50 flex flex-col overflow-hidden shrink-0">
      {/* Stats */}
      <div className="p-4 border-b border-white/5 space-y-2">
        <h3 className="font-semibold text-sm">Question Palette</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border palette-answered" />
            <span className="text-gray-400">Answered ({answeredCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border palette-not-visited" />
            <span className="text-gray-400">Not Visited ({totalCount - Object.keys(questionStatuses).filter(k => questionStatuses[k] !== 'not_visited').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border palette-visited" />
            <span className="text-gray-400">Not Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border palette-marked" />
            <span className="text-gray-400">Marked ({markedCount})</span>
          </div>
        </div>
      </div>

      {/* Question grid by subject */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(grouped).map(([subject, qs]) => (
          <div key={subject}>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">{subject}</p>
            <div className="grid grid-cols-5 gap-2">
              {qs.map((q) => (
                <button
                  key={q.id}
                  onClick={() => onGoTo(q.index)}
                  className={`w-10 h-10 rounded-lg border text-xs font-medium flex items-center justify-center transition-all hover:scale-105 ${getStatusClass(q.id, q.index)}`}
                >
                  {q.index + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
