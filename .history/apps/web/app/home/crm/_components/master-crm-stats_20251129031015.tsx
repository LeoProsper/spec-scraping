'use client';

import { useEffect, useState } from 'react';
import { Card } from '@kit/ui/card';
import { 
  Building2, 
  MessageSquare, 
  FileText, 
  Flame, 
  Globe,
  Clock 
} from 'lucide-react';

interface CrmStats {
  totalEmpresas: number;
  totalInteracoes: number;
  totalPropostas: number;
  hotLeads: number;
  comSite: number;
  semSite: number;
  followupsVencidos: number;
}

export function MasterCrmStats() {
  const [stats, setStats] = useState<CrmStats>({
    totalEmpresas: 0,
    totalInteracoes: 0,
    totalPropostas: 0,
    hotLeads: 0,
    comSite: 0,
    semSite: 0,
    followupsVencidos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/companies/master?page=1&limit=1');
      const result = await response.json();
      
      if (result.success) {
        setStats({
          totalEmpresas: result.data.pagination.total,
          totalInteracoes: result.data.stats?.totalInteracoes || 0,
          totalPropostas: result.data.stats?.totalPropostas || 0,
          hotLeads: result.data.stats?.hotLeads || 0,
          comSite: result.data.stats?.comSite || 0,
          semSite: result.data.stats?.semSite || 0,
          followupsVencidos: result.data.stats?.followupsVencidos || 0,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: 'Total de Empresas',
      value: stats.totalEmpresas,
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      label: 'Interações',
      value: stats.totalInteracoes,
      icon: MessageSquare,
      color: 'text-green-600',
    },
    {
      label: 'Propostas',
      value: stats.totalPropostas,
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      label: 'Hot Leads',
      value: stats.hotLeads,
      icon: Flame,
      color: 'text-orange-600',
    },
    {
      label: 'Com Site',
      value: stats.comSite,
      icon: Globe,
      color: 'text-cyan-600',
    },
    {
      label: 'Follow-ups Vencidos',
      value: stats.followupsVencidos,
      icon: Clock,
      color: 'text-red-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${stat.color}`} />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
