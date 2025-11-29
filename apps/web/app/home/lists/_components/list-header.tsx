'use client';

import { Calendar, Edit2, Copy, Users, Lock } from 'lucide-react';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Skeleton } from '@kit/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { List } from '../_hooks/use-lists';

interface ListHeaderProps {
  list: List | null;
  loading: boolean;
  onEdit?: () => void;
  onDuplicate?: () => void;
}

export function ListHeader({ list, loading, onEdit, onDuplicate }: ListHeaderProps) {
  if (loading) {
    return (
      <div className="border-b bg-background p-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="border-b bg-background p-6">
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">Selecione uma lista</h3>
          <p className="text-sm text-muted-foreground">
            Escolha uma lista na barra lateral para ver as empresas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-background">
      <div className="p-6">
        {/* Title and badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{list.nome}</h1>
              {list.is_public ? (
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  Pública
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Privada
                </Badge>
              )}
            </div>
            
            {list.descricao && (
              <p className="text-muted-foreground">{list.descricao}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base">
              {list.total_resultados}
            </Badge>
            <span>empresas</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Criada em {format(new Date(list.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
            </span>
          </div>

          {list.updated_at !== list.created_at && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">•</span>
              <span>
                Atualizada {format(new Date(list.updated_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
