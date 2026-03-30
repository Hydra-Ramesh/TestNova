import { useState } from 'react';
import { HiX } from 'react-icons/hi';

const BUTTONS = [
  ['7', '8', '9', '÷', 'C'],
  ['4', '5', '6', '×', '←'],
  ['1', '2', '3', '-', '('],
  ['0', '.', '±', '+', ')'],
  ['sin', 'cos', 'tan', 'log', '√'],
  ['π', 'e', '^', '!', '='],
];

export default function Calculator({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');

  const handleButton = (btn) => {
    switch (btn) {
      case 'C':
        setDisplay('0');
        setExpression('');
        break;
      case '←':
        setDisplay((prev) => prev.length > 1 ? prev.slice(0, -1) : '0');
        setExpression((prev) => prev.slice(0, -1));
        break;
      case '=':
        try {
          let expr = expression || display;
          expr = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, `${Math.PI}`)
            .replace(/e(?![x])/g, `${Math.E}`)
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)))
            .replace(/\^/g, '**');
          const result = Function('"use strict"; return (' + expr + ')')();
          setDisplay(String(parseFloat(result.toFixed(10))));
          setExpression('');
        } catch {
          setDisplay('Error');
          setTimeout(() => setDisplay('0'), 1500);
        }
        break;
      case '±':
        setDisplay((prev) => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
        break;
      case 'sin':
      case 'cos':
      case 'tan':
      case 'log':
      case '√':
        setExpression((prev) => prev + btn + '(');
        setDisplay((prev) => prev === '0' ? btn + '(' : prev + btn + '(');
        break;
      default:
        if (display === '0' && btn !== '.') {
          setDisplay(btn);
          setExpression(btn);
        } else {
          setDisplay((prev) => prev + btn);
          setExpression((prev) => prev + btn);
        }
    }
  };

  const factorial = (n) => {
    if (n < 0) return NaN;
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-80 p-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">Scientific Calculator</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Display */}
        <div className="bg-surface-900 rounded-xl p-4 mb-3 border border-white/5">
          <p className="text-xs text-gray-500 h-4 text-right overflow-hidden">{expression}</p>
          <p className="text-2xl font-mono font-bold text-right mt-1 overflow-x-auto">{display}</p>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          {BUTTONS.map((row, i) => (
            <div key={i} className="grid grid-cols-5 gap-2">
              {row.map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleButton(btn)}
                  className={`h-10 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    btn === '=' ? 'bg-primary-500 text-white hover:bg-primary-600' :
                    btn === 'C' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' :
                    ['÷', '×', '-', '+', '(', ')'].includes(btn) ? 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 border border-primary-500/20' :
                    ['sin', 'cos', 'tan', 'log', '√', 'π', 'e', '^', '!'].includes(btn) ? 'bg-surface-700 text-gray-300 hover:bg-surface-700/80 border border-white/5' :
                    'bg-surface-800 text-white hover:bg-surface-700 border border-white/10'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
