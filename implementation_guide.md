# EU AI Act Compliance Checker - Implementation Guide for Claude Code

## 📋 Overview

This guide provides everything Claude Code needs to build a fully functional EU AI Act Compliance Checker that replicates the official tool.

## 📂 Data Files

### Core Data Files (Required)
1. **questions__6_.json** - 30 questions with options
2. **decision_tree__3_.json** - 33 nodes with routing logic
3. **outcomes__3_.json** - 45 outcome flags

### Helper Files (Recommended)
4. **validation_rules.json** - Input validation rules
5. **ui_config.json** - UI styling and configuration

---

## 🏗️ Architecture

### Recommended Tech Stack
- **Framework**: React with TypeScript
- **State Management**: React Context or Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

### Component Structure
```
src/
├── App.tsx
├── components/
│   ├── QuestionWizard.tsx       # Main controller
│   ├── QuestionRenderer.tsx     # Renders questions
│   ├── ProgressTracker.tsx      # Progress bar
│   ├── OutcomeDisplay.tsx       # Results page
│   └── NavigationButtons.tsx    # Back/Next buttons
├── data/
│   ├── questions.json
│   ├── decision_tree.json
│   ├── outcomes.json
│   ├── validation_rules.json
│   └── ui_config.json
├── hooks/
│   ├── useWizardState.ts        # State management
│   └── useRouting.ts            # Navigation logic
└── utils/
    ├── routing.ts               # Route evaluation
    ├── validation.ts            # Input validation
    └── outcomeEvaluator.ts      # Flag evaluation
```

---

## 🔑 Core Concepts

### 1. Flag-Based State Management

The checker uses a **flag accumulation system**:
- As user answers questions, flags are set
- Flags accumulate throughout the journey
- At END node, all flags are evaluated
- Outcomes are displayed based on active flags

**Example:**
```typescript
interface WizardState {
  currentNode: string;
  answers: Record<string, string[]>;
  flags: Record<string, boolean>;
  history: string[];
}
```

### 2. Conditional Routing

Each node has routing rules evaluated **in order**:
```typescript
interface RoutingRule {
  conditions: Condition[];
  go_to: string;
  set_flags?: FlagSetting[];
}

interface Condition {
  answer_is?: number;
  is_this_exact_match_selected?: number[];
  flag_is_true?: string;
  one_or_more_are_selected?: number[];
}
```

**First matching condition wins!**

### 3. Question Types

- **radio** (single_choice): Select exactly 1 option
- **checkbox** (multiple_choice): Select 1+ options

### 4. Mutual Exclusivity

Some options (like "None of the above") are exclusive:
```json
{
  "5": {
    "exclusive": true
  }
}
```

If user selects an exclusive option, clear all others.

---

## 💻 Implementation Details

### Step 1: Load Data

```typescript
import questionsData from './data/questions.json';
import decisionTree from './data/decision_tree.json';
import outcomes from './data/outcomes.json';
import validationRules from './data/validation_rules.json';
import uiConfig from './data/ui_config.json';

// Type the data for TypeScript safety
type Questions = typeof questionsData.questions;
type DecisionTree = typeof decisionTree;
type Outcomes = typeof outcomes.outcomes;
```

### Step 2: Initialize State

```typescript
const [state, setState] = useState<WizardState>({
  currentNode: decisionTree.start, // "Q1"
  answers: {},
  flags: {},
  history: []
});
```

### Step 3: Handle Answer Selection

```typescript
function handleAnswer(questionId: string, selectedOptions: string[]) {
  // 1. Validate selection
  const validation = validateAnswer(questionId, selectedOptions);
  if (!validation.valid) {
    showError(validation.error);
    return;
  }
  
  // 2. Store answer
  setState(prev => ({
    ...prev,
    answers: {
      ...prev.answers,
      [questionId]: selectedOptions
    }
  }));
  
  // 3. Set answer-specific flags
  const node = decisionTree.nodes[state.currentNode];
  const answerFlags = node.answer_flags[selectedOptions[0]];
  if (answerFlags?.set_flags) {
    applyFlags(answerFlags.set_flags);
  }
  
  // 4. Navigate to next question
  const nextNode = evaluateRouting(node, selectedOptions, state.flags);
  navigateToNode(nextNode);
}
```

### Step 4: Evaluate Routing

```typescript
function evaluateRouting(
  node: DecisionNode, 
  selectedOptions: string[], 
  flags: Record<string, boolean>
): string {
  for (const route of node.routing) {
    if (evaluateConditions(route.conditions, selectedOptions, flags)) {
      // Apply route-specific flags
      if (route.set_flags) {
        applyFlags(route.set_flags);
      }
      return route.go_to;
    }
  }
  
  // Fallback (shouldn't happen with valid data)
  return "END";
}
```

