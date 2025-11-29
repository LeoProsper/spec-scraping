'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import { toast } from '@kit/ui/sonner';
import { Loader2 } from 'lucide-react';
import { useListTemplates } from '../_hooks/use-templates';
import { Badge } from '@kit/ui/badge';
import { ScrollArea } from '@kit/ui/scroll-area';

interface CreateListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'manual' | 'template';
  onSuccess: (listId: string) => void;
}

export function CreateListModal({ open, onOpenChange, mode, onSuccess }: CreateListModalProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { templates } = useListTemplates();
  const supabase = getSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'manual' && !nome.trim()) return;
    if (mode === 'template' && !selectedTemplateId) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      if (mode === 'manual') {
        const { data, error } = await supabase
          .from('lists')
          .insert({
            user_id: userData.user.id,
            nome,
            descricao: descricao || null,
            filtros: {},
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Lista criada!',
          description: 'Sua lista foi criada com sucesso.',
        });

        onSuccess(data.id);
      } else {
        // Usar função RPC do Supabase para criar de template
        const { data, error } = await supabase.rpc('criar_lista_de_template', {
          p_template_id: selectedTemplateId,
          p_user_id: userData.user.id,
          p_nome_customizado: nome || null,
        });

        if (error) throw error;

        toast({
          title: 'Lista criada a partir do template!',
          description: 'Sua lista foi criada com sucesso.',
        });

        onSuccess(data);
      }

      // Reset
      setNome('');
      setDescricao('');
      setSelectedTemplateId(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar lista',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === 'manual' ? 'Nova Lista' : 'Criar a partir de Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'manual' 
              ? 'Crie uma lista personalizada para organizar suas empresas.'
              : 'Escolha um template pré-configurado para começar rapidamente.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {mode === 'manual' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da lista *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Restaurantes sem site"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descreva o propósito desta lista..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                {selectedTemplate && (
                  <div className="space-y-2">
                    <Label htmlFor="nome-custom">Nome customizado (opcional)</Label>
                    <Input
                      id="nome-custom"
                      placeholder={selectedTemplate.nome}
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Deixe em branco para usar o nome do template
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Templates Disponíveis</Label>
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplateId(template.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            selectedTemplateId === template.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{template.nome}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.descricao}
                              </p>
                            </div>
                            {template.categoria && (
                              <Badge variant="outline" className="shrink-0">
                                {template.categoria}
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || (mode === 'template' && !selectedTemplateId)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Lista
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
