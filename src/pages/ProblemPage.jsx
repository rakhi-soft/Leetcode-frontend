import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useParams, useSearchParams } from 'react-router';
import axiosClient from '../utils/axiosClient';
import SubmissionHistory from '../components/SubmissionHistory';
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import Navbar from '../components/Navbar';
import ProblemEditorNavbar from '../components/ProblemEditorNavbar';
import ProblemListDrawer from '../components/ProblemListDrawer';
import TestcasePanel from '../components/TestcasePanel';
import TestResultPanel from '../components/TestResultPanel';
import { getDifficultyBadgeClass, getTagBadgeClass, getSolvedBadgeClass } from '../utils/problemBadges';
import { ProblemWorkspaceProvider } from '../context/ProblemWorkspaceContext';
import { useMonacoTheme, useContrastPanelClass, useEditorSurfaceClass } from '../context/ThemeContext';

const languageAliases = {
  cpp: ['c++', 'cpp'],
  java: ['java'],
  javascript: ['javascript'],
};

const defaultStartCode = {
  javascript: 'function solution() {\n    // your code here\n}',
  java: 'class Solution {\n    public void solution() {\n        // your code here\n    }\n}',
  cpp: 'class Solution {\npublic:\n    // your code here\n};',
};

const findStartCode = (startCode, selectedLanguage) => {
  if (!startCode?.length) return defaultStartCode[selectedLanguage] || '';
  const aliases = languageAliases[selectedLanguage] || [selectedLanguage];
  const entry = startCode.find((sc) => aliases.includes(sc.language.toLowerCase()));
  return entry?.initialCode || defaultStartCode[selectedLanguage] || startCode[0]?.initialCode || '';
};

const getAvailableLanguages = () => ['javascript', 'java', 'cpp'];

const buildTestCasesFromProblem = (problem) =>
  (problem?.visibleTestCases ?? []).map((tc) => ({
    input: tc.input ?? '',
    output: tc.output ?? '',
  }));

