'use client';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCreateSearch } from '@kit/kaix-scout/hooks/use-search';
import { useRouter } from 'next/navigation';
import type { CreateSearchInput } from '@kit/kaix-scout/types';

export function SearchForm() {
  const router = useRouter();
  const createSearch = useCreateSearch();
  const [formData, setFormData] = useState<CreateSearchInput>({
    query: '',
    maxPlaces: 20,
    lang: 'pt',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.query.trim()) {
      return;
    }

    try {
      const result = await createSearch.mutateAsync(formData);
      // Redirect to search results page
      router.push(`/home/scout/search/${result.searchId}`);
    } catch (error) {
      console.error('Failed to create search:', error);
    }
  };

  const isLoading = createSearch.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Nova Busca
        </CardTitle>
        <CardDescription>
          Encontre empresas por região e tipo de negócio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">
              O que você procura?
            </Label>
            <Input
              id="query"
              placeholder="Ex: hotéis em São Paulo, restaurantes em Lisboa"
              value={formData.query}
              onChange={(e) =>
                setFormData({ ...formData, query: e.target.value })
              }
              disabled={isLoading}
              required
            />
            <p className="text-sm text-muted-foreground">
              Digite o tipo de negócio + localização
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxPlaces">
                Número de resultados
              </Label>
              <Select
                value={formData.maxPlaces?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, maxPlaces: parseInt(value, 10) })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="maxPlaces">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 empresas</SelectItem>
                  <SelectItem value="20">20 empresas</SelectItem>
                  <SelectItem value="50">50 empresas</SelectItem>
                  <SelectItem value="100">100 empresas (Premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lang">
                Idioma
              </Label>
              <Select
                value={formData.lang}
                onValueChange={(value) =>
                  setFormData({ ...formData, lang: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {createSearch.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {createSearch.error.message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formData.query.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Iniciar Busca
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
