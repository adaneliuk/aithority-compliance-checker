import React, { useCallback } from 'react';
import type { SystemInfo } from '../types';
import { NavigationButtons } from './NavigationButtons';

interface SystemInfoFieldConfig {
  key: keyof SystemInfo;
  label: string;
  placeholder: string;
  isTextarea: boolean;
}

const FIELDS: SystemInfoFieldConfig[] = [
  {
    key: 'systemName',
    label: 'System Name',
    placeholder: 'Enter the name of your AI system',
    isTextarea: false,
  },
  {
    key: 'systemDescription',
    label: 'System Description',
    placeholder: 'Describe what your AI system does and how it works',
    isTextarea: true,
  },
  {
    key: 'useCase',
    label: 'Use Case',
    placeholder: 'Describe the primary use case and intended purpose of your AI system',
    isTextarea: true,
  },
  {
    key: 'llmVersion',
    label: 'LLM Version',
    placeholder: 'Specify the LLM model and version used (e.g., GPT-4, Claude 3, etc.)',
    isTextarea: false,
  },
  {
    key: 'dataUse',
    label: 'Data Use',
    placeholder: 'Describe what data your AI system processes and how it is used',
    isTextarea: true,
  },
];

const MAX_CHARS = 5000;
const MIN_CHARS = 10;

interface SystemInformationFormProps {
  systemInfo: SystemInfo;
  onFieldChange: (field: keyof SystemInfo, value: string) => void;
  onFieldBlur: (field: keyof SystemInfo) => void;
  onNext: () => void;
  isValid: boolean;
}

export const SystemInformationForm: React.FC<SystemInformationFormProps> = ({
  systemInfo,
  onFieldChange,
  onFieldBlur,
  onNext,
  isValid,
}) => {
  const handleChange = useCallback(
    (field: keyof SystemInfo) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const value = e.target.value.slice(0, MAX_CHARS);
      onFieldChange(field, value);
    },
    [onFieldChange]
  );

  const handleBlur = useCallback(
    (field: keyof SystemInfo) => () => {
      onFieldBlur(field);
    },
    [onFieldBlur]
  );

  const handleBack = useCallback(() => {}, []);
  const handleRestart = useCallback(() => {}, []);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        System Information
      </h2>
      <p className="text-gray-600 mb-6">
        Please provide information about your AI system. All fields are required.
      </p>

      <div className="space-y-6">
        {FIELDS.map(({ key, label, placeholder, isTextarea }) => {
          const field = systemInfo[key];
          const charCount = field.value.length;
          const showError = field.touched && field.error;

          return (
            <div key={key} className="form-field">
              <label
                htmlFor={key}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {label} <span className="text-red-500">*</span>
              </label>

              {isTextarea ? (
                <textarea
                  id={key}
                  value={field.value}
                  onChange={handleChange(key)}
                  onBlur={handleBlur(key)}
                  placeholder={placeholder}
                  rows={4}
                  className={`form-textarea ${showError ? 'form-input-error' : ''}`}
                />
              ) : (
                <input
                  type="text"
                  id={key}
                  value={field.value}
                  onChange={handleChange(key)}
                  onBlur={handleBlur(key)}
                  placeholder={placeholder}
                  className={`form-input ${showError ? 'form-input-error' : ''}`}
                />
              )}

              <div className="flex justify-between items-center mt-1">
                <div className="min-h-[20px]">
                  {showError && (
                    <p className="text-sm text-red-600">{field.error}</p>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    charCount > MAX_CHARS
                      ? 'text-red-600'
                      : charCount < MIN_CHARS && field.touched
                      ? 'text-orange-500'
                      : 'text-gray-500'
                  }`}
                >
                  {charCount} / {MAX_CHARS}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <NavigationButtons
        canGoBack={false}
        canGoNext={isValid}
        isLastQuestion={false}
        onBack={handleBack}
        onNext={onNext}
        onRestart={handleRestart}
        showRestart={false}
      />
    </div>
  );
};
