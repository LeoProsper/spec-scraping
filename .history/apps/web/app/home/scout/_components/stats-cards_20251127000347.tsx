'use client';

import { Card, CardContent } from '@kit/ui/card';
import { Building2, TrendingUp, Target, FileText, Zap } from 'lucide-react';
import { useUserStats } from '@kit/kaix-scout/hooks';
import { Skeleton } from '@kit/ui/skeleton';

export function StatsCards() {
  const { data: stats, isLoading } = useUserStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Buscas',
      value: stats?.totalSearches || 0,
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `${stats?.searchesRemaining === -1 ? 'Ilimitadas' : `${stats?.searchesRemaining} restantes`}`,
    },
    {
      title: 'Empresas',
      value: stats?.totalCompanies || 0,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Total encontradas',
    },
    {
      title: 'Hot Leads',
      value: stats?.hotLeads || 0,
      icon: Target,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Score 7-10',
    },
    {
      title: 'Propostas',
      value: stats?.totalProposals || 0,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Criadas',
    },
    {
      title: 'Conversão',
      value: `${stats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Taxa de sucesso',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
