import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  LayoutGrid,
  List,
  Play,
  Shuffle,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useThemedBorder } from '../context/ThemeContext';

function ProblemEditorNavbar({
  problemId,
  problems = [],
  loading,
  chatOpen,
  listOpen,
  onRun,
  onSubmit,
  onToggleChatAI,
  onToggleProblemList,
}) {
  const navigate = useNavigate();
  const borders = useThemedBorder();

  const handleProblemListClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleProblemList?.();
  };

  const handleLogoClick = () => navigate('/');

  const currentIndex = problems.findIndex((p) => p._id === problemId);
  const prevId = currentIndex > 0 ? problems[currentIndex - 1]._id : null;
  const nextId =
    currentIndex >= 0 && currentIndex < problems.length - 1
      ? problems[currentIndex + 1]._id
      : null;

  const handleShuffle = () => {
    if (problems.length <= 1) return;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * problems.length);
    } while (problems[randomIndex]._id === problemId);
    navigate(`/problem/${problems[randomIndex]._id}`);
  };

  const iconBtn =
    'btn btn-ghost btn-sm btn-square h-8 min-h-8 w-8 rounded-lg text-base-content/70 hover:text-base-content hover:bg-base-200';

  return (
    <div
      className={`flex items-center justify-between gap-4 px-3 sm:px-4 h-12 min-h-12 bg-base-100 border-b shrink-0 ${borders.divider}`}
    >
      <div className="flex items-center gap-1 min-w-0">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex btn btn-ghost btn-sm h-8 min-h-8 px-2 rounded-lg font-bold text-primary"
          aria-label="Go to problem list"
        >
          {'</>'}
        </button>

        <div className={`hidden sm:block w-px h-5 mx-1 bg-base-300`} />

        <button
          type="button"
          onClick={handleProblemListClick}
          className={`btn btn-ghost btn-sm h-8 min-h-8 gap-1.5 px-2 rounded-lg font-medium text-sm ${listOpen ? 'bg-base-200' : ''}`}
        >
          <List size={16} />
          <span className="hidden md:inline">Problem List</span>
        </button>

        <button
          type="button"
          className={`${iconBtn} ${!prevId ? 'btn-disabled opacity-40' : ''}`}
          disabled={!prevId}
          onClick={() => prevId && navigate(`/problem/${prevId}`)}
          aria-label="Previous problem"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className={`${iconBtn} ${!nextId ? 'btn-disabled opacity-40' : ''}`}
          disabled={!nextId}
          onClick={() => nextId && navigate(`/problem/${nextId}`)}
          aria-label="Next problem"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className={iconBtn}
          onClick={handleShuffle}
          disabled={problems.length <= 1}
          aria-label="Random problem"
        >
          <Shuffle size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <button
          type="button"
          className={`${iconBtn} ${loading ? 'loading' : ''}`}
          onClick={onRun}
          disabled={loading}
          aria-label="Run code"
        >
          {!loading && <Play size={16} fill="currentColor" />}
        </button>

        <button
          type="button"
          className={`btn btn-sm h-8 min-h-8 rounded-lg gap-1.5 px-3 font-medium border-success text-success hover:bg-success/10 hover:border-success bg-transparent ${loading ? 'loading' : ''}`}
          onClick={onSubmit}
          disabled={loading}
        >
          {!loading && <Upload size={15} />}
          Submit
        </button>

        <div className={`hidden sm:block w-px h-5 mx-0.5 bg-base-300`} />

        <button
          type="button"
          className={`${iconBtn} ${chatOpen ? 'bg-secondary/15 text-secondary' : 'text-secondary hover:text-secondary'}`}
          onClick={onToggleChatAI}
          aria-label="Chat with AI"
          aria-pressed={chatOpen}
        >
          <Sparkles size={16} />
        </button>

        <button type="button" className={`hidden lg:flex ${iconBtn}`} aria-label="Layout">
          <LayoutGrid size={16} />
        </button>

        <div className="hidden md:flex items-center gap-1 px-2 h-8 rounded-lg text-sm text-base-content/60">
          <Flame size={16} className="text-warning" />
          <span>0</span>
        </div>
      </div>
    </div>
  );
}

export default ProblemEditorNavbar;
