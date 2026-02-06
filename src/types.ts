// Question Types
export interface QuestionOption {
  id: string;
  text: string;
  exclusive?: boolean;
}

export interface Question {
  id: string;
  original_id: string;
  text: string;
  section_title: string;
  type: 'single_choice' | 'multiple_choice';
  required: boolean;
  options: QuestionOption[];
}

export interface QuestionsData {
  metadata: {
    source: string;
    url: string;
    last_update_date: string;
    scraped_date: string;
    version: string;
    total_questions: number;
  };
  questions: Record<string, Question>;
}

// Decision Tree Types
export interface SetFlag {
  flag_name: string;
  value: boolean | string;
  condition?: RouteCondition[];
}

export interface RouteCondition {
  answer_is?: number;
  is_this_exact_match_selected?: number[];
  if_any_answer_in?: number[];
  if_none_selected_in?: number[];
  flag_equals?: {
    flag_name: string;
    value: string | boolean;
  };
}

export interface Route {
  conditions?: RouteCondition[];
  go_to: string;
  set_flags?: SetFlag[];
}

export interface AnswerFlagConfig {
  set_flags?: SetFlag[];
  exclusive?: boolean;
}

export interface DecisionNode {
  original_id: string;
  question_id: string;
  type: 'radio' | 'checkbox' | 'hub';
  routing: Route[];
  answer_flags?: Record<string, AnswerFlagConfig>;
}

export interface DecisionTreeData {
  metadata: {
    source: string;
    url: string;
    last_update_date: string;
    scraped_date: string;
    description: string;
  };
  start: string;
  nodes: Record<string, DecisionNode>;
}

// Outcomes Types
export interface Outcome {
  id: string;
  structure_level: 'role' | 'risk_level' | 'obligation';
  priority_weight: number;
  risk_level: string;
  display_color: string;
  text: string;
  applicable_articles: number[];
  is_empty: boolean;
}

export interface OutcomesData {
  metadata: {
    source: string;
    url: string;
    last_update_date: string;
    scraped_date: string;
    description: string;
    total_outcomes: number;
  };
  outcomes: Record<string, Outcome>;
}

// Validation Types
export interface MutualExclusivity {
  rule: string;
  exclusive_option: string;
  conflicts_with: string[];
}

export interface ValidationRule {
  required: boolean;
  type: 'single_choice' | 'multiple_choice';
  min_selections: number;
  max_selections?: number;
  mutual_exclusivity?: MutualExclusivity;
  short_circuit?: {
    rule: string;
    trigger_options: string[];
    immediate_outcome: string;
  };
}

export interface ValidationRulesData {
  metadata: {
    description: string;
    generated_from: string;
    version: string;
  };
  rules: Record<string, ValidationRule>;
  conditional_display: {
    description: string;
    rules: Record<string, { show_if: Record<string, string[]> }>;
  };
  notes: {
    general: string;
    exclusive_options: string;
    short_circuits: string;
  };
}

// UI Config Types
export interface RiskBadge {
  text: string;
  color: string;
  text_color: string;
  description: string;
}

export interface UIConfigData {
  metadata: {
    description: string;
    version: string;
  };
  app_config: {
    title: string;
    description: string;
    version: string;
    source: string;
    disclaimer: string;
  };
  theme: {
    primary_color: string;
    secondary_color: string;
    colors: Record<string, string>;
    risk_level_colors: Record<string, string>;
  };
  question_display: {
    show_progress_bar: boolean;
    show_question_numbers: boolean;
    show_section_titles: boolean;
    allow_back_navigation: boolean;
    show_help_text: boolean;
    animate_transitions: boolean;
    transition_duration_ms: number;
  };
  navigation: {
    show_back_button: boolean;
    show_next_button: boolean;
    show_restart_button: boolean;
    back_button_text: string;
    next_button_text: string;
    restart_button_text: string;
    view_results_button_text: string;
  };
  question_ui: {
    single_choice: {
      display_type: string;
      layout: string;
    };
    multiple_choice: {
      display_type: string;
      layout: string;
      show_select_all: boolean;
    };
  };
  outcome_display: {
    show_risk_badge: boolean;
    show_article_references: boolean;
    show_priority_weights: boolean;
    show_flag_ids: boolean;
    group_by_structure_level: boolean;
    structure_level_order: string[];
    show_export_button: boolean;
    export_formats: string[];
    format_outcome_text: {
      parse_markdown: boolean;
      preserve_line_breaks: boolean;
      make_links_clickable: boolean;
    };
  };
  risk_badges: Record<string, RiskBadge>;
  structure_level_headers: Record<string, string>;
  help_text: Record<string, string>;
  warnings: Record<string, {
    show: boolean;
    text: string;
    color: string;
  }>;
  loading: {
    spinner_type: string;
    loading_text: string;
    show_loading_screen: boolean;
  };
  accessibility: {
    keyboard_navigation: boolean;
    screen_reader_support: boolean;
    high_contrast_mode: boolean;
    focus_indicators: boolean;
  };
  responsive: {
    mobile_breakpoint: number;
    tablet_breakpoint: number;
    desktop_breakpoint: number;
  };
  analytics: {
    track_question_views: boolean;
    track_answer_selections: boolean;
    track_outcome_results: boolean;
  };
}

// Wizard State Types
export type FlagValue = boolean | string;
export type Flags = Record<string, FlagValue>;
export type Answers = Record<string, number[]>;

export interface WizardState {
  currentNodeId: string;
  answers: Answers;
  flags: Flags;
  history: string[];
  isComplete: boolean;
}

export interface HistoryEntry {
  nodeId: string;
  answers: number[];
  flags: Flags;
}

// Grouped Outcomes for Display
export interface GroupedOutcomes {
  role: Outcome[];
  risk_level: Outcome[];
  obligation: Outcome[];
}
