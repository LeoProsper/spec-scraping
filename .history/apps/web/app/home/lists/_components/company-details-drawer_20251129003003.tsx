'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@kit/ui/sheet';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Separator } from '@kit/ui/separator';
import { ScrollArea } from '@kit/ui/scroll-area';
import { Skeleton } from '@kit/ui/skeleton';
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Mail,
  Star,
  Calendar,
  ExternalLink,
  MessageSquare,
  Plus,
} from 'lucide-react';
import type { ListCompany } from '../_hooks/use-list-companies';
import { useCompanyInteractions } from '../_hooks/use-interactions';
import { NewInteractionForm } from './new-interaction-form';

interface CompanyDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listCompany: ListCompany | null;
}

const INTERACTION_TYPE_MAP: Record<string, { label: string; icon: string }> = {
  chamada: { label: 'Chamada', icon: '📞' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
  email: { label: 'E-mail', icon: '📧' },
  reuniao: { label: 'Reunião', icon: '🤝' },
  proposta: { label: 'Proposta', icon: '📄' },
  followup: { label: 'Follow-up', icon: '🔄' },
  anotacao: { label: 'Anotação', icon: '📝' },
};

const RESULT_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  interessado: { label: 'Interessado', variant: 'default' },
  sem_resposta: { label: 'Sem resposta', variant: 'secondary' },
  retorno_depois: { label: 'Retorno depois', variant: 'outline' },
  fechado: { label: 'Fechado', variant: 'default' },
  recusado: { label: 'Recusado', variant: 'destructive' },
};

export function CompanyDetailsDrawer({
  open,
  onOpenChange,
  listCompany,
}: CompanyDetailsDrawerProps) {
  const [showNewInteraction, setShowNewInteraction] = useState(false);
  const company = listCompany?.company;
  const { interactions, loading: loadingInteractions, refetch } = useCompanyInteractions(
    company?.id || null
  );

  const handleInteractionSuccess = () => {
    setShowNewInteraction(false);
    refetch();
  };

  if (!company) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl">{company.name}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-6">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informações da Empresa
              </h3>

              <div className="grid gap-3 text-sm">
                {company.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{company.address}</span>
                  </div>
                )}

                {(company.receita_municipio || company.receita_uf) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>
                      {company.receita_municipio}, {company.receita_uf}
                    </span>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <a href={`tel:${company.phone}`} className="hover:underline">
                      {company.phone}
                    </a>
                  </div>
                )}

                {company.website && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      {company.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {company.cnpj && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>CNPJ: {company.cnpj}</span>
                  </div>
                )}

                {company.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{company.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({company.reviews_count || 0} avaliações)
                    </span>
                  </div>
                )}

                {company.porte_empresa && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Porte:</span>
                    <Badge variant="outline">{company.porte_empresa}</Badge>
                  </div>
                )}

                {company.cnae_principal && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground shrink-0">CNAE:</span>
                    <span>{company.cnae_principal}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Commercial Status */}
            <div className="space-y-4">
              <h3 className="font-semibold">Status Comercial</h3>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status do Lead:</span>
                  <Badge>{company.lead_status}</Badge>
                </div>

                {company.pipeline_stage && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Etapa do Pipeline:</span>
                    <Badge variant="outline">{company.pipeline_stage}</Badge>
                  </div>
                )}

                {company.tags && company.tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {company.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {company.observacoes && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Observações:</span>
                    <p className="text-sm bg-muted p-3 rounded-lg">{company.observacoes}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Interactions History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Histórico de Interações
                </h3>
                <Button
                  size="sm"
                  onClick={() => setShowNewInteraction(!showNewInteraction)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova
                </Button>
              </div>

              {showNewInteraction && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <NewInteractionForm
                    companyId={company.id}
                    onSuccess={handleInteractionSuccess}
                    onCancel={() => setShowNewInteraction(false)}
                  />
                </div>
              )}

              <div className="space-y-3">
                {loadingInteractions ? (
                  <>
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </>
                ) : interactions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma interação registrada ainda
                    </p>
                  </div>
                ) : (
                  interactions.map((interaction) => {
                    const typeConfig = INTERACTION_TYPE_MAP[interaction.tipo] || {
                      label: interaction.tipo,
                      icon: '📌',
                    };
                    const resultConfig = interaction.resultado
                      ? RESULT_MAP[interaction.resultado]
                      : null;

                    return (
                      <div
                        key={interaction.id}
                        className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{typeConfig.icon}</span>
                            <span className="font-medium">{typeConfig.label}</span>
                            {interaction.canal && (
                              <Badge variant="outline" className="text-xs">
                                {interaction.canal}
                              </Badge>
                            )}
                          </div>
                          {resultConfig && (
                            <Badge variant={resultConfig.variant} className="shrink-0">
                              {resultConfig.label}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm">{interaction.descricao}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(interaction.created_at),
                              "dd 'de' MMM 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>

                          {interaction.next_action_at && (
                            <span className="flex items-center gap-1">
                              🔔 Próxima ação:{' '}
                              {format(new Date(interaction.next_action_at), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
