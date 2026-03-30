import { useState, useEffect, useRef, useCallback } from 'react';

export default function ExamTimer({ initialTime, onTimeUp, onSync }) {
  const [remaining, setRemaining] = useState(initialTime);
  const intervalRef = useRef(null);
  const syncRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          onTimeUp();
          return 0;
        }
        return next;
      });
    }, 1000);

    // Sync every 30 seconds
    syncRef.current = setInterval(() => {
      setRemaining((prev) => {
        onSync(prev);
        return prev;
      });
    }, 30000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(syncRef.current);
    };
  }, [initialTime]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const isWarning = remaining <= 600; // 10 minutes
  const isCritical = remaining <= 120; // 2 minutes

  const format = (n) => String(n).padStart(2, '0');

  return (
    <div className={`flex items-center gap-1 font-mono text-lg font-bold tracking-wider ${
      isCritical ? 'text-red-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-emerald-400'
    }`}>
      <div className="flex items-center gap-0.5 px-3 py-2 rounded-lg bg-surface-700 border border-white/10">
        {hours > 0 && (
          <>
            <span>{format(hours)}</span>
            <span className="text-gray-500 mx-0.5">:</span>
          </>
        )}
        <span>{format(minutes)}</span>
        <span className="text-gray-500 mx-0.5">:</span>
        <span>{format(seconds)}</span>
      </div>
      {isWarning && (
        <span className="text-xs ml-2 hidden md:block">
          {isCritical ? '⚠️ Hurry!' : '⏰ 10 min left'}
        </span>
      )}
    </div>
  );
}
