'use client';

import { usePathname } from 'next/navigation';
import { Plus, ListFilter, Users, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Separator } from '@kit/ui/separator';
import { Skeleton } from '@kit/ui/skeleton';
import { useSidebar } from '@kit/ui/shadcn-sidebar';
import { useLists } from '../_hooks/use-lists';
import { CreateListModal } from './create-list-modal';

interface ListsSidebarContentProps {
  selectedListId: string | null;
  onSelectList: (listId: string) => void;
  isOpen: boolean;
}

export function ListsSidebarContent({ selectedListId, onSelectList, isOpen }: ListsSidebarContentProps) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const { lists, loading } = useLists();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'template'>('manual');

  // Only show on lists route
  if (!pathname?.startsWith('/home/lists')) {
    return null;
  }

  const myLists = lists.filter(list => !list.is_public);
  const publicLists = lists.filter(list => list.is_public);

  const handleCreateClick = (mode: 'manual' | 'template') => {
    setCreateMode(mode);
    setCreateModalOpen(true);
  };

  // Se sidebar colapsada, mostrar apenas ícone
  if (!isOpen) {
    return (
      <div className="flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleSidebar}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Action Buttons */}
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

        <Separator />

        {/* My Lists */}
        <div>
          <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <ListFilter className="h-3.5 w-3.5" />
            Minhas Listas ({myLists.length})
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : myLists.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Nenhuma lista criada ainda
            </p>
          ) : (
            <div className="space-y-1">
              {myLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => onSelectList(list.id)}
                  className={`w-full text-left p-2.5 rounded-md transition-colors hover:bg-accent ${
                    selectedListId === list.id ? 'bg-accent' : ''
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
                    <Badge variant="secondary" className="shrink-0 text-xs">
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
          <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Listas Públicas ({publicLists.length})
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : publicLists.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Nenhuma lista pública disponível
            </p>
          ) : (
            <div className="space-y-1">
              {publicLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => onSelectList(list.id)}
                  className={`w-full text-left p-2.5 rounded-md transition-colors hover:bg-accent ${
                    selectedListId === list.id ? 'bg-accent' : ''
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
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {list.total_resultados}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
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
