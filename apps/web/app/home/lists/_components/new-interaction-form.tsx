'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { useToast } from '@kit/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useCompanyInteractions } from '../_hooks/use-interactions';

interface NewInteractionFormProps {
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function NewInteractionForm({ companyId, onSuccess, onCancel }: NewInteractionFormProps) {
  const [tipo, setTipo] = useState('');
  const [canal, setCanal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [resultado, setResultado] = useState('');
  const [nextActionAt, setNextActionAt] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { addInteraction } = useCompanyInteractions(companyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo || !descricao) return;

    setLoading(true);
    try {
      await addInteraction({
        tipo,
        canal: canal || undefined,
        descricao,
        resultado: resultado || undefined,
        next_action_at: nextActionAt || undefined,
      });

      toast({
        title: 'Interação registrada!',
        description: 'A interação foi salva com sucesso.',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar interação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select value={tipo} onValueChange={setTipo} required>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chamada">📞 Chamada</SelectItem>
              <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
              <SelectItem value="email">📧 E-mail</SelectItem>
              <SelectItem value="reuniao">🤝 Reunião</SelectItem>
              <SelectItem value="proposta">📄 Proposta</SelectItem>
              <SelectItem value="followup">🔄 Follow-up</SelectItem>
              <SelectItem value="anotacao">📝 Anotação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="canal">Canal</Label>
          <Input
            id="canal"
            placeholder="Ex: Telefone fixo, WhatsApp Business..."
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Textarea
          id="descricao"
          placeholder="Descreva o que aconteceu nesta interação..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="resultado">Resultado</Label>
          <Select value={resultado} onValueChange={setResultado}>
            <SelectTrigger id="resultado">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interessado">✅ Interessado</SelectItem>
              <SelectItem value="sem_resposta">⏸️ Sem resposta</SelectItem>
              <SelectItem value="retorno_depois">🔄 Retorno depois</SelectItem>
              <SelectItem value="fechado">🎉 Fechado</SelectItem>
              <SelectItem value="recusado">❌ Recusado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="next-action">Próxima Ação</Label>
          <Input
            id="next-action"
            type="datetime-local"
            value={nextActionAt}
            onChange={(e) => setNextActionAt(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !tipo || !descricao}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar Interação
        </Button>
      </div>
    </form>
  );
}
