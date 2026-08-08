import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { ArrowDownUp, ChevronRight, Filter, Search, X } from 'lucide-react';
import { useThemedBorder } from '../context/ThemeContext';

const getDifficultyLabel = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'medium': return 'Med.';
    case 'hard': return 'Hard';
    default: return 'Easy';
  }
};

const getDifficultyColor = (difficulty, selected) => {
  if (selected) return 'text-inherit opacity-90';
  switch (difficulty?.toLowerCase()) {
    case 'medium': return 'text-[#ffa116]';
    case 'hard': return 'text-[#ff375f]';
    default: return 'text-[#00b8a3]';
  }
};

function SolvedRing({ solved, total }) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-2 text-xs text-base-content/60 shrink-0">
      <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r={radius} fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" />
        <circle cx="12" cy="12" r={radius} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-success" />
      </svg>
      <span>{solved}/{total} Solved</span>
    </div>
  );
}

function ProblemListDrawer({ open, onClose, problems = [], solvedProblems = [], currentProblemId }) {
  const navigate = useNavigate();
  const borders = useThemedBorder();
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [sortBy, setSortBy] = useState('number');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const numberedProblems = useMemo(
    () => problems.map((problem, index) => ({ ...problem, number: index + 1 })),
    [problems]
  );

  const solvedIds = useMemo(() => new Set(solvedProblems.map((p) => p._id)), [solvedProblems]);

  const filteredProblems = useMemo(() => {
    let list = [...numberedProblems];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (difficultyFilter !== 'all') {
      list = list.filter((p) => p.difficulty?.toLowerCase() === difficultyFilter);
    }
    list.sort((a, b) => {
      if (sortBy === 'title') {
        const cmp = a.title.localeCompare(b.title);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? a.number - b.number : b.number - a.number;
    });
    return list;
  }, [numberedProblems, search, difficultyFilter, sortAsc, sortBy]);

  const handleSelect = (id) => {
    navigate(`/problem/${id}`);
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <>
      <button type="button" className="fixed left-0 right-0 bottom-0 z-[200] bg-black/25" style={{ top: '6.5rem' }} onClick={onClose} aria-label="Close problem list" />
      <aside className={`fixed left-3 z-[210] w-[min(400px,90vw)] flex flex-col bg-base-100 rounded-xl border shadow-xl overflow-hidden ${borders.card}`} style={{ top: '7.25rem', bottom: '0.75rem' }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
          <button type="button" className="flex items-center gap-0.5 font-semibold text-sm hover:opacity-80" onClick={onClose}>
            Problem List <ChevronRight size={16} className="opacity-60" />
          </button>
          <div className="flex items-center gap-3">
            <SolvedRing solved={solvedProblems.length} total={problems.length} />
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-square h-8 min-h-8 w-8 rounded-lg" aria-label="Close"><X size={18} /></button>
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center gap-2 shrink-0">
          <label className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions" className={`w-full h-9 pl-9 pr-3 text-sm rounded-full border bg-base-100 outline-none focus:border-primary/50 ${borders.card}`} />
          </label>
          <button type="button" onClick={() => { if (sortBy === 'number') setSortAsc((v) => !v); else { setSortBy('number'); setSortAsc(true); } }} className="btn btn-ghost btn-sm btn-square h-9 min-h-9 w-9 rounded-full border border-base-300" aria-label="Sort"><ArrowDownUp size={16} /></button>
          <div className="relative">
            <button type="button" onClick={() => setFilterOpen((v) => !v)} className={`btn btn-ghost btn-sm btn-square h-9 min-h-9 w-9 rounded-full border ${difficultyFilter !== 'all' ? 'border-primary text-primary' : 'border-base-300'}`} aria-label="Filter"><Filter size={16} /></button>
            {filterOpen && (
              <ul className={`absolute right-0 top-full mt-1 z-10 menu bg-base-100 rounded-lg w-36 p-1 shadow-lg border ${borders.card}`}>
                {['all', 'easy', 'medium', 'hard'].map((v) => (
                  <li key={v}><button type="button" className={difficultyFilter === v ? 'active' : ''} onClick={() => { setDifficultyFilter(v); setFilterOpen(false); }}>{v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}</button></li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
          <ul className="space-y-0.5">
            {filteredProblems.map((problem) => {
              const selected = problem._id === currentProblemId;
              return (
                <li key={problem._id}>
                  <button type="button" onClick={() => handleSelect(problem._id)} className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${selected ? 'bg-neutral text-neutral-content font-medium' : 'hover:bg-base-200'}`}>
                    <span className="truncate">{problem.number}. {problem.title}{solvedIds.has(problem._id) && <span className="ml-1.5 text-success text-xs">✓</span>}</span>
                    <span className={`shrink-0 text-xs font-normal ${getDifficultyColor(problem.difficulty, selected)}`}>{getDifficultyLabel(problem.difficulty)}</span>
                  </button>
                </li>
              );
            })}
            {filteredProblems.length === 0 && <li className="text-center text-sm text-base-content/50 py-8">No problems found</li>}
          </ul>
        </div>
      </aside>
    </>,
    document.body
  );
}

export default ProblemListDrawer;
