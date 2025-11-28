'use client';

import { useState } from 'react';
import { ArrowLeft, MapPin, Phone, Globe, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

interface Company {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
  categories: string[];
  lead_score?: number;
  website_analysis?: {
    has_website: boolean;
    score: number;
  }[];
}

interface Search {
  id: string;
  query: string;
  status: string;
  created_at: string;
  total_found: number;
  companies: Company[];
}

interface SearchResultsProps {
  search: Search;
}

function getScoreBadge(score?: number) {
  if (!score) return { label: 'Não avaliado', color: 'bg-gray-500' };
  if (score >= 8) return { label: 'Hot Lead', color: 'bg-red-500' };
  if (score >= 5) return { label: 'Média Oportunidade', color: 'bg-yellow-500' };
  if (score >= 3) return { label: 'Baixa Oportunidade', color: 'bg-blue-500' };
  return { label: 'Ignorar', color: 'bg-gray-400' };
}

export function SearchResults({ search }: SearchResultsProps) {
  const [filter, setFilter] = useState<'all' | 'hot' | 'medium' | 'low'>('all');

  const filteredCompanies = search.companies.filter((company) => {
    if (filter === 'all') return true;
    const score = company.lead_score || 0;
    if (filter === 'hot') return score >= 8;
    if (filter === 'medium') return score >= 5 && score < 8;
    if (filter === 'low') return score >= 3 && score < 5;
    return true;
  });

  const isProcessing = search.status === 'processing';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/home/scout">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Resultados da Busca</h1>
          </div>
          <p className="text-muted-foreground">
            {search.query} • {search.total_found} empresas encontradas
          </p>
        </div>

        {isProcessing && (
          <Badge variant="outline" className="animate-pulse">
            Processando...
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todas ({search.companies.length})
        </Button>
        <Button
          variant={filter === 'hot' ? 'default' : 'outline'}
          onClick={() => setFilter('hot')}
        >
          🔥 Hot Leads ({search.companies.filter((c) => (c.lead_score || 0) >= 8).length})
        </Button>
        <Button
          variant={filter === 'medium' ? 'default' : 'outline'}
          onClick={() => setFilter('medium')}
        >
          Média ({search.companies.filter((c) => {
            const s = c.lead_score || 0;
            return s >= 5 && s < 8;
          }).length})
        </Button>
        <Button
          variant={filter === 'low' ? 'default' : 'outline'}
          onClick={() => setFilter('low')}
        >
          Baixa ({search.companies.filter((c) => {
            const s = c.lead_score || 0;
            return s >= 3 && s < 5;
          }).length})
        </Button>
      </div>

      {/* Companies Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.map((company) => {
          const scoreBadge = getScoreBadge(company.lead_score);
          const hasWebsite = company.website_analysis?.[0]?.has_website ?? !!company.website;

          return (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  <Badge className={scoreBadge.color}>
                    {company.lead_score || 0}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {scoreBadge.label}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Location */}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="line-clamp-2">{company.address}</span>
                </div>

                {/* Phone */}
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{company.phone}</span>
                  </div>
                )}

                {/* Website */}
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {hasWebsite ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-red-600 font-medium">
                      ⚠️ Sem website
                    </span>
                  )}
                </div>

                {/* Rating */}
                {company.rating && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span>
                      {company.rating.toFixed(1)} ({company.reviews_count || 0} avaliações)
                    </span>
                  </div>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {company.categories.slice(0, 3).map((category, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Action Button */}
                <Button className="w-full" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analisar Oportunidade
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhuma empresa encontrada com este filtro.
          </p>
        </div>
      )}
    </div>
  );
}
