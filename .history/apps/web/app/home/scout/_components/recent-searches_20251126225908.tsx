'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Building2,
  ChevronRight 
} from 'lucide-react';
import { useSearchList } from '@kit/kaix-scout/hooks';
import { Skeleton } from '@kit/ui/skeleton';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RecentSearches() {
  const { data, isLoading } = useSearchList(1, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Buscas Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const searches = data?.data || [];

  if (searches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Buscas Recentes</CardTitle>
          <CardDescription>
            Suas buscas aparecerão aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhuma busca realizada ainda
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Buscas Recentes</CardTitle>
            <CardDescription>
              Últimas {searches.length} buscas realizadas
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/home/scout/searches">
              Ver todas
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {searches.map((search) => (
          <Link
            key={search.id}
            href={`/home/scout/search/${search.id}`}
            className="block"
          >
            <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{search.query}</p>
                  <SearchStatusBadge status={search.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {search.total_results || 0} empresas
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(search.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function SearchStatusBadge({ status }: { status: string }) {
  const variants = {
    processing: {
      icon: Loader2,
      label: 'Processando',
      variant: 'secondary' as const,
      className: 'animate-spin',
    },
    completed: {
      icon: CheckCircle2,
      label: 'Concluída',
      variant: 'success' as const,
      className: '',
    },
    error: {
      icon: XCircle,
      label: 'Erro',
      variant: 'destructive' as const,
      className: '',
    },
  };

  const config = variants[status as keyof typeof variants] || variants.error;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <Icon className={`mr-1 h-3 w-3 ${config.className}`} />
      {config.label}
    </Badge>
  );
}
