'use client';

import { useState } from 'react';
import { useSearchHistory, useDeleteSearch } from '@kit/kaix-scout/hooks';
import { Button } from '@kit/ui/button';
import { History, Trash2, Search as SearchIcon, MessageSquare } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSidebar } from '@kit/ui/shadcn-sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

export function ScoutSidebarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { open } = useSidebar();
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');

  const { data: historyData, isLoading: loadingHistory } = useSearchHistory({ limit: 50 });
  const deleteSearchMutation = useDeleteSearch();

  // Só mostrar se estiver na rota do chat
  if (!pathname.includes('/scout/chat')) {
    return null;
  }

  const handleSelectSearch = (query: string) => {
    router.push(`/home/scout/chat?query=${encodeURIComponent(query)}`);
  };

  const handleDeleteSearch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja deletar este histórico?')) {
      await deleteSearchMutation.mutateAsync(id);
    }
  };

  const searches = historyData?.searches || [];

  // Se sidebar colapsada, mostrar apenas ícones
  if (!open) {
    return (
      <div className="flex flex-col items-center py-2 space-y-2">
        <Button
          onClick={() => setActiveTab('chat')}
          variant={activeTab === 'chat' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setActiveTab('history')}
          variant={activeTab === 'history' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
        >
          <History className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-2 py-2">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'history')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            Chat AI
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <History className="h-3 w-3 mr-1" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-2 space-y-2">
          <div className="text-xs text-muted-foreground text-center py-4 px-2">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Conversas com IA</p>
            <p className="mt-1 text-[10px]">Em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-2 space-y-1">
          {loadingHistory ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              Carregando...
            </div>
          ) : searches.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8 px-2">
              <SearchIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma busca ainda</p>
              <p className="mt-1 text-[10px]">Faça uma busca para começar</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {searches.map((search) => (
                <div
                  key={search.id}
                  onClick={() => handleSelectSearch(search.query)}
                  className="group relative px-2 py-2 rounded-md cursor-pointer transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {search.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {search.query}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            search.status === 'completed'
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : search.status === 'error'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {search.status === 'completed'
                            ? `✓ ${search.total_results}`
                            : search.status === 'error'
                            ? '✗'
                            : '⏳'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
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
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
