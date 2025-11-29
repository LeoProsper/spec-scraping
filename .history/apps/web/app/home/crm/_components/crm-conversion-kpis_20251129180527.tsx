'use client';

import { useEffect, useState } from 'react';
import { Card } from '@kit/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface ConversionStats {
  leadsAtivos: number;
  leadsGanhos: number;
  taxaConversao: number;
  potencialTotal: number;
}

/**
 * FASE 6: Indicadores de Dinheiro
 * Taxa de conversão e potencial de receita total
 */
export function CrmConversionKpis() {
  const [stats, setStats] = useState<ConversionStats>({
    leadsAtivos: 0,
    leadsGanhos: 0,
    taxaConversao: 0,
    potencialTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/companies/conversion-stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar KPIs de conversão:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 animate-pulse">
          <div className="h-16 bg-gray-200 rounded" />
        </Card>
        <Card className="p-4 animate-pulse">
          <div className="h-16 bg-gray-200 rounded" />
        </Card>
      </div>
    );
  }

  // Cores baseadas na taxa de conversão
  const conversionColor =
    stats.taxaConversao >= 20
      ? 'text-green-600'
      : stats.taxaConversao >= 10
      ? 'text-yellow-600'
      : 'text-red-600';

  const conversionBg =
    stats.taxaConversao >= 20
      ? 'bg-green-50 border-green-200'
      : stats.taxaConversao >= 10
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-red-50 border-red-200';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Taxa de Conversão */}
      <Card className={`p-6 border-2 transition-all ${conversionBg}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              🔢 Taxa de Conversão
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${conversionColor}`}>
                {stats.taxaConversao.toFixed(1)}%
              </span>
              {stats.taxaConversao >= 15 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.leadsGanhos} ganhos de {stats.leadsAtivos + stats.leadsGanhos} leads ativos
            </p>
          </div>
        </div>
      </Card>

      {/* Potencial de Receita Total */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              💰 Potencial Total em Carteira
            </p>
            <div className="flex items-baseline gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-4xl font-bold text-green-600">
                {(stats.potencialTotal / 1000).toFixed(0)}k
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Estimativa baseada em {stats.leadsAtivos} leads ativos
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
