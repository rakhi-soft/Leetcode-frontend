import { useThemedBorder } from '../context/ThemeContext';

function TestResultPanel({ runResult, contrastPanel }) {
  const borders = useThemedBorder();

  if (!runResult) {
    return <div className="flex-1 p-4 text-base-content/60 text-sm">Click <strong>Run</strong> to execute your code against the testcases.</div>;
  }

  if (runResult.error && !runResult.testCases?.length) {
    return (
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="alert alert-error rounded-xl">
          <div><h4 className="font-bold">❌ Error</h4><p className="text-sm mt-2 whitespace-pre-wrap font-mono">{runResult.error}</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto min-h-0">
      <div className={`alert rounded-xl mb-4 ${runResult.success ? 'alert-success' : 'alert-error'}`}>
        <div className="w-full">
          {runResult.success ? (
            <><h4 className="font-bold">✅ All test cases passed!</h4><p className="text-sm mt-1">Runtime: {runResult.runtime} sec · Memory: {runResult.memory} KB</p></>
          ) : (
            <><h4 className="font-bold">❌ Some test cases failed</h4>{runResult.error && <p className="text-sm mt-1 whitespace-pre-wrap font-mono">{runResult.error}</p>}</>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {(runResult.testCases ?? []).map((tc, i) => {
          const hasExpected = Boolean(tc.expected_output?.trim());
          const passed = tc.status_id === 3;
          const ranOnly = tc.status_id === 6;
          return (
            <div key={i} className={`p-4 rounded-xl text-sm font-mono ${contrastPanel} border ${borders.card}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-base font-sans">Case {i + 1}</span>
                <span className={`text-xs font-sans ${passed ? 'text-success' : ranOnly ? 'text-base-content/60' : 'text-error'}`}>
                  {passed ? '✓ Passed' : ranOnly ? 'Ran' : tc.stderr ? '✗ Error' : '✗ Failed'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div><strong>Input:</strong><pre className="whitespace-pre-wrap mt-0.5">{tc.stdin || '(empty)'}</pre></div>
                {hasExpected && <div><strong>Expected:</strong><pre className="whitespace-pre-wrap mt-0.5">{tc.expected_output}</pre></div>}
                <div><strong>Output:</strong><pre className="whitespace-pre-wrap mt-0.5">{tc.stdout || '(empty)'}</pre></div>
                {tc.stderr && <div className="text-error"><strong>Stderr:</strong><pre className="whitespace-pre-wrap mt-0.5">{tc.stderr}</pre></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TestResultPanel;
