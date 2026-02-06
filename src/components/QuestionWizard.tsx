import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useWizardState } from '../hooks/useWizardState';
import { useRouting } from '../hooks/useRouting';
import { questions, decisionTree, validationRules } from '../data';
import { validateAnswer } from '../utils/validation';
import { QuestionRenderer } from './QuestionRenderer';
import { ProgressTracker } from './ProgressTracker';
import { NavigationButtons } from './NavigationButtons';
import { OutcomeDisplay } from './OutcomeDisplay';

export const QuestionWizard: React.FC = () => {
  const {
    state,
    setCurrentNode,
    setAnswer,
    applyFlags,
    goBack,
    addToHistory,
    resetWizard,
    getAnswersForQuestion,
  } = useWizardState();

  const {
    getNextNode,
    getNode,
    getAllFlagsForAnswer,
    processHubNodes,
  } = useRouting();

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get current node and question
  const currentNode = useMemo(() => {
    return getNode(state.currentNodeId);
  }, [state.currentNodeId, getNode]);

  const currentQuestion = useMemo(() => {
    if (!currentNode) return null;
    return questions.questions[currentNode.question_id];
  }, [currentNode]);

  // Get current answers for this question
  const currentAnswers = useMemo(() => {
    return currentQuestion ? getAnswersForQuestion(currentQuestion.id) : [];
  }, [currentQuestion, getAnswersForQuestion]);

  // Estimate total steps (rough estimate based on typical paths)
  const totalSteps = useMemo(() => {
    return Object.keys(decisionTree.nodes).length;
  }, []);

  // Handle answer selection
  const handleSelectionChange = useCallback((answers: number[]) => {
    if (!currentQuestion) return;
    setAnswer(currentQuestion.id, answers);
    setValidationErrors([]);
  }, [currentQuestion, setAnswer]);

  // Handle navigation to next question
  const handleNext = useCallback(() => {
    if (!currentNode || !currentQuestion) return;

    // Validate current answer
    const rule = validationRules.rules[currentQuestion.id];
    const validation = validateAnswer(currentQuestion, currentAnswers, rule);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Save current state to history before moving
    addToHistory(state.currentNodeId, currentAnswers, state.flags);

    // Get all flags to set from this answer
    const flagsToSet = getAllFlagsForAnswer(currentNode, currentAnswers, state.flags);

    // Apply answer flags
    if (flagsToSet.length > 0) {
      applyFlags(flagsToSet);
    }

    // Get next node
    const nextResult = getNextNode(state.currentNodeId, currentAnswers, {
      ...state.flags,
      ...Object.fromEntries(flagsToSet.map(f => [f.flag_name, f.value])),
    });

    if (!nextResult) {
      console.error('No valid route found');
      return;
    }

    // Apply routing flags if any
    if (nextResult.flagsToSet.length > 0) {
      applyFlags(nextResult.flagsToSet);
    }

    // Process any hub nodes between current and next question
    const updatedFlags = {
      ...state.flags,
      ...Object.fromEntries(flagsToSet.map(f => [f.flag_name, f.value])),
      ...Object.fromEntries(nextResult.flagsToSet.map(f => [f.flag_name, f.value])),
    };

    const hubResult = processHubNodes(nextResult.nextNodeId, updatedFlags);

    // Apply hub flags if any
    if (hubResult.accumulatedFlags.length > 0) {
      applyFlags(hubResult.accumulatedFlags);
    }

    // Set the final node (after processing hubs)
    setCurrentNode(hubResult.finalNodeId);
  }, [
    currentNode,
    currentQuestion,
    currentAnswers,
    state,
    addToHistory,
    getAllFlagsForAnswer,
    applyFlags,
    getNextNode,
    processHubNodes,
    setCurrentNode,
  ]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    goBack();
    setValidationErrors([]);
  }, [goBack]);

  // Handle restart
  const handleRestart = useCallback(() => {
    resetWizard();
    setValidationErrors([]);
  }, [resetWizard]);

  // Check if can proceed
  const canGoNext = useMemo(() => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    return currentAnswers.length > 0;
  }, [currentQuestion, currentAnswers]);

  // Check if can go back
  const canGoBack = state.history.length > 0;

  // Process hub nodes on mount and when state changes
  useEffect(() => {
    const node = getNode(state.currentNodeId);
    if (node && node.type === 'hub') {
      const hubResult = processHubNodes(state.currentNodeId, state.flags);
      if (hubResult.finalNodeId !== state.currentNodeId) {
        if (hubResult.accumulatedFlags.length > 0) {
          applyFlags(hubResult.accumulatedFlags);
        }
        setCurrentNode(hubResult.finalNodeId);
      }
    }
  }, [state.currentNodeId, state.flags, getNode, processHubNodes, applyFlags, setCurrentNode]);

  // Show results if complete
  if (state.isComplete || state.currentNodeId === 'END') {
    return (
      <OutcomeDisplay
        flags={state.flags}
        onRestart={handleRestart}
      />
    );
  }

  // Show loading if no question
  if (!currentQuestion) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Tracker */}
      <ProgressTracker
        currentStep={state.history.length + 1}
        totalSteps={totalSteps}
        questionNumber={currentQuestion.original_id}
      />

      {/* Question */}
      <div className="card">
        <QuestionRenderer
          question={currentQuestion}
          selectedAnswers={currentAnswers}
          onSelectionChange={handleSelectionChange}
        />

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            {validationErrors.map((error, i) => (
              <p key={i} className="text-sm text-red-600">
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Navigation */}
        <NavigationButtons
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          isLastQuestion={false}
          onBack={handleBack}
          onNext={handleNext}
          onRestart={handleRestart}
          showRestart={state.history.length > 0}
        />
      </div>
    </div>
  );
};
