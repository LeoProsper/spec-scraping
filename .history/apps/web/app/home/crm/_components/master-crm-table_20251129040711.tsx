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
} from '@kit/ui/table';
import { Card } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Avatar, AvatarFallback } from '@kit/ui/avatar';
import { 
  Globe, 
  MapPin, 
  Star, 
  MessageSquare, 
  FileText,
  Clock,
  Flame,
  Phone,
  PenLine,
  ArrowRight,
  Brain,
  ListPlus,
  Mail
} from 'lucide-react';
import { Input } from '@kit/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';
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
  priority_score: number;
  priority_level: string;
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

/**
 * FASE 6: Calcular potencial de receita por empresa
 * Heurística: base R$ 3k * status * prioridade * bônus
 */
function calculateRevenuePotential(company: Company): number {
  let valor = 3000; // Base: R$ 3.000 por lead

  // Multiplicador por status
  const statusMultiplier: Record<string, number> = {
    novo: 0.3,
    contatado: 0.5,
    qualificado: 1.0,
    negociacao: 1.5,
    proposta: 1.2,
  };
  valor *= statusMultiplier[company.lead_status] || 0.5;

  // Multiplicador por prioridade (score / 100)
  valor *= (company.priority_score || 30) / 100;

  // Bônus por avaliação alta
  if (company.rating && company.rating >= 4.5) {
    valor *= 1.2;
  }

  // Bônus por visibilidade (reviews)
  if (company.total_reviews && company.total_reviews >= 50) {
    valor *= 1.3;
  }

  return Math.round(valor);
}

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
              <TableHead className="text-center">🔢 Prioridade</TableHead>
              <TableHead className="text-center">💰 Potencial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Interações</TableHead>
              <TableHead className="text-center">Propostas</TableHead>
              <TableHead>Última Atividade</TableHead>
              <TableHead>Listas</TableHead>
              <TableHead className="text-center">⚡ Contato</TableHead>
              <TableHead className="w-[280px]">Ações Rápidas</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
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

                  {/* Prioridade (FASE 4) */}
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        company.priority_level === 'alta'
                          ? 'bg-red-100 text-red-800 font-semibold'
                          : company.priority_level === 'media'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {company.priority_level === 'alta' ? '🔥 Alta' : 
                       company.priority_level === 'media' ? '⚡ Média' : 
                       '✅ Baixa'}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {company.priority_score} pts
                    </div>
                  </TableCell>

                  {/* Potencial de Receita (FASE 6) */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold text-green-600">
                        R$ {(calculateRevenuePotential(company) / 1000).toFixed(1)}k
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        estimado
                      </span>
                    </div>
                  </TableCell>

                  {/* Status (FASE 5: com badges de alerta) */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge 
                        variant="secondary"
                        className={LEAD_STATUS_COLORS[company.lead_status] || ''}
                      >
                        {LEAD_STATUS_LABELS[company.lead_status] || company.lead_status}
                      </Badge>
                      
                      {/* Badges de alerta visual */}
                      <div className="flex flex-wrap gap-1">
                        {company.followup_vencido && (
                          <Badge variant="destructive" className="text-xs">
                            💥 Follow-up vencido
                          </Badge>
                        )}
                        {company.is_hot_lead && (
                          <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
                            ⚡ Lead quente
                          </Badge>
                        )}
                        {company.dias_sem_interacao !== null && company.dias_sem_interacao > 14 && (
                          <Badge className="text-xs bg-blue-500 hover:bg-blue-600">
                            🧊 Lead parado
                          </Badge>
                        )}
                      </div>
                    </div>
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

                  {/* Ações Imediatas (FASE P5) */}
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex items-center justify-center gap-1">
                        {/* WhatsApp */}
                        {company.phone && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                                onClick={async () => {
                                  const phoneClean = company.phone?.replace(/\D/g, '');
                                  window.open(`https://wa.me/${phoneClean}`, '_blank');
                                  
                                  // Registrar telemetria
                                  await fetch('/api/telemetry/track', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      evento: 'contato_whatsapp_clicado',
                                      company_id: company.company_id,
                                    }),
                                  });
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>💬 Abrir WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Ligar */}
                        {company.phone && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => {
                                  window.location.href = `tel:${company.phone}`;
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>📞 Ligar</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* E-mail */}
                        {company.website && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
                                onClick={() => {
                                  const domain = company.website?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
                                  window.location.href = `mailto:contato@${domain}`;
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>✉️ Enviar E-mail</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {!company.phone && !company.website && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>

                  {/* Ações Rápidas - Botões Visíveis */}
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex items-center gap-1">
                        {/* Registrar Interação */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => {
                                console.log('Registrar interação:', company.company_id);
                                // TODO: Abrir modal de interação
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>📞 Registrar Interação</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Criar Proposta */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
                              onClick={() => {
                                console.log('Criar proposta:', company.company_id);
                                // TODO: Abrir modal de proposta
                              }}
                            >
                              <PenLine className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>✍️ Criar Proposta</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Avançar Status */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600"
                              onClick={() => {
                                console.log('Avançar status:', company.company_id);
                                // TODO: Abrir modal de status
                              }}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>🟡 Avançar Status</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Abrir Timeline */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-cyan-50 hover:text-cyan-600"
                              onClick={() => {
                                console.log('Ver timeline:', company.company_id);
                                // TODO: Abrir modal de timeline
                              }}
                            >
                              <Brain className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>🧠 Abrir Timeline</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Adicionar à Lista */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                              onClick={() => {
                                console.log('Adicionar à lista:', company.company_id);
                                // TODO: Abrir modal de lista
                              }}
                            >
                              <ListPlus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>📌 Adicionar à Lista</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
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
