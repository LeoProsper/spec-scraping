'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Star, MapPin, Phone, Globe, Eye, MessageSquare, ArrowUpDown, Send, Users, ListFilter, Plus, PhoneCall, FileText, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Skeleton } from '@kit/ui/skeleton';
import { Checkbox } from '@kit/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import type { ListCompany } from '../_hooks/use-list-companies';

interface ListCompaniesTableProps {
  companies: ListCompany[];
  loading: boolean;
  onViewDetails: (company: ListCompany) => void;
  onRegisterInteraction: (company: ListCompany) => void;
}

const LEAD_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  novo: { label: 'Novo', variant: 'default' },
  contatado: { label: 'Contatado', variant: 'secondary' },
  qualificado: { label: 'Qualificado', variant: 'outline' },
  negociando: { label: 'Negociando', variant: 'secondary' },
  ganho: { label: 'Ganho', variant: 'default' },
  perdido: { label: 'Perdido', variant: 'destructive' },
};

export function ListCompaniesTable({
  companies,
  loading,
  onViewDetails,
  onRegisterInteraction,
}: ListCompaniesTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'reviews' | 'interaction'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredCompanies = companies
    .filter(lc => {
      if (statusFilter === 'all') return true;
      return lc.company.lead_status === statusFilter;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortBy) {
        case 'name':
          return multiplier * a.company.name.localeCompare(b.company.name);
        case 'rating':
          return multiplier * ((a.company.rating || 0) - (b.company.rating || 0));
        case 'reviews':
          return multiplier * ((a.company.reviews_count || 0) - (b.company.reviews_count || 0));
        case 'interaction':
          const aTime = a.company.ultima_interacao ? new Date(a.company.ultima_interacao).getTime() : 0;
          const bTime = b.company.ultima_interacao ? new Date(b.company.ultima_interacao).getTime() : 0;
          return multiplier * (aTime - bTime);
        default:
          return 0;
      }
    });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCompanies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCompanies.map(lc => lc.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-gradient-to-br from-background to-accent/20">
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <TrendingUp className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Transforme dados em vendas</h3>
              <p className="text-muted-foreground">
                Você ainda não adicionou empresas — comece por um template pronto e gere oportunidades de venda agora
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button size="lg" className="gap-2">
                <ListFilter className="h-5 w-5" />
                Usar Template Pronto
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Plus className="h-5 w-5" />
                Criar Lista Manual
              </Button>
            </div>
            
            <Button variant="link" className="text-sm">
              <Users className="h-4 w-4 mr-2" />
              Explorar Listas Públicas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="contatado">Contatado</SelectItem>
              <SelectItem value="qualificado">Qualificado</SelectItem>
              <SelectItem value="negociando">Negociando</SelectItem>
              <SelectItem value="ganho">Ganho</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.length > 0 && (
            <Badge variant="secondary">
              {selectedIds.length} selecionada{selectedIds.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === filteredCompanies.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('name')}
                  className="-ml-3"
                >
                  Empresa
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('rating')}
                  className="-ml-3"
                >
                  Avaliação
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('interaction')}
                  className="-ml-3"
                >
                  Última Interação
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[180px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((listCompany) => {
              const company = listCompany.company;
              const statusConfig = LEAD_STATUS_MAP[company.lead_status] || LEAD_STATUS_MAP.novo;
              
              return (
                <TableRow key={listCompany.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(listCompany.id)}
                      onCheckedChange={() => toggleSelect(listCompany.id)}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{company.name}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {company.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {company.phone}
                          </span>
                        )}
                        {company.website && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Site
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-start gap-1 text-sm">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {company.receita_municipio && company.receita_uf
                          ? `${company.receita_municipio}, ${company.receita_uf}`
                          : company.address || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {company.rating ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{company.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({company.reviews_count || 0})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem avaliação</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {company.ultima_interacao ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(company.ultima_interacao), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nunca</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(listCompany)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRegisterInteraction(listCompany)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Interação
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
