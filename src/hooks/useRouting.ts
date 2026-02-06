import { useCallback } from 'react';
import type { DecisionNode, Flags, SetFlag } from '../types';
import { decisionTree } from '../data';
import {
  evaluateRouting,
  getAnswerFlags,
  isHubNode,
  evaluateHubNode,
} from '../utils/routing';

export interface UseRoutingReturn {
  getNextNode: (
    currentNodeId: string,
    selectedAnswers: number[],
    flags: Flags
  ) => { nextNodeId: string; flagsToSet: SetFlag[] } | null;

  getNode: (nodeId: string) => DecisionNode | undefined;

  getAllFlagsForAnswer: (
    node: DecisionNode,
    selectedAnswers: number[],
    currentFlags: Flags
  ) => SetFlag[];

  processHubNodes: (
    startNodeId: string,
    flags: Flags
  ) => { finalNodeId: string; accumulatedFlags: SetFlag[] };
}

export function useRouting(): UseRoutingReturn {
  const getNode = useCallback((nodeId: string): DecisionNode | undefined => {
    return decisionTree.nodes[nodeId];
  }, []);

  const getNextNode = useCallback((
    currentNodeId: string,
    selectedAnswers: number[],
    flags: Flags
  ): { nextNodeId: string; flagsToSet: SetFlag[] } | null => {
    const node = decisionTree.nodes[currentNodeId];
    if (!node) return null;

    return evaluateRouting(node, selectedAnswers, flags);
  }, []);

  const getAllFlagsForAnswer = useCallback((
    node: DecisionNode,
    selectedAnswers: number[],
    currentFlags: Flags
  ): SetFlag[] => {
    // Get flags from answer_flags
    const answerFlags = getAnswerFlags(node, selectedAnswers, currentFlags);

    // Get flags from routing
    const routingResult = evaluateRouting(node, selectedAnswers, currentFlags);
    const routingFlags = routingResult?.flagsToSet || [];

    // Combine all flags
    return [...answerFlags, ...routingFlags];
  }, []);

  const processHubNodes = useCallback((
    startNodeId: string,
    flags: Flags
  ): { finalNodeId: string; accumulatedFlags: SetFlag[] } => {
    let currentNodeId = startNodeId;
    let currentFlags = { ...flags };
    const accumulatedFlags: SetFlag[] = [];

    // Keep processing hub nodes until we reach a regular question node or END
    let iterations = 0;
    const maxIterations = 50; // Safety limit

    while (iterations < maxIterations) {
      iterations++;

      if (currentNodeId === 'END') {
        break;
      }

      const node = decisionTree.nodes[currentNodeId];
      if (!node) break;

      // If it's not a hub node, stop processing
      if (!isHubNode(node)) {
        break;
      }

      // Evaluate the hub node
      const result = evaluateHubNode(node, currentFlags);
      if (!result) break;

      // Apply flags from this hub
      for (const flag of result.flagsToSet) {
        currentFlags[flag.flag_name] = flag.value;
        accumulatedFlags.push(flag);
      }

      currentNodeId = result.nextNodeId;
    }

    return { finalNodeId: currentNodeId, accumulatedFlags };
  }, []);

  return {
    getNextNode,
    getNode,
    getAllFlagsForAnswer,
    processHubNodes,
  };
}
