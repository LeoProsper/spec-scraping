'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/shadcn-table';
import { Card } from '@kit/ui/shadcn-card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/shadcn-button';
import { Avatar, AvatarFallback } from '@kit/ui/shadcn-avatar';
import { 
  Globe, 
  MapPin, 
  Star, 
  MessageSquare, 
  FileText,
  MoreHorizontal,
  Clock,
  Flame
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/shadcn-dropdown-menu';
import { Input } from '@kit/ui/shadcn-input';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Company {
  company_id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  phone: string | null;
  rating: number | null;
  total_reviews: number | null;
  lead_status: string;
  pipeline_stage: string | null;
  responsavel_id: string | null;
  ultima_interacao: string | null;
  proxima_acao: string | null;
  has_site: boolean;
  total_interacoes: number;
  total_propostas: number;
  total_listas: number;
  listas: any[];
  is_hot_lead: boolean;
  followup_vencido: boolean;
  dias_sem_interacao: number | null;
  created_at: string;
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  contatado: 'bg-yellow-100 text-yellow-800',
  qualificado: 'bg-purple-100 text-purple-800',
  proposta: 'bg-orange-100 text-orange-800',
  negociacao: 'bg-cyan-100 text-cyan-800',
  ganho: 'bg-green-100 text-green-800',
  perdido: 'bg-red-100 text-red-800',
  descartado: 'bg-gray-100 text-gray-800',
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
  descartado: 'Descartado',
};

export function MasterCrmTable() {
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, [searchParams]);

  async function fetchCompanies() {
    try {
      setLoading(true);
      
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      
      if (searchText) {
        params.set('search', searchText);
      }

      const response = await fetch(`/api/companies/master?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setCompanies(result.data.companies);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchCompanies();
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Cabeçalho com busca */}
      <div className="p-4 border-b">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Buscar por nome da empresa..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit">Buscar</Button>
        </form>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Empresa</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-center">Site</TableHead>
              <TableHead className="text-center">Avaliação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Interações</TableHead>
              <TableHead className="text-center">Propostas</TableHead>
              <TableHead>Última Atividade</TableHead>
              <TableHead>Listas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  Nenhuma empresa encontrada
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.company_id} className="hover:bg-muted/50">
                  {/* Empresa */}
                  <TableCell>
                    <div className="flex items-start gap-2">
                      {company.is_hot_lead && (
                        <Flame className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{company.name}</p>
                        {company.phone && (
                          <p className="text-xs text-muted-foreground">{company.phone}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Categoria */}
                  <TableCell>
                    <span className="text-sm">{company.category || '-'}</span>
                  </TableCell>

                  {/* Local */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[120px]">
                        {company.city ? `${company.city}/${company.state}` : '-'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Site */}
                  <TableCell className="text-center">
                    {company.has_site ? (
                      <a
                        href={company.website!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center"
                      >
                        <Globe className="h-4 w-4 text-green-600 hover:text-green-700" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Avaliação */}
                  <TableCell className="text-center">
                    {company.rating ? (
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{company.rating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({company.total_reviews})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={LEAD_STATUS_COLORS[company.lead_status] || ''}
                    >
                      {LEAD_STATUS_LABELS[company.lead_status] || company.lead_status}
                    </Badge>
                  </TableCell>

                  {/* Interações */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{company.total_interacoes}</span>
                    </div>
                  </TableCell>

                  {/* Propostas */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{company.total_propostas}</span>
                    </div>
                  </TableCell>

                  {/* Última Atividade */}
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {company.ultima_interacao ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(company.ultima_interacao), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem atividade</span>
                      )}
                      {company.followup_vencido && (
                        <Badge variant="destructive" className="text-xs">
                          Follow-up vencido
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Listas */}
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {company.total_listas > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {company.total_listas} {company.total_listas === 1 ? 'lista' : 'listas'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Registrar Interação</DropdownMenuItem>
                        <DropdownMenuItem>Mudar Status</DropdownMenuItem>
                        <DropdownMenuItem>Atribuir Responsável</DropdownMenuItem>
                        <DropdownMenuItem>Adicionar à Lista</DropdownMenuItem>
                        <DropdownMenuItem>Ver Timeline</DropdownMenuItem>
                        <DropdownMenuItem>Criar Proposta</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {companies.length} de {pagination.total} empresas
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
