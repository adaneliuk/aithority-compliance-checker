import React from 'react';

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  questionNumber?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStep,
  totalSteps,
  questionNumber,
}) => {
  const progressPercentage = Math.min((currentStep / totalSteps) * 100, 100);

  return (
    <div className="mb-6">
      {/* Progress Bar */}
      <div className="progress-bar mb-2">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Progress Text */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          {questionNumber && (
            <span className="font-medium">Question {questionNumber}</span>
          )}
        </span>
        <span>
          Step {currentStep} of ~{totalSteps}
        </span>
      </div>
    </div>
  );
};
