import { createContext, useContext } from 'react';

const ProblemWorkspaceContext = createContext(null);

export function ProblemWorkspaceProvider({ value, children }) {
  return (
    <ProblemWorkspaceContext.Provider value={value}>
      {children}
    </ProblemWorkspaceContext.Provider>
  );
}

export function useProblemWorkspace() {
  return useContext(ProblemWorkspaceContext);
}
