import type {
  DecisionNode,
  RouteCondition,
  Flags,
  SetFlag,
  AnswerFlagConfig
} from '../types';

/**
 * Evaluates a single routing condition against the current answers and flags
 */
function evaluateCondition(
  condition: RouteCondition,
  selectedAnswers: number[],
  flags: Flags
): boolean {
  // answer_is: Check if a specific single answer is selected (for radio)
  if (condition.answer_is !== undefined) {
    return selectedAnswers.includes(condition.answer_is);
  }

  // is_this_exact_match_selected: Check if exactly these answers are selected
  if (condition.is_this_exact_match_selected !== undefined) {
    const required = condition.is_this_exact_match_selected;
    if (selectedAnswers.length !== required.length) return false;
    return required.every(ans => selectedAnswers.includes(ans));
  }

  // if_any_answer_in: Check if any of these answers is selected
  if (condition.if_any_answer_in !== undefined) {
    return condition.if_any_answer_in.some(ans => selectedAnswers.includes(ans));
  }

  // if_none_selected_in: Check if none of these answers is selected
  if (condition.if_none_selected_in !== undefined) {
    return !condition.if_none_selected_in.some(ans => selectedAnswers.includes(ans));
  }

  // flag_equals: Check if a flag has a specific value
  if (condition.flag_equals !== undefined) {
    const { flag_name, value } = condition.flag_equals;
    return flags[flag_name] === value;
  }

  // No conditions means always true (default route)
  return true;
}

/**
 * Evaluates all conditions in a route (AND logic)
 */
function evaluateAllConditions(
  conditions: RouteCondition[] | undefined,
  selectedAnswers: number[],
  flags: Flags
): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = default route
  }
  return conditions.every(cond => evaluateCondition(cond, selectedAnswers, flags));
}

/**
 * Finds the next node based on current answers and flags
 * Returns the route that matches, including any flags to set
 */
export function evaluateRouting(
  node: DecisionNode,
  selectedAnswers: number[],
  flags: Flags
): { nextNodeId: string; flagsToSet: SetFlag[] } | null {
  for (const route of node.routing) {
    if (evaluateAllConditions(route.conditions, selectedAnswers, flags)) {
      return {
        nextNodeId: route.go_to,
        flagsToSet: route.set_flags || []
      };
    }
  }
  return null;
}

/**
 * Gets flags to set based on selected answers
 */
export function getAnswerFlags(
  node: DecisionNode,
  selectedAnswers: number[],
  currentFlags: Flags
): SetFlag[] {
  const flagsToSet: SetFlag[] = [];

  if (!node.answer_flags) return flagsToSet;

  for (const answerIndex of selectedAnswers) {
    const answerConfig = node.answer_flags[answerIndex.toString()] as AnswerFlagConfig | undefined;
    if (!answerConfig?.set_flags) continue;

    for (const flagConfig of answerConfig.set_flags) {
      // Check per-flag conditions if they exist (conditions are on individual flag items)
      if (flagConfig.condition && flagConfig.condition.length > 0) {
        const conditionsMet = flagConfig.condition.every(cond => {
          if (cond.flag_equals) {
            return currentFlags[cond.flag_equals.flag_name] === cond.flag_equals.value;
          }
          return true;
        });
        if (!conditionsMet) continue;
      }

      flagsToSet.push({ flag_name: flagConfig.flag_name, value: flagConfig.value });
    }
  }

  return flagsToSet;
}

/**
 * Applies flags to the current flags state
 */
export function applyFlags(currentFlags: Flags, flagsToSet: SetFlag[]): Flags {
  const newFlags = { ...currentFlags };
  for (const flag of flagsToSet) {
    newFlags[flag.flag_name] = flag.value;
  }
  return newFlags;
}

/**
 * Checks if a node is a hub node (evaluation node with no user interaction)
 */
export function isHubNode(node: DecisionNode): boolean {
  return node.type === 'hub' || node.question_id.includes('hub');
}

/**
 * Evaluates a hub node and returns the next node
 */
export function evaluateHubNode(
  node: DecisionNode,
  flags: Flags
): { nextNodeId: string; flagsToSet: SetFlag[] } | null {
  // Hub nodes evaluate routes based on current flags, not answers
  for (const route of node.routing) {
    if (evaluateAllConditions(route.conditions, [], flags)) {
      return {
        nextNodeId: route.go_to,
        flagsToSet: route.set_flags || []
      };
    }
  }
  return null;
}

/**
 * Determines which sub-questions should be shown based on parent question answers
 * Used for QAIS_6_4 sub-questions pattern
 */
export function shouldShowSubQuestion(
  subQuestionId: string,
  flags: Flags
): boolean {
  // Map sub-question IDs to their controlling flags
  const subQuestionFlagMap: Record<string, string> = {
    'QAIS_6_4_1': 'flag_should_ask_6_4_1',
    'QAIS_6_4_2': 'flag_should_ask_6_4_2',
    'QAIS_6_4_3': 'flag_should_ask_6_4_3',
    'QAIS_6_4_4': 'flag_should_ask_6_4_4',
    'QAIS_6_4_5': 'flag_should_ask_6_4_5',
    'QAIS_6_4_6': 'flag_should_ask_6_4_6',
    'QAIS_6_4_7': 'flag_should_ask_6_4_7',
  };

  const flagName = subQuestionFlagMap[subQuestionId];
  if (!flagName) return true; // Not a sub-question, always show

  return flags[flagName] === true;
}