function ProblemPage() {
  const [problem, setProblem] = useState(null);
  const [problems, setProblems] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [bottomTab, setBottomTab] = useState('testcase');
  const [chatOpen, setChatOpen] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [userTestCases, setUserTestCases] = useState([{ input: '', output: '' }]);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [runAllCases, setRunAllCases] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const listOpen = searchParams.get('list') === 'open';
  const editorRef = useRef(null);
  const { problemId } = useParams();
  const monacoTheme = useMonacoTheme();
  const contrastPanel = useContrastPanelClass();
  const editorSurface = useEditorSurfaceClass();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };
    const fetchSolved = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };
    fetchProblems();
    fetchSolved();
  }, []);

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        const availableLanguages = getAvailableLanguages();
        const language = availableLanguages.includes(selectedLanguage) ? selectedLanguage : availableLanguages[0];
        setProblem(response.data);
        setCode(findStartCode(response.data.startCode, language));
        setUserTestCases(buildTestCasesFromProblem(response.data));
        setActiveTestCaseIndex(0);
        setRunResult(null);
        if (language !== selectedLanguage) setSelectedLanguage(language);
      } catch (error) {
        console.error('Error fetching problem:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  useEffect(() => {
    if (problem) setCode(findStartCode(problem.startCode, selectedLanguage));
  }, [selectedLanguage, problem]);

  const toggleProblemList = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get('list') === 'open') next.delete('list');
      else next.set('list', 'open');
      return next;
    }, { replace: true });
  };

  const closeProblemList = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('list');
      return next;
    }, { replace: true });
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage,
        customTestCases: userTestCases,
        runCaseIndex: runAllCases ? undefined : activeTestCaseIndex,
      });
      setRunResult(response.data);
      setBottomTab('result');
    } catch (error) {
      const data = error.response?.data;
      const message = typeof data === 'string' ? data : data?.error || data?.message || error.message || 'Failed to run code';
      setRunResult({ success: false, error: message, testCases: [] });
      setBottomTab('result');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, { code, language: selectedLanguage });
      setSubmitResult(response.data);
      setBottomTab('submit');
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setBottomTab('submit');
    } finally {
      setLoading(false);
    }
  };

  const handleTestCaseChange = (index, field, value) => {
    setUserTestCases((cases) => cases.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc)));
  };

  const handleAddTestCase = () => {
    setUserTestCases((cases) => [...cases, { input: '', output: '' }]);
    setActiveTestCaseIndex(userTestCases.length);
  };

  const handleRemoveTestCase = (index) => {
    setUserTestCases((cases) => {
      const next = cases.filter((_, i) => i !== index);
      return next.length ? next : [{ input: '', output: '' }];
    });
    setActiveTestCaseIndex((current) => (current > index ? current - 1 : current === index ? Math.max(0, index - 1) : current));
  };

  const handleResetTestCases = () => {
    if (problem) {
      setUserTestCases(buildTestCasesFromProblem(problem));
      setActiveTestCaseIndex(0);
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const isProblemSolved = solvedProblems.some((sp) => sp._id === problemId);

  if (loading && !problem) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  return (
    <ProblemWorkspaceProvider value={{ listOpen, toggleProblemList, closeProblemList }}>
      <div className="h-screen flex flex-col overflow-hidden">
        <Navbar />
        <ProblemEditorNavbar
          problemId={problemId}
          problems={problems}
          loading={loading}
          chatOpen={chatOpen}
          listOpen={listOpen}
          onRun={handleRun}
          onSubmit={handleSubmitCode}
          onToggleChatAI={() => setChatOpen((open) => !open)}
          onToggleProblemList={toggleProblemList}
        />

        <ProblemListDrawer
          open={listOpen}
          onClose={closeProblemList}
          problems={problems}
          solvedProblems={solvedProblems}
          currentProblemId={problemId}
        />

        <div className="flex-1 min-h-0 bg-base-200 p-3 flex gap-3">
          {/* Left — Description */}
          <div className={`flex flex-col bg-base-100 rounded-xl border border-base-300 overflow-hidden shadow-sm min-w-0 ${chatOpen ? 'flex-[2]' : 'w-1/2'}`}>
            <div className="tabs tabs-bordered bg-base-100 border-b border-base-300 px-4 min-h-11">
              {['description', 'editorial', 'solutions', 'submissions'].map((tab) => (
                <button key={tab} className={`tab capitalize ${activeLeftTab === tab ? 'tab-active' : ''}`} onClick={() => setActiveLeftTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {problem && activeLeftTab === 'description' && (
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h1 className="text-2xl font-bold">{problem.title}</h1>
                    {isProblemSolved && (
                      <div className={`badge gap-1.5 rounded-full px-3 shrink-0 font-normal ${getSolvedBadgeClass()}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Solved
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`badge capitalize rounded-full px-3 font-normal ${getDifficultyBadgeClass(problem.difficulty)}`}>{problem.difficulty}</span>
                    <span className={`badge rounded-full px-3 font-normal ${getTagBadgeClass()}`}>{problem.tags}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{problem.description}</div>
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Examples:</h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className={`p-4 rounded-xl ${contrastPanel}`}>
                          <h4 className="font-semibold mb-2">Example {index + 1}:</h4>
                          <div className="space-y-2 text-sm font-mono">
                            <div><strong>Input:</strong> {example.input}</div>
                            <div><strong>Output:</strong> {example.output}</div>
                            <div><strong>Explanation:</strong> {example.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {problem && activeLeftTab === 'editorial' && <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} />}
              {problem && activeLeftTab === 'solutions' && (
                <div className="space-y-6">
                  {problem.referenceSolution?.map((solution, index) => (
                    <div key={index} className={`border rounded-xl overflow-hidden ${contrastPanel}`}>
                      <div className="px-4 py-2 border-b border-base-300 font-semibold">{problem.title} — {solution.language}</div>
                      <pre className={`p-4 text-sm overflow-x-auto font-mono ${editorSurface}`}><code>{solution.completeCode}</code></pre>
                    </div>
                  )) || <p className="text-base-content/60">No solutions available.</p>}
                </div>
              )}
              {problem && activeLeftTab === 'submissions' && <SubmissionHistory problemId={problemId} />}
            </div>
          </div>

          {/* Right — Code + Testcase split (LeetCode style) */}
          <div className={`flex flex-col bg-base-100 rounded-xl border border-base-300 overflow-hidden shadow-sm min-w-0 ${chatOpen ? 'flex-[2]' : 'w-1/2'}`}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-base-300 bg-base-100 shrink-0">
              <span className="text-sm font-medium">&lt;/&gt; Code</span>
              <div className="flex gap-2">
                {getAvailableLanguages().map((lang) => (
                  <button key={lang} className={`btn btn-xs rounded-lg ${selectedLanguage === lang ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedLanguage(lang)}>
                    {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                  </button>
                ))}
              </div>
            </div>

            <div className={`flex-1 min-h-0 ${editorSurface}`}>
              <Editor
                key={monacoTheme}
                height="100%"
                language={getLanguageForMonaco(selectedLanguage)}
                value={code}
                onChange={(v) => setCode(v || '')}
                onMount={(editor) => { editorRef.current = editor; }}
                theme={monacoTheme}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  alwaysConsumeMouseWheel: false,
                  tabSize: 2,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                }}
              />
            </div>

            {/* Bottom panel — Testcase / Test Result */}
            <div className="flex flex-col border-t border-base-300 h-[38%] min-h-[200px] max-h-[320px] shrink-0">
              <div className="flex items-center justify-between px-4 border-b border-base-300 bg-base-100 shrink-0">
                <div className="flex">
                  {[
                    { id: 'testcase', label: 'Testcase' },
                    { id: 'result', label: 'Test Result' },
                    { id: 'submit', label: 'Submit' },
                  ].map(({ id, label }) => (
                    <button key={id} className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${bottomTab === id ? 'border-primary text-primary font-medium' : 'border-transparent text-base-content/60 hover:text-base-content'}`} onClick={() => setBottomTab(id)}>
                      {label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-base-content/50 cursor-pointer pr-2">
                  <input type="checkbox" className="checkbox checkbox-xs rounded" checked={runAllCases} onChange={(e) => setRunAllCases(e.target.checked)} />
                  Run all
                </label>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {bottomTab === 'testcase' && (
                  <TestcasePanel
                    testCases={userTestCases}
                    activeIndex={activeTestCaseIndex}
                    onActiveIndexChange={setActiveTestCaseIndex}
                    onChangeCase={handleTestCaseChange}
                    onAddCase={handleAddTestCase}
                    onRemoveCase={handleRemoveTestCase}
                    onReset={handleResetTestCases}
                  />
                )}
                {bottomTab === 'result' && <TestResultPanel runResult={runResult} contrastPanel={contrastPanel} />}
                {bottomTab === 'submit' && (
                  <div className="flex-1 p-4 overflow-y-auto">
                    {submitResult ? (
                      <div className={`alert rounded-xl ${submitResult.accepted ? 'alert-success' : 'alert-error'}`}>
                        <div>
                          <h4 className="font-bold text-lg">{submitResult.accepted ? '🎉 Accepted' : `❌ ${submitResult.error}`}</h4>
                          <p className="mt-2 text-sm">Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                          {submitResult.accepted && <p className="text-sm">Runtime: {submitResult.runtime} sec · Memory: {submitResult.memory} KB</p>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-base-content/60 text-sm">Click Submit to evaluate against hidden test cases.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {chatOpen && problem && (
            <div className="w-[min(360px,32vw)] shrink-0 flex flex-col bg-base-100 rounded-xl border border-base-300 overflow-hidden shadow-sm">
              <ChatAi problem={problem} onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </ProblemWorkspaceProvider>
  );
}

export default ProblemPage;
