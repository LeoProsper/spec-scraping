/**
 * Lead Scoring Service
 * Calculate and categorize lead scores based on website analysis
 */

import type {
  ScoreCategory,
  ScoreRules,
  WebsiteAnalysis,
} from '../types';

export const DEFAULT_SCORE_RULES: ScoreRules = {
  noWebsite: 10,
  noHttps: 7,
  notResponsive: 7,
  oldTechDetected: 6,
  slowPage: 6,
  outdatedDesign: 8,
};

/**
 * Calculate lead score based on website analysis
 * Score range: 0-10
 * Higher score = better lead opportunity
 */
export function calculateLeadScore(
  analysis: Partial<WebsiteAnalysis>,
  rules: ScoreRules = DEFAULT_SCORE_RULES,
): number {
  let score = 0;

  // No website = maximum score (best opportunity)
  if (!analysis.has_website) {
    return 10;
  }

  // HTTPS check
  if (!analysis.has_https) {
    score += 3;
  }

  // Responsiveness check
  if (!analysis.is_responsive) {
    score += 3;
  }

  // Load time check (>3 seconds is slow)
  if (analysis.load_time && analysis.load_time > 3000) {
    score += 2;
  }

  // Old technologies check
  if (analysis.technologies && hasOldTechnologies(analysis.technologies)) {
    score += 2;
  }

  // AI modernity score
  if (analysis.ai_report?.modernityLevel) {
    const modernityPenalty = 10 - analysis.ai_report.modernityLevel;
    score += Math.round(modernityPenalty / 2);
  }

  // Cap at 10
  return Math.min(10, Math.round(score));
}

/**
 * Get score category based on score value
 */
export function getScoreCategory(score: number): ScoreCategory {
  if (score <= 3) return 'ignore';
  if (score <= 5) return 'low';
  if (score === 6) return 'medium';
  return 'hot'; // 7-10
}

/**
 * Check if technologies include old/outdated ones
 */
export function hasOldTechnologies(technologies: string[]): boolean {
  const oldTech = [
    'jquery 1.',
    'jquery 2.',
    'flash',
    'silverlight',
    'internet explorer',
    'ie6',
    'ie7',
    'ie8',
    'frontpage',
    'dreamweaver',
    'joomla 1.',
    'joomla 2.',
    'wordpress 3.',
    'wordpress 4.',
    'drupal 6',
    'drupal 7',
  ];

  return technologies.some((tech) =>
    oldTech.some((old) => tech.toLowerCase().includes(old)),
  );
}

/**
 * Get score description for UI display
 */
export function getScoreDescription(score: number): string {
  if (score === 10) return 'Sem website - Oportunidade máxima!';
  if (score >= 8) return 'Excelente oportunidade de venda';
  if (score >= 7) return 'Boa oportunidade';
  if (score === 6) return 'Oportunidade moderada';
  if (score >= 4) return 'Oportunidade baixa';
  return 'Prioridade baixa';
}

/**
 * Get recommended action based on score
 */
export function getRecommendedAction(score: number): string {
  if (score >= 7) return 'Criar proposta imediatamente';
  if (score >= 5) return 'Analisar com mais detalhes';
  if (score >= 3) return 'Monitorar para futuras oportunidades';
  return 'Ignorar por enquanto';
}

/**
 * Get score color for UI (Tailwind classes)
 */
export function getScoreColor(
  score: number,
): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 7) {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
    };
  }
  if (score >= 5) {
    return {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-300',
    };
  }
  if (score >= 3) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
    };
  }
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300',
  };
}

/**
 * Calculate potential revenue based on score and company data
 */
export function estimatePotentialRevenue(
  score: number,
  hasWebsite: boolean,
): {
  min: number;
  max: number;
  currency: string;
} {
  if (!hasWebsite) {
    // New website - higher value
    return { min: 3000, max: 10000, currency: 'BRL' };
  }

  if (score >= 7) {
    // Redesign - medium-high value
    return { min: 2000, max: 7000, currency: 'BRL' };
  }

  if (score >= 5) {
    // Improvements - medium value
    return { min: 1500, max: 4000, currency: 'BRL' };
  }

  // Minor updates - lower value
  return { min: 800, max: 2000, currency: 'BRL' };
}

/**
 * Generate score breakdown for detailed view
 */
export interface ScoreBreakdown {
  total: number;
  category: ScoreCategory;
  factors: {
    name: string;
    points: number;
    description: string;
  }[];
}

export function getScoreBreakdown(
  analysis: Partial<WebsiteAnalysis>,
): ScoreBreakdown {
  const factors: ScoreBreakdown['factors'] = [];
  let total = 0;

  if (!analysis.has_website) {
    factors.push({
      name: 'Sem Website',
      points: 10,
      description: 'Empresa não possui website',
    });
    total = 10;
  } else {
    if (!analysis.has_https) {
      factors.push({
        name: 'Sem HTTPS',
        points: 3,
        description: 'Site não usa conexão segura',
      });
      total += 3;
    }

    if (!analysis.is_responsive) {
      factors.push({
        name: 'Não Responsivo',
        points: 3,
        description: 'Site não se adapta a dispositivos móveis',
      });
      total += 3;
    }

    if (analysis.load_time && analysis.load_time > 3000) {
      factors.push({
        name: 'Carregamento Lento',
        points: 2,
        description: `Site demora ${Math.round(analysis.load_time / 1000)}s para carregar`,
      });
      total += 2;
    }

    if (analysis.technologies && hasOldTechnologies(analysis.technologies)) {
      factors.push({
        name: 'Tecnologias Antigas',
        points: 2,
        description: 'Usa tecnologias desatualizadas',
      });
      total += 2;
    }

    if (analysis.ai_report?.modernityLevel) {
      const modernityPenalty = 10 - analysis.ai_report.modernityLevel;
      const points = Math.round(modernityPenalty / 2);
      if (points > 0) {
        factors.push({
          name: 'Design Desatualizado',
          points,
          description: `Nível de modernidade: ${analysis.ai_report.modernityLevel}/10`,
        });
        total += points;
      }
    }
  }

  total = Math.min(10, total);

  return {
    total,
    category: getScoreCategory(total),
    factors,
  };
}

/**
 * Check if lead qualifies for premium features (templates)
 */
export function qualifiesForTemplates(score: number): boolean {
  return score >= 7;
}

/**
 * Sort companies by score (descending)
 */
export function sortByScore<T extends { score?: number }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Filter companies by score category
 */
export function filterByCategory<
  T extends { score_category?: ScoreCategory },
>(items: T[], category: ScoreCategory): T[] {
  return items.filter((item) => item.score_category === category);
}

/**
 * Get statistics for a list of scored items
 */
export interface ScoreStatistics {
  total: number;
  average: number;
  hot: number;
  medium: number;
  low: number;
  ignore: number;
  hotPercentage: number;
}

export function getScoreStatistics<
  T extends { score?: number; score_category?: ScoreCategory },
>(items: T[]): ScoreStatistics {
  const total = items.length;
  const average =
    items.reduce((sum, item) => sum + (item.score || 0), 0) / total || 0;

  const hot = items.filter((item) => item.score_category === 'hot').length;
  const medium = items.filter(
    (item) => item.score_category === 'medium',
  ).length;
  const low = items.filter((item) => item.score_category === 'low').length;
  const ignore = items.filter(
    (item) => item.score_category === 'ignore',
  ).length;

  return {
    total,
    average: Math.round(average * 10) / 10,
    hot,
    medium,
    low,
    ignore,
    hotPercentage: total > 0 ? Math.round((hot / total) * 100) : 0,
  };
}
