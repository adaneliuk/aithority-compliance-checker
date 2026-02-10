import { useState, useCallback } from 'react';
import type { WizardState, Flags, HistoryEntry, SetFlag, SystemInfo, SystemInfoField, WizardPhase } from '../types';
import { decisionTree } from '../data';

const createEmptyField = (): SystemInfoField => ({
  value: '',
  touched: false,
  error: null,
});

const initialSystemInfo: SystemInfo = {
  systemName: createEmptyField(),
  systemDescription: createEmptyField(),
  useCase: createEmptyField(),
  llmVersion: createEmptyField(),
  dataUse: createEmptyField(),
};

const initialState: WizardState = {
  phase: 'systemInfo' as WizardPhase,
  systemInfo: initialSystemInfo,
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
  setPhase: (phase: WizardPhase) => void;
  updateSystemInfoField: (field: keyof SystemInfo, value: string) => void;
  touchSystemInfoField: (field: keyof SystemInfo) => void;
  validateSystemInfoField: (field: keyof SystemInfo) => void;
  isSystemInfoValid: () => boolean;
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
    setState(prev => ({
      ...initialState,
      phase: 'systemInfo' as WizardPhase,
      systemInfo: prev.systemInfo,
    }));
    setHistoryStack([]);
  }, []);

  const getAnswersForQuestion = useCallback((questionId: string): number[] => {
    return state.answers[questionId] || [];
  }, [state.answers]);

  const setPhase = useCallback((phase: WizardPhase) => {
    setState(prev => ({ ...prev, phase }));
  }, []);

  const updateSystemInfoField = useCallback((field: keyof SystemInfo, value: string) => {
    setState(prev => ({
      ...prev,
      systemInfo: {
        ...prev.systemInfo,
        [field]: {
          ...prev.systemInfo[field],
          value,
          error: null,
        },
      },
    }));
  }, []);

  const touchSystemInfoField = useCallback((field: keyof SystemInfo) => {
    setState(prev => ({
      ...prev,
      systemInfo: {
        ...prev.systemInfo,
        [field]: {
          ...prev.systemInfo[field],
          touched: true,
        },
      },
    }));
  }, []);

  const validateSystemInfoField = useCallback((field: keyof SystemInfo) => {
    setState(prev => {
      const fieldData = prev.systemInfo[field];
      let error: string | null = null;

      if (!fieldData.value.trim()) {
        error = 'This field is required';
      } else if (fieldData.value.trim().length < 10) {
        error = 'Minimum 10 characters required';
      } else if (fieldData.value.length > 5000) {
        error = 'Maximum 5000 characters exceeded';
      }

      return {
        ...prev,
        systemInfo: {
          ...prev.systemInfo,
          [field]: {
            ...fieldData,
            touched: true,
            error,
          },
        },
      };
    });
  }, []);

  const isSystemInfoValid = useCallback((): boolean => {
    const { systemInfo } = state;
    const fields = Object.values(systemInfo) as SystemInfoField[];

    for (const field of fields) {
      const value = field.value.trim();
      if (!value || value.length < 10 || value.length > 5000) {
        return false;
      }
    }
    return true;
  }, [state.systemInfo]);

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
    setPhase,
    updateSystemInfoField,
    touchSystemInfoField,
    validateSystemInfoField,
    isSystemInfoValid,
  };
}
