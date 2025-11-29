'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@kit/ui/card';
import { 
  Flame,
  Snowflake,
  Zap,
  Clock,
  FileText,
  DollarSign
} from 'lucide-react';
import { cn } from '@kit/ui/utils';

interface PressureStats {
  leadsAtivos: number;
  leadsParados: number;
  leadsQuentes: number;
  followupsVencidos: number;
  propostasAbertas: number;
  potencialFaturamento: number;
}

export function MasterCrmStats() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<PressureStats>({
    leadsAtivos: 0,
    leadsParados: 0,
    leadsQuentes: 0,
    followupsVencidos: 0,
    propostasAbertas: 0,
    potencialFaturamento: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/companies/pressure-stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de pressão:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCardClick(filterKey: string, filterValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(filterKey, filterValue);
    params.set('page', '1');
    router.push(`/home/crm?${params.toString()}`);
  }

  const statCards = [
    {
      label: '🔥 Leads Ativos',
      value: stats.leadsAtivos,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      onClick: () => handleCardClick('status', 'ativo'),
      description: 'Em prospecção',
    },
    {
      label: '🧊 Leads Parados',
      value: stats.leadsParados,
      icon: Snowflake,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      onClick: () => handleCardClick('status', 'parado'),
      description: '> 14 dias sem ação',
      urgent: stats.leadsParados > 0,
    },
    {
      label: '⚡ Leads Quentes',
      value: stats.leadsQuentes,
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      onClick: () => handleCardClick('status', 'quente'),
      description: 'Alta prioridade',
    },
    {
      label: '⏰ Follow-ups Vencidos',
      value: stats.followupsVencidos,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      onClick: () => handleCardClick('followup', 'vencido'),
      description: 'Ação atrasada',
      urgent: stats.followupsVencidos > 0,
    },
    {
      label: '📤 Propostas em Aberto',
      value: stats.propostasAbertas,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      onClick: () => handleCardClick('proposta', 'aberta'),
      description: 'Aguardando retorno',
    },
    {
      label: '💰 Potencial de Faturamento',
      value: `R$ ${(stats.potencialFaturamento / 1000).toFixed(0)}k`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      onClick: () => {},
      description: 'Pipeline estimado',
      isValue: true,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const isClickable = !stat.isValue;
        
        return (
          <Card 
            key={stat.label} 
            className={cn(
              'p-4 transition-all border-2',
              stat.bgColor,
              stat.borderColor,
              isClickable && 'cursor-pointer hover:shadow-lg hover:scale-105',
              stat.urgent && 'ring-2 ring-red-400 ring-offset-1 animate-pulse'
            )}
            onClick={isClickable ? stat.onClick : undefined}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Icon className={cn('h-6 w-6', stat.color)} />
                {stat.urgent && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className={cn(
                  'text-2xl font-bold',
                  stat.color,
                  stat.urgent && 'animate-pulse'
                )}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {stat.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
