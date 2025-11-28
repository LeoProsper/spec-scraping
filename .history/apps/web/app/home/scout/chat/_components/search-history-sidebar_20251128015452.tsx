'use client';

import { useSearchHistory, useDeleteSearch } from '@kit/kaix-scout/hooks';
import { Button } from '@kit/ui/button';
import { History, Trash2, Search as SearchIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SearchHistorySidebarProps {
  onSelectSearch?: (query: string) => void;
}

export function SearchHistorySidebar({ onSelectSearch }: SearchHistorySidebarProps) {
  const { data: historyData, isLoading } = useSearchHistory({ limit: 50 });
  const deleteMutation = useDeleteSearch();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja deletar este histórico?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const searches = historyData?.searches || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico de Buscas
        </h3>
      </div>

      {/* Search History List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading && (
          <div className="text-center text-muted-foreground py-4">
            Carregando...
          </div>
        )}

        {!isLoading && searches.length === 0 && (
          <div className="text-center text-muted-foreground py-8 px-4">
            <SearchIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma busca ainda</p>
            <p className="text-xs mt-1">Faça uma busca para começar</p>
          </div>
        )}

        {searches.map((search) => (
          <div
            key={search.id}
            onClick={() => onSelectSearch?.(search.query)}
            className="group relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {search.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {search.query}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      search.status === 'completed'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : search.status === 'error'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {search.status === 'completed'
                      ? `✓ ${search.total_results} ${search.total_results === 1 ? 'resultado' : 'resultados'}`
                      : search.status === 'error'
                      ? '✗ Erro'
                      : '⏳ Processando'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(search.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(search.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
