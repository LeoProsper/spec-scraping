'use client';

import { useSearchHistory, useDeleteSearch } from '@kit/kaix-scout/hooks';
import { Button } from '@kit/ui/button';
import { History, Trash2, Search as SearchIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSidebar } from '@kit/ui/shadcn-sidebar';

export function ScoutSidebarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { open } = useSidebar();

  const { data: historyData, isLoading } = useSearchHistory({ limit: 50 });
  const deleteSearchMutation = useDeleteSearch();

  // Só mostrar se estiver na rota do chat
  if (!pathname.includes('/scout/chat')) {
    return null;
  }

  const handleSelectSearch = (searchId: string) => {
    router.push(`/home/scout/chat?searchId=${searchId}`);
  };

  const handleDeleteSearch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja deletar este histórico?')) {
      await deleteSearchMutation.mutateAsync(id);
    }
  };

  const searches = historyData?.searches || [];

  // Se sidebar colapsada, mostrar apenas ícone
  if (!open) {
    return (
      <div className="flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <History className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header fixo */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b shrink-0">
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Histórico
        </span>
      </div>

      {/* Lista com scroll único e barra fina */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground text-center py-4">
          Carregando...
        </div>
      ) : searches.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-8 px-3">
          <SearchIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma busca ainda</p>
          <p className="mt-1 text-[10px]">Faça uma busca para começar</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {searches.map((search) => (
            <div
              key={search.id}
              onClick={() => handleSelectSearch(search.id)}
              className="group relative px-2 py-1.5 rounded cursor-pointer transition-all hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate leading-tight">
                    {search.title}
                  </p>
                  <p className="text-[9px] text-muted-foreground/80 truncate mt-0.5 leading-tight">
                    {search.query}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded ${
                        search.status === 'completed'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : search.status === 'error'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {search.status === 'completed'
                        ? `${search.total_results}`
                        : search.status === 'error'
                        ? '✗'
                        : '⏳'}
                    </span>
                    <span className="text-[9px] text-muted-foreground/70">
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
                  onClick={(e) => handleDeleteSearch(search.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 shrink-0"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
