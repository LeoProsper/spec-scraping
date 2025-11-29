'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@kit/ui/badge';
import { cn } from '~/lib/utils';

interface Shortcut {
  label: string;
  emoji: string;
  filters: Record<string, string>;
  description: string;
  color: string;
  bgColor: string;
}

export function MasterCrmShortcuts() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const shortcuts: Shortcut[] = [
    {
      label: 'Quero vender agora',
      emoji: '🔥',
      filters: { status: 'quente', proposta: 'sem' },
      description: 'Leads quentes sem proposta',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100 hover:bg-orange-200 border-orange-300',
    },
    {
      label: 'Leads esquecidos',
      emoji: '🧊',
      filters: { status: 'parado' },
      description: 'Sem interação há 15+ dias',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
    },
    {
      label: 'Sem presença digital',
      emoji: '❌',
      filters: { website: 'null' },
      description: 'Não tem site',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100 hover:bg-gray-200 border-gray-300',
    },
    {
      label: 'Avaliação baixa',
      emoji: '⚠️',
      filters: { rating: 'baixo' },
      description: 'Nota < 3.5 estrelas',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
    },
    {
      label: 'Baixa concorrência',
      emoji: '💸',
      filters: { reviews: 'baixo' },
      description: 'Menos de 20 avaliações',
      color: 'text-green-700',
      bgColor: 'bg-green-100 hover:bg-green-200 border-green-300',
    },
    {
      label: 'Follow-ups vencidos',
      emoji: '⏰',
      filters: { followup: 'vencido' },
      description: 'Ações atrasadas',
      color: 'text-red-700',
      bgColor: 'bg-red-100 hover:bg-red-200 border-red-300',
    },
  ];

  function handleShortcutClick(filters: Record<string, string>) {
    const params = new URLSearchParams();
    
    // Adiciona todos os filtros do atalho
    Object.entries(filters).forEach(([key, value]) => {
      params.set(key, value);
    });
    
    // Reset para primeira página
    params.set('page', '1');
    
    router.push(`/home/crm?${params.toString()}`);
  }

  // Verifica se algum atalho está ativo
  function isShortcutActive(filters: Record<string, string>): boolean {
    return Object.entries(filters).every(
      ([key, value]) => searchParams.get(key) === value
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          🎯 Filtros Comerciais Prontos
        </h3>
        <button
          onClick={() => router.push('/home/crm')}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Limpar filtros
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {shortcuts.map((shortcut) => {
          const isActive = isShortcutActive(shortcut.filters);
          
          return (
            <Badge
              key={shortcut.label}
              variant="outline"
              className={cn(
                'cursor-pointer transition-all border-2 px-3 py-2 text-xs font-medium',
                shortcut.bgColor,
                shortcut.color,
                isActive && 'ring-2 ring-offset-2 ring-blue-500 scale-105'
              )}
              onClick={() => handleShortcutClick(shortcut.filters)}
            >
              <span className="mr-1.5 text-base">{shortcut.emoji}</span>
              <div className="flex flex-col items-start">
                <span className="font-semibold">{shortcut.label}</span>
                <span className="text-[10px] opacity-75">
                  {shortcut.description}
                </span>
              </div>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
