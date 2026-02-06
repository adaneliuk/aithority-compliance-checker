import { useState, useCallback } from 'react';
import type { WizardState, Flags, HistoryEntry, SetFlag } from '../types';
import { decisionTree } from '../data';

const initialState: WizardState = {
  currentNodeId: decisionTree.start,
  answers: {},
  flags: {},
  history: [],
  isComplete: false,
};

export interface UseWizardStateReturn {
  state: WizardState;
  setCurrentNode: (nodeId: string) => void;
  setAnswer: (questionId: string, answers: number[]) => void;
  applyFlags: (flags: SetFlag[]) => void;
  goBack: () => boolean;
  addToHistory: (nodeId: string, answers: number[], flags: Flags) => void;
  completeWizard: () => void;
  resetWizard: () => void;
  getAnswersForQuestion: (questionId: string) => number[];
}

export function useWizardState(): UseWizardStateReturn {
  const [state, setState] = useState<WizardState>(initialState);
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([]);

  const setCurrentNode = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      currentNodeId: nodeId,
      isComplete: nodeId === 'END',
    }));
  }, []);

  const setAnswer = useCallback((questionId: string, answers: number[]) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answers,
      },
    }));
  }, []);

  const applyFlags = useCallback((flagsToSet: SetFlag[]) => {
    setState(prev => {
      const newFlags = { ...prev.flags };
      for (const flag of flagsToSet) {
        newFlags[flag.flag_name] = flag.value;
      }
      return {
        ...prev,
        flags: newFlags,
      };
    });
  }, []);

  const addToHistory = useCallback((nodeId: string, answers: number[], flags: Flags) => {
    setHistoryStack(prev => [
      ...prev,
      { nodeId, answers, flags },
    ]);
    setState(prev => ({
      ...prev,
      history: [...prev.history, nodeId],
    }));
  }, []);

  const goBack = useCallback((): boolean => {
    if (historyStack.length === 0) return false;

    const previousEntry = historyStack[historyStack.length - 1];

    setHistoryStack(prev => prev.slice(0, -1));
    setState(prev => ({
      ...prev,
      currentNodeId: previousEntry.nodeId,
      history: prev.history.slice(0, -1),
      isComplete: false,
      // Restore the flags from before this question was answered
      flags: previousEntry.flags,
    }));

    return true;
  }, [historyStack]);

  const completeWizard = useCallback(() => {
    setState(prev => ({
      ...prev,
      isComplete: true,
    }));
  }, []);

  const resetWizard = useCallback(() => {
    setState(initialState);
    setHistoryStack([]);
  }, []);

  const getAnswersForQuestion = useCallback((questionId: string): number[] => {
    return state.answers[questionId] || [];
  }, [state.answers]);

  return {
    state,
    setCurrentNode,
    setAnswer,
    applyFlags,
    goBack,
    addToHistory,
    completeWizard,
    resetWizard,
    getAnswersForQuestion,
  };
}
