'use client';

import { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Skeleton } from '@kit/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { Textarea } from '@kit/ui/textarea';
import { Copy, Sparkles, RefreshCw, Search, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Prompt {
  id: string;
  category_id: string;
  category_name: string;
  prompt_text: string;
  pain_point: string;
  data_sources: string[];
}

interface HistoryItem {
  id: string;
  prompt_text: string;
  category_name: string;
  category_icon: string;
  results_count: number;
  created_at: string;
}

export default function OpportunitiesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Carregar categorias
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/opportunities/categories');
        const data = await res.json();
        
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        toast.error('Erro ao carregar categorias');
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  // Carregar histórico
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/opportunities/history?limit=20');
        const data = await res.json();
        
        if (data.success) {
          setHistory(data.history);
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, []);

  // Gerar novo prompt
  async function handleGenerate() {
    setLoading(true);
    
    try {
      const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const res = await fetch(`/api/opportunities/generate${categoryParam}`);
      const data = await res.json();

      if (data.success) {
        setCurrentPrompt(data.prompt);
        toast.success('Nova oportunidade gerada!');
      } else {
        toast.error(data.error || 'Erro ao gerar oportunidade');
      }
    } catch (error) {
      console.error('Erro ao gerar prompt:', error);
      toast.error('Erro ao gerar oportunidade');
    } finally {
      setLoading(false);
    }
  }

  // Copiar prompt
  async function handleCopy() {
    if (!currentPrompt) return;

    try {
      await navigator.clipboard.writeText(currentPrompt.prompt_text);
      toast.success('Prompt copiado!');

      // Salvar no histórico
      await fetch('/api/opportunities/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: currentPrompt.id,
          prompt_text: currentPrompt.prompt_text,
          category_id: currentPrompt.category_id,
          results_count: 0,
        }),
      });

      // Recarregar histórico
      const res = await fetch('/api/opportunities/history?limit=20');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar prompt');
    }
  }

  const displayedHistory = showAllHistory ? history : history.slice(0, 4);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Buscador de Oportunidades B2B</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Gere prompts estratégicos de prospecção e descubra empresas com dores específicas e vendáveis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal: Gerador */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filtro de Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Escolha o Nicho</CardTitle>
              <CardDescription>
                Selecione uma categoria para gerar prompts específicos, ou deixe "Todas" para aleatoriedade total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🎲 Todas as Categorias</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Prompt Gerado */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {currentPrompt && (
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="default" className="text-base px-3 py-1">
                        {categories.find(c => c.id === currentPrompt.category_id)?.icon} {currentPrompt.category_name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        💡 {currentPrompt.pain_point}
                      </Badge>
                    </div>
                  )}
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Oportunidade Gerada
                  </CardTitle>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Gerando...' : 'Nova'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPrompt ? (
                <>
                  <Textarea
                    value={currentPrompt.prompt_text}
                    readOnly
                    className="min-h-[120px] font-mono text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Prompt
                    </Button>
                    <Button onClick={handleGenerate} variant="outline">
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {currentPrompt.data_sources.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Fontes de dados necessárias:</p>
                      <div className="flex flex-wrap gap-1">
                        {currentPrompt.data_sources.map((source) => (
                          <Badge key={source} variant="outline" className="text-xs">
                            {source.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Clique em "Buscar Oportunidades" para gerar seu primeiro prompt
                  </p>
                  <Button onClick={handleGenerate} disabled={loading}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Buscar Oportunidades
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral: Categorias Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorias Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingCategories ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">{cat.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Histórico de Resultados */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl">Histórico de Resultados</CardTitle>
              </div>
              {history.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                >
                  {showAllHistory ? 'Ver menos' : `Ver todos (${history.length})`}
                </Button>
              )}
            </div>
            <CardDescription>
              Seus últimos prompts gerados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum histórico ainda. Gere seu primeiro prompt!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedHistory.map((item) => (
                  <Card key={item.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{item.category_icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.category_name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{item.prompt_text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
