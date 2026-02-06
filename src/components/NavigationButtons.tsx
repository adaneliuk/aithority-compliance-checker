import React from 'react';
import { uiConfig } from '../data';

interface NavigationButtonsProps {
  canGoBack: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  onBack: () => void;
  onNext: () => void;
  onRestart: () => void;
  showRestart?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  canGoBack,
  canGoNext,
  isLastQuestion,
  onBack,
  onNext,
  onRestart,
  showRestart = false,
}) => {
  const { navigation } = uiConfig;

  return (
    <div className="flex flex-wrap justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
      <div className="flex gap-3">
        {/* Back Button */}
        {navigation.show_back_button && (
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="btn btn-secondary"
          >
            {navigation.back_button_text}
          </button>
        )}

        {/* Restart Button */}
        {showRestart && navigation.show_restart_button && (
          <button
            type="button"
            onClick={onRestart}
            className="btn btn-secondary"
          >
            {navigation.restart_button_text}
          </button>
        )}
      </div>

      {/* Next Button */}
      {navigation.show_next_button && (
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="btn btn-primary"
        >
          {isLastQuestion
            ? navigation.view_results_button_text
            : navigation.next_button_text}
        </button>
      )}
    </div>
  );
};
