import { Plus, RotateCcw } from 'lucide-react';
import { useThemedBorder } from '../context/ThemeContext';

function TestcasePanel({ testCases, activeIndex, onActiveIndexChange, onChangeCase, onAddCase, onRemoveCase, onReset }) {
  const borders = useThemedBorder();
  const activeCase = testCases[activeIndex] ?? { input: '', output: '' };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-base-300 overflow-x-auto shrink-0">
        {testCases.map((_, index) => (
          <button key={index} type="button" onClick={() => onActiveIndexChange(index)} className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${activeIndex === index ? 'bg-base-200 font-medium' : 'text-base-content/60 hover:bg-base-200/60'}`}>
            Case {index + 1}
          </button>
        ))}
        <button type="button" onClick={onAddCase} className="btn btn-ghost btn-sm btn-square h-8 min-h-8 w-8 rounded-lg shrink-0" aria-label="Add test case"><Plus size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <div>
          <label className="text-sm font-medium text-base-content/70 mb-2 block">Input</label>
          <textarea value={activeCase.input} onChange={(e) => onChangeCase(activeIndex, 'input', e.target.value)} placeholder="Enter custom input (stdin)" className={`w-full min-h-[120px] p-3 text-sm font-mono rounded-xl border bg-base-100 outline-none focus:border-primary/50 resize-y ${borders.card}`} />
        </div>
        <div>
          <label className="text-sm font-medium text-base-content/70 mb-2 block">Expected Output <span className="text-base-content/40 font-normal">(optional)</span></label>
          <textarea value={activeCase.output} onChange={(e) => onChangeCase(activeIndex, 'output', e.target.value)} placeholder="Leave empty to only see your program output" className={`w-full min-h-[80px] p-3 text-sm font-mono rounded-xl border bg-base-100 outline-none focus:border-primary/50 resize-y ${borders.card}`} />
        </div>
        {testCases.length > 1 && (
          <button type="button" onClick={() => onRemoveCase(activeIndex)} className="btn btn-ghost btn-sm text-error">Delete Case {activeIndex + 1}</button>
        )}
      </div>
      <div className="px-4 py-2 border-t border-base-300 shrink-0">
        <button type="button" onClick={onReset} className="btn btn-ghost btn-xs gap-1 rounded-lg"><RotateCcw size={12} />Reset Testcases</button>
      </div>
    </div>
  );
}

export default TestcasePanel;
