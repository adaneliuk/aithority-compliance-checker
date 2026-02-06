import React from 'react';
import type { Flags } from '../types';
import { uiConfig } from '../data';
import {
  getActiveOutcomes,
  groupOutcomesByLevel,
  getPrimaryRiskLevel,
  formatOutcomeText,
  getApplicableArticles,
} from '../utils/outcomeEvaluator';

interface OutcomeDisplayProps {
  flags: Flags;
  onRestart: () => void;
}

export const OutcomeDisplay: React.FC<OutcomeDisplayProps> = ({
  flags,
  onRestart,
}) => {
  const activeOutcomes = getActiveOutcomes(flags);
  const groupedOutcomes = groupOutcomesByLevel(activeOutcomes);
  const primaryRiskLevel = getPrimaryRiskLevel(activeOutcomes);
  const applicableArticles = getApplicableArticles(activeOutcomes);

  const { risk_badges, structure_level_headers, outcome_display } = uiConfig;
  const riskBadge = risk_badges[primaryRiskLevel as keyof typeof risk_badges] || risk_badges.obligations;

  const renderOutcomeSection = (
    title: string,
    outcomes: typeof activeOutcomes,
    key: string
  ) => {
    if (outcomes.length === 0) return null;

    return (
      <div key={key} className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          {title}
        </h3>
        <div className="space-y-4">
          {outcomes.map((outcome) => (
            <div
              key={outcome.id}
              className="p-4 rounded-lg bg-gray-50 border-l-4"
              style={{ borderLeftColor: outcome.display_color }}
            >
              <div
                className="outcome-text text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatOutcomeText(outcome.text),
                }}
              />
              {outcome_display.show_article_references &&
                outcome.applicable_articles.length > 0 && (
                  <div className="mt-3 text-sm text-gray-500">
                    Applicable Articles:{' '}
                    {outcome.applicable_articles.map((a) => `Art. ${a}`).join(', ')}
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header with Risk Badge */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Assessment Results
        </h1>

        {/* Risk Level Badge */}
        <div
          className="badge text-lg px-6 py-2"
          style={{
            backgroundColor: riskBadge.color,
            color: riskBadge.text_color,
          }}
        >
          {riskBadge.text}
        </div>

        {riskBadge.description && (
          <p className="mt-3 text-gray-600">{riskBadge.description}</p>
        )}
      </div>

      {/* Grouped Outcomes */}
      <div className="card">
        {outcome_display.structure_level_order.map((level) => {
          const outcomes = groupedOutcomes[level as keyof typeof groupedOutcomes];
          const header = structure_level_headers[level] || level;
          return renderOutcomeSection(header, outcomes || [], level);
        })}

        {/* Applicable Articles Summary */}
        {outcome_display.show_article_references && applicableArticles.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Relevant EU AI Act Articles
            </h3>
            <div className="flex flex-wrap gap-2">
              {applicableArticles.map((article) => (
                <span
                  key={article}
                  className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  Article {article}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Disclaimer:</strong> {uiConfig.app_config.disclaimer}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={onRestart}
          className="btn btn-primary"
        >
          {uiConfig.navigation.restart_button_text}
        </button>

        {outcome_display.show_export_button && (
          <button
            type="button"
            onClick={() => {
              const data = {
                assessment_date: new Date().toISOString(),
                primary_risk_level: primaryRiskLevel,
                outcomes: activeOutcomes,
                applicable_articles: applicableArticles,
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'eu-ai-act-assessment.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn btn-secondary"
          >
            Export Results (JSON)
          </button>
        )}
      </div>
    </div>
  );
};
