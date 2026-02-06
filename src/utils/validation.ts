import type { Question, ValidationRule, Answers } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates the answer selection for a question
 */
export function validateAnswer(
  question: Question,
  selectedAnswers: number[],
  validationRule?: ValidationRule
): ValidationResult {
  const errors: string[] = [];

  // Check if required and has at least one selection
  if (question.required && selectedAnswers.length === 0) {
    errors.push('Please select at least one option');
    return { isValid: false, errors };
  }

  // Single choice validation
  if (question.type === 'single_choice') {
    if (selectedAnswers.length > 1) {
      errors.push('Please select only one option');
      return { isValid: false, errors };
    }
  }

  // Multiple choice validation with min/max if rule exists
  if (validationRule) {
    if (validationRule.min_selections && selectedAnswers.length < validationRule.min_selections) {
      errors.push(`Please select at least ${validationRule.min_selections} option(s)`);
    }
    if (validationRule.max_selections && selectedAnswers.length > validationRule.max_selections) {
      errors.push(`Please select at most ${validationRule.max_selections} option(s)`);
    }
  }

  // Check mutual exclusivity (e.g., "None of the above")
  const exclusiveOptions = question.options.filter(opt => opt.exclusive);
  if (exclusiveOptions.length > 0) {
    const exclusiveSelected = selectedAnswers.some(ans =>
      exclusiveOptions.some(opt => parseInt(opt.id) === ans)
    );

    if (exclusiveSelected && selectedAnswers.length > 1) {
      errors.push('The selected option cannot be combined with other options');
      return { isValid: false, errors };
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Checks if an option is exclusive (e.g., "None of the above")
 */
export function isExclusiveOption(question: Question, optionIndex: number): boolean {
  const option = question.options[optionIndex];
  return option?.exclusive === true;
}

/**
 * Handles selection with mutual exclusivity
 * Returns the new selection array after applying exclusivity rules
 */
export function handleSelectionWithExclusivity(
  question: Question,
  currentSelection: number[],
  toggledOption: number
): number[] {
  const isExclusive = isExclusiveOption(question, toggledOption);
  const wasSelected = currentSelection.includes(toggledOption);

  // For single choice, just return the new selection
  if (question.type === 'single_choice') {
    return wasSelected ? [] : [toggledOption];
  }

  // For multiple choice with exclusivity
  if (wasSelected) {
    // Deselecting
    return currentSelection.filter(opt => opt !== toggledOption);
  } else {
    // Selecting
    if (isExclusive) {
      // If selecting an exclusive option, clear all others
      return [toggledOption];
    } else {
      // If selecting a regular option, remove any exclusive options
      const exclusiveIndices = question.options
        .map((opt, idx) => opt.exclusive ? idx : -1)
        .filter(idx => idx !== -1);

      return [...currentSelection.filter(opt => !exclusiveIndices.includes(opt)), toggledOption];
    }
  }
}

/**
 * Checks if all required questions in the path have been answered
 */
export function hasRequiredAnswers(
  questionIds: string[],
  answers: Answers,
  questions: Record<string, Question>
): boolean {
  return questionIds.every(qId => {
    const question = questions[qId];
    if (!question?.required) return true;
    return answers[qId] && answers[qId].length > 0;
  });
}
