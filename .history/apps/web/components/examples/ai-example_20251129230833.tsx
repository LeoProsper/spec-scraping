/**
 * Exemplo de Componente React usando a Camada de IA
 * 
 * Este é um exemplo de referência mostrando como integrar
 * a camada de IA em um componente React.
 * 
 * Localização sugerida: components/examples/ai-example.tsx
 */

'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { AIMode } from '@/lib/ai';

export function AIExampleComponent() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AIMode>('CHAT');

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Digite um prompt primeiro');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ai/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          user: prompt,
          metadata: {
            source: 'ai_example',
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        toast.success('Resposta gerada com sucesso!');

        // Mostrar info de rate limit
        if (data.rateLimitStatus) {
          const { remaining, limit } = data.rateLimitStatus;
          console.log(`Rate Limit: ${remaining}/${limit} restantes`);
        }
      } else {
        toast.error(data.error || 'Erro ao gerar resposta');

        // Mostrar detalhes de rate limit se excedido
        if (data.code === 'AI_RATE_LIMIT' && data.rateLimitStatus) {
          const resetTime = new Date(data.rateLimitStatus.resetAt).toLocaleTimeString();
          toast.info(`Reset às ${resetTime}`);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao conectar com o serviço de IA');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Exemplo de Uso da Camada de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de Modo */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Modo de IA
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as AIMode)}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="CHAT">Chat</option>
            <option value="B2B_GENERATOR">Gerador B2B</option>
            <option value="CRM_ASSISTANT">Assistente CRM</option>
            <option value="PROPOSAL_WRITER">Escritor de Propostas</option>
            <option value="EMAIL_OUTREACH">Email Outreach</option>
            <option value="CLASSIFICATION">Classificação</option>
          </select>
        </div>

        {/* Campo de Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Seu Prompt
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Digite seu prompt aqui..."
            rows={4}
            disabled={loading}
          />
        </div>

        {/* Botão Gerar */}
        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full"
        >
          <Sparkles className={`h-4 w-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Gerando...' : 'Gerar com IA'}
        </Button>

        {/* Resultado */}
        {result && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/50">
            <h3 className="text-sm font-medium mb-2">Resultado:</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {result}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Exemplo de uso BACKEND (Server-side)
 * 
 * Use quando precisar chamar a IA diretamente no servidor,
 * como em API routes, Server Actions, ou Server Components.
 */

/*
import { runAI } from '@/lib/ai';

export async function generateSomething(userId: string, input: string) {
  try {
    const result = await runAI({
      mode: 'B2B_GENERATOR',
      userId,
      user: input,
      context: 'Additional context if needed',
      metadata: {
        source: 'my_feature',
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      result: result.text
    };
  } catch (error) {
    console.error('AI Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
*/

/**
 * Exemplo de uso com STREAMING (Futuro)
 * 
 * Quando implementarmos streaming, será algo assim:
 */

/*
async function handleGenerateStream() {
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'CHAT', user: prompt })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    accumulated += chunk;
    setResult(accumulated); // Atualiza em tempo real
  }
}
*/