### Step 5: Evaluate Conditions

```typescript
function evaluateConditions(
  conditions: Condition[],
  selectedOptions: string[],
  flags: Record<string, boolean>
): boolean {
  return conditions.every(condition => {
    if ('answer_is' in condition) {
      return selectedOptions.includes(String(condition.answer_is));
    }
    
    if ('is_this_exact_match_selected' in condition) {
      const expected = condition.is_this_exact_match_selected.map(String);
      return arraysEqual(selectedOptions.sort(), expected.sort());
    }
    
    if ('flag_is_true' in condition) {
      return flags[condition.flag_is_true] === true;
    }
    
    if ('one_or_more_are_selected' in condition) {
      const expected = condition.one_or_more_are_selected.map(String);
      return expected.some(opt => selectedOptions.includes(opt));
    }
    
    return false;
  });
}
```

### Step 6: Display Outcomes

When `nextNode === "END"`:

```typescript
function displayOutcomes(flags: Record<string, boolean>) {
  // 1. Filter to active flags
  const activeFlags = Object.entries(flags)
    .filter(([_, value]) => value)
    .map(([flagId, _]) => outcomes[flagId])
    .filter(outcome => !outcome.is_empty);
  
  // 2. Group by structure_level
  const grouped = {
    role: activeFlags.filter(f => f.structure_level === 'role'),
    risk_level: activeFlags.filter(f => f.structure_level === 'risk_level'),
    obligation: activeFlags.filter(f => f.structure_level === 'obligation')
  };
  
  // 3. Sort by priority_weight within each group
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.priority_weight - b.priority_weight);
  }
  
  // 4. Render outcomes
  return (
    <div>
      {grouped.role.length > 0 && (
        <section>
          <h2>Your Role</h2>
          {grouped.role.map(outcome => (
            <OutcomeCard key={outcome.id} outcome={outcome} />
          ))}
        </section>
      )}
      
      {grouped.risk_level.length > 0 && (
        <section>
          <h2>Risk Classification</h2>
          {grouped.risk_level.map(outcome => (
            <OutcomeCard key={outcome.id} outcome={outcome} />
          ))}
        </section>
      )}
      
      {grouped.obligation.length > 0 && (
        <section>
          <h2>Your Obligations</h2>
          {grouped.obligation.map(outcome => (
            <OutcomeCard key={outcome.id} outcome={outcome} />
          ))}
        </section>
      )}
    </div>
  );
}
```

### Step 7: Validate Input

```typescript
function validateAnswer(
  questionId: string, 
  selectedOptions: string[]
): { valid: boolean; error?: string } {
  const rules = validationRules.rules[questionId];
  
  // Check required
  if (rules.required && selectedOptions.length === 0) {
    return { valid: false, error: "Please select at least one option" };
  }
  
  // Check min/max selections
  if (selectedOptions.length < rules.min_selections) {
    return { valid: false, error: `Select at least ${rules.min_selections} option(s)` };
  }
  
  if (selectedOptions.length > rules.max_selections) {
    return { valid: false, error: `Select at most ${rules.max_selections} option(s)` };
  }
  
  // Check mutual exclusivity
  if (rules.mutual_exclusivity) {
    const { exclusive_option, conflicts_with } = rules.mutual_exclusivity;
    const hasExclusive = selectedOptions.includes(exclusive_option);
    const hasOthers = selectedOptions.some(opt => conflicts_with.includes(opt));
    
    if (hasExclusive && hasOthers) {
      return { valid: false, error: rules.mutual_exclusivity.rule };
    }
  }
  
  return { valid: true };
}
```

---

## 🎨 UI Components

### QuestionRenderer

```tsx
function QuestionRenderer({ questionId, onAnswer }: Props) {
  const question = questionsData.questions[questionId];
  const [selected, setSelected] = useState<string[]>([]);
  
  if (question.type === 'single_choice') {
    return (
      <div>
        <h2>{question.section_title}</h2>
        <p>{question.text}</p>
        <div className="options">
          {question.options.map(option => (
            <label key={option.id}>
              <input
                type="radio"
                name={questionId}
                value={option.id}
                checked={selected.includes(option.id)}
                onChange={(e) => {
                  setSelected([e.target.value]);
                }}
              />
              {option.text}
            </label>
          ))}
        </div>
      </div>
    );
  }
  
  // Similar for multiple_choice with checkboxes
}
```

### OutcomeCard

