'use client';

import { Plus, ListFilter, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { ScrollArea } from '@kit/ui/scroll-area';
import { Separator } from '@kit/ui/separator';
import { Skeleton } from '@kit/ui/skeleton';
import { useLists } from '../_hooks/use-lists';
import { CreateListModal } from './create-list-modal';

interface ListsSidebarProps {
  selectedListId: string | null;
  onSelectList: (listId: string) => void;
}

export function ListsSidebar({ selectedListId, onSelectList }: ListsSidebarProps) {
  const { lists, loading } = useLists();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'template'>('manual');

  const myLists = lists.filter(list => !list.is_public);
  const publicLists = lists.filter(list => list.is_public);

  const handleCreateClick = (mode: 'manual' | 'template') => {
    setCreateMode(mode);
    setCreateModalOpen(true);
  };

  return (
    <>
      <div className="flex h-full flex-col border-r bg-background">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Listas</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleCreateClick('manual')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Lista
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleCreateClick('template')}
            >
              <ListFilter className="mr-2 h-4 w-4" />
              Usar Template
            </Button>
          </div>
        </div>

        {/* Lists */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* My Lists */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ListFilter className="h-4 w-4" />
                Minhas Listas ({myLists.length})
              </h3>
              
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : myLists.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma lista criada ainda
                </p>
              ) : (
                <div className="space-y-1">
                  {myLists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => onSelectList(list.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted ${
                        selectedListId === list.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{list.nome}</p>
                          {list.descricao && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {list.descricao}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {list.total_resultados}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Public Lists */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Listas Públicas ({publicLists.length})
              </h3>
              
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : publicLists.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma lista pública disponível
                </p>
              ) : (
                <div className="space-y-1">
                  {publicLists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => onSelectList(list.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted ${
                        selectedListId === list.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{list.nome}</p>
                          {list.descricao && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {list.descricao}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {list.total_resultados}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <CreateListModal 
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        mode={createMode}
        onSuccess={(listId) => {
          setCreateModalOpen(false);
          onSelectList(listId);
        }}
      />
    </>
  );
}
