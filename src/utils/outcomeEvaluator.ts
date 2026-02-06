import type { Flags, Outcome, GroupedOutcomes } from '../types';
import { outcomes } from '../data';

/**
 * Gets all active outcomes based on the current flags
 */
export function getActiveOutcomes(flags: Flags): Outcome[] {
  const activeOutcomes: Outcome[] = [];

  for (const [flagId, outcome] of Object.entries(outcomes.outcomes)) {
    // Check if this flag is set to true
    if (flags[flagId] === true) {
      // Only include non-empty outcomes
      if (!outcome.is_empty) {
        activeOutcomes.push(outcome);
      }
    }
  }

  // Also check for role-specific flags that map to outcome flags
  const roleFlagMapping: Record<string, string> = {
    'provider': 'flag_ai_system_role_provider',
    'deployer': 'flag_ai_system_role_deployer',
    'importer': 'flag_ai_system_role_importer',
    'distributor': 'flag_ai_system_role_distributor',
    'authorisedrepre': 'flag_ai_system_role_authorisedrepre',
    'productmanufacturer': 'flag_ai_system_role_productmanufacturer',
  };

  // If flag_ai_system_role is set to a role value, activate the corresponding role output flag
  const systemRole = flags['flag_ai_system_role'];
  if (typeof systemRole === 'string' && roleFlagMapping[systemRole]) {
    const roleOutcomeId = roleFlagMapping[systemRole];
    const roleOutcome = outcomes.outcomes[roleOutcomeId];
    if (roleOutcome && !roleOutcome.is_empty && !activeOutcomes.find(o => o.id === roleOutcomeId)) {
      activeOutcomes.push(roleOutcome);
    }
  }

  return activeOutcomes;
}

/**
 * Groups outcomes by their structure level
 */
export function groupOutcomesByLevel(activeOutcomes: Outcome[]): GroupedOutcomes {
  const grouped: GroupedOutcomes = {
    role: [],
    risk_level: [],
    obligation: [],
  };

  for (const outcome of activeOutcomes) {
    const level = outcome.structure_level as keyof GroupedOutcomes;
    if (grouped[level]) {
      grouped[level].push(outcome);
    }
  }

  // Sort each group by priority_weight (higher weight = higher priority = first)
  for (const level of Object.keys(grouped) as (keyof GroupedOutcomes)[]) {
    grouped[level].sort((a, b) => b.priority_weight - a.priority_weight);
  }

  return grouped;
}

/**
 * Gets the primary risk level from the outcomes
 */
export function getPrimaryRiskLevel(activeOutcomes: Outcome[]): string {
  // Priority order for risk levels
  const riskPriority = [
    'prohibited',
    'systemic_risk',
    'high_risk',
    'obligations',
    'transparency_obligations',
    'open_source_exception',
    'general',
    'out_of_scope',
    'not_applicable',
    'role_classification',
  ];

  for (const risk of riskPriority) {
    const matchingOutcome = activeOutcomes.find(o => o.risk_level === risk);
    if (matchingOutcome) {
      return risk;
    }
  }

  return 'general';
}

/**
 * Formats outcome text for display
 * - Makes URLs clickable
 * - Preserves line breaks
 * - Formats lists
 */
export function formatOutcomeText(text: string): string {
  if (!text) return '';

  // Convert markdown-style links to HTML
  let formatted = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
  );

  // Convert line breaks to <br> for display
  formatted = formatted.replace(/\n/g, '<br>');

  // Convert markdown-style lists (- item) to HTML
  formatted = formatted.replace(
    /(<br>|^)-\s+/g,
    '$1<span class="inline-block w-2 h-2 bg-current rounded-full mr-2 align-middle"></span>'
  );

  return formatted;
}

/**
 * Gets applicable article references from outcomes
 */
export function getApplicableArticles(activeOutcomes: Outcome[]): number[] {
  const articlesSet = new Set<number>();

  for (const outcome of activeOutcomes) {
    for (const article of outcome.applicable_articles) {
      articlesSet.add(article);
    }
  }

  return Array.from(articlesSet).sort((a, b) => a - b);
}