```tsx
function OutcomeCard({ outcome }: { outcome: Outcome }) {
  const badgeColor = uiConfig.theme.risk_level_colors[outcome.risk_level];
  
  return (
    <div className="outcome-card">
      <div 
        className="risk-badge" 
        style={{ backgroundColor: badgeColor }}
      >
        {outcome.risk_level.toUpperCase()}
      </div>
      
      <div className="outcome-text">
        {outcome.text}
      </div>
      
      {outcome.applicable_articles.length > 0 && (
        <div className="articles">
          <strong>Applicable Articles:</strong> 
          {outcome.applicable_articles.join(', ')}
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testing

### Test Cases

```typescript
// Test basic navigation
test('Q1 -> AI model leads to QGPAI_1', () => {
  const nextNode = evaluateRouting(
    decisionTree.nodes['Q1'],
    ['0'], // AI model
    {}
  );
  expect(nextNode).toBe('QGPAI_1');
});

// Test flag accumulation
test('Selecting prohibited practice sets flag', () => {
  const state = handleAnswer('QAIS_5', ['0']); // subliminal manipulation
  expect(state.flags['flag_risklevel_prohibited']).toBe(true);
});

// Test mutual exclusivity
test('Cannot select "none" with other options', () => {
  const validation = validateAnswer('QAIS_1_1', ['0', '5']);
  expect(validation.valid).toBe(false);
});
```

---

## 📊 Progress Tracking

```typescript
function ProgressTracker({ currentNode, totalQuestions }: Props) {
  // Estimate progress based on history length
  const progress = (state.history.length / totalQuestions) * 100;
  
  return (
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${progress}%` }}
      />
      <span>{Math.round(progress)}% Complete</span>
    </div>
  );
}
```

---

## 🔄 Back Navigation

```typescript
function navigateBack() {
  if (state.history.length === 0) return;
  
  const previousNode = state.history[state.history.length - 1];
  
  setState(prev => ({
    ...prev,
    currentNode: previousNode,
    history: prev.history.slice(0, -1),
    // Note: Flags are NOT rolled back - this matches original behavior
  }));
}
```

---

## 📦 Export Results

```typescript
function exportResults(format: 'json' | 'pdf') {
  const results = {
    timestamp: new Date().toISOString(),
    answers: state.answers,
    outcomes: getActiveOutcomes(state.flags)
  };
  
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json'
    });
    downloadBlob(blob, 'eu-ai-act-results.json');
  }
  
  if (format === 'pdf') {
    generatePDF(results);
  }
}
```

---

## ⚠️ Important Notes

### 1. Routing Order Matters
Routes are evaluated **top to bottom**. The first matching condition is taken.

### 2. Flags Are Cumulative
Flags set during navigation persist. They are NOT rolled back on back navigation.

### 3. END Node Evaluation
When reaching END, evaluate ALL accumulated flags to determine which outcomes to show.

### 4. Empty Flags
Some flags have `is_empty: true` and no text. These are structural flags - don't display them.

### 5. Exact Match vs Partial Match
- `is_this_exact_match_selected`: User must select EXACTLY these options (no more, no less)
- `one_or_more_are_selected`: User must select AT LEAST ONE of these options

---

## 🚀 Deployment Checklist

- [ ] Load all JSON files correctly
- [ ] Implement flag accumulation
- [ ] Implement routing evaluation
- [ ] Handle mutual exclusivity
- [ ] Group outcomes by structure_level
- [ ] Sort outcomes by priority_weight
- [ ] Filter out empty flags
- [ ] Test all question types
- [ ] Test back navigation
- [ ] Add progress indicator
- [ ] Style risk badges
- [ ] Make articles clickable
- [ ] Add export functionality
- [ ] Test on mobile devices
- [ ] Add keyboard navigation
- [ ] Add accessibility labels

---

## 🎯 Key Success Criteria

A successful implementation should:
1. ✅ Navigate through all questions correctly
2. ✅ Accumulate flags based on answers
3. ✅ Display appropriate outcomes at END
4. ✅ Match the official checker's results
5. ✅ Handle all edge cases (mutual exclusivity, exact matches)
6. ✅ Be responsive and accessible

---

## 📚 Additional Resources

- **EU AI Act Official Text**: https://artificialintelligenceact.eu/
- **Official Compliance Checker**: https://ai-act-service-desk.ec.europa.eu/en/eu-ai-act-compliance-checker
- **Validation Report**: See validation_report.md

---

## 🆘 Troubleshooting

### Issue: Outcomes not displaying
- Check that flags are being set correctly
- Verify `is_empty: false` for flags
- Ensure filtering by structure_level

### Issue: Wrong next question
- Check routing order in decision_tree.json
- Verify condition evaluation logic
- Check if flags are affecting routing

### Issue: Validation errors
- Check mutual exclusivity rules
- Verify min/max selections
- Check for exclusive options

---

This implementation guide provides everything needed to build a fully functional EU AI Act Compliance Checker. Good luck! 🚀
