import React from 'react';
import type { Question } from '../types';
import { handleSelectionWithExclusivity, isExclusiveOption } from '../utils/validation';

interface QuestionRendererProps {
  question: Question;
  selectedAnswers: number[];
  onSelectionChange: (answers: number[]) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  selectedAnswers,
  onSelectionChange,
}) => {
  const handleOptionClick = (optionIndex: number) => {
    const newSelection = handleSelectionWithExclusivity(
      question,
      selectedAnswers,
      optionIndex
    );
    onSelectionChange(newSelection);
  };

  const handleKeyDown = (e: React.KeyboardEvent, optionIndex: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOptionClick(optionIndex);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Section Title */}
      {question.section_title && (
        <div className="mb-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
          {question.section_title}
        </div>
      )}

      {/* Question Text */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
        {question.text}
      </h2>

      {/* Question Type Indicator */}
      <p className="text-sm text-gray-500 mb-4">
        {question.type === 'single_choice'
          ? 'Select one option'
          : 'Select all that apply'}
      </p>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswers.includes(index);
          const isExclusive = isExclusiveOption(question, index);
          const inputType = question.type === 'single_choice' ? 'radio' : 'checkbox';

          return (
            <div
              key={option.id}
              role={inputType === 'radio' ? 'radio' : 'checkbox'}
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => handleOptionClick(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                ${inputType === 'radio' ? 'custom-radio' : 'custom-checkbox'}
                ${isSelected ? 'selected' : ''}
                ${isExclusive ? 'border-dashed' : ''}
                transition-all duration-200 cursor-pointer
              `}
            >
              <input
                type={inputType}
                checked={isSelected}
                onChange={() => {}} // Handled by parent div
                className="mt-0.5 h-4 w-4 shrink-0"
                tabIndex={-1}
                aria-hidden="true"
              />
              <span className={`text-base ${isExclusive ? 'italic' : ''}`}>
                {option.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
