// Data exports - import the JSON files directly
import questionsData from './questions.json';
import outcomesData from './outcomes.json';
import decisionTreeData from './decision_tree.json';
import validationRulesData from './validation_rules.json';
import uiConfigData from './ui_config.json';

import type {
  QuestionsData,
  OutcomesData,
  DecisionTreeData,
  ValidationRulesData,
  UIConfigData
} from '../types';

export const questions = questionsData as QuestionsData;
export const outcomes = outcomesData as OutcomesData;
export const decisionTree = decisionTreeData as DecisionTreeData;
export const validationRules = validationRulesData as ValidationRulesData;
export const uiConfig = uiConfigData as UIConfigData;
