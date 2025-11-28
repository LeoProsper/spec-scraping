'use client';

import { Button } from '@kit/ui/button';
import { Checkbox } from '@kit/ui/checkbox';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Phone,
  Star,
  ExternalLink,
  MessageCircle,
  Mail,
  Instagram,
  Facebook,
  Youtube,
} from 'lucide-react';
import { useState } from 'react';

type Place = {
  place_id?: string;
  name: string;
  address?: string;
  rating?: number;
  reviews_count?: number;
  categories?: string[];
  website?: string;
  phone?: string;
  link?: string;
  opening_hours?: string;
  about?: string;
  email?: string;
  whatsapp?: string;
  images?: string[];
  top_reviews?: Array<{
    author: string;
    rating: string | number;
    text: string;
    time: string;
  }>;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

interface ResultsTableProps {
  results: Place[];
  onNewSearch: () => void;
}

// Função auxiliar para extrair WhatsApp do telefone
function extractWhatsApp(phone?: string): string | null {
  if (!phone) return null;
  // Remove tudo exceto números
  const cleaned = phone.replace(/\D/g, '');
  // Se tiver 10 ou 11 dígitos (celular brasileiro), retorna formatado para WhatsApp
  if (cleaned.length >= 10) {
    return cleaned;
  }
  return null;
}

// Função auxiliar para detectar redes sociais na descrição/about
function extractSocialMedia(about?: string, website?: string) {
  const social = {
    instagram: null as string | null,
    facebook: null as string | null,
    youtube: null as string | null,
  };

  const text = `${about || ''} ${website || ''}`.toLowerCase();
  
  // Instagram
  const instaMatch = text.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  if (instaMatch) social.instagram = `https://instagram.com/${instaMatch[1]}`;
  
  // Facebook
  const fbMatch = text.match(/facebook\.com\/([a-zA-Z0-9._]+)/);
  if (fbMatch) social.facebook = `https://facebook.com/${fbMatch[1]}`;
  
  // YouTube
  const ytMatch = text.match(/youtube\.com\/(c\/|channel\/|user\/)?([a-zA-Z0-9._-]+)/);
  if (ytMatch) social.youtube = `https://youtube.com/${ytMatch[1] || ''}${ytMatch[2]}`;

  return social;
}

export function ResultsTable({ results, onNewSearch }: ResultsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (placeId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(placeId)) {
      newSelected.delete(placeId);
    } else {
      newSelected.add(placeId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((r) => r.place_id || r.name)));
    }
  };

  const toggleExpanded = (placeId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(placeId)) {
      newExpanded.delete(placeId);
    } else {
      newExpanded.add(placeId);
    }
    setExpandedIds(newExpanded);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 className="text-lg font-semibold">Resultados da busca</h2>
            <p className="text-sm text-muted-foreground">
              {results.length} empresas encontradas
              {selectedIds.size > 0 && ` • ${selectedIds.size} selecionadas`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button variant="outline" size="sm">
                Exportar ({selectedIds.size})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onNewSearch}>
              Nova busca
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Checkbox para selecionar todos */}
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg">
            <Checkbox
              checked={selectedIds.size === results.length && results.length > 0}
              onCheckedChange={toggleSelectAll}
              aria-label="Selecionar todos"
            />
            <span className="text-sm text-muted-foreground">
              Selecionar todos os resultados
            </span>
          </div>

          {results.length > 0 ? (
            results.map((place) => {
              const placeId = place.place_id || place.name;
              const isSelected = selectedIds.has(placeId);
              const isExpanded = expandedIds.has(placeId);
              const whatsapp = extractWhatsApp(place.phone);
              const social = extractSocialMedia(place.about, place.website);
              const description = place.about || 
                (place.categories && place.categories.length > 0 
                  ? place.categories.slice(0, 2).join(' • ') 
                  : 'Estabelecimento local');

              return (
                <div
                  key={placeId}
                  className={`border rounded-lg bg-card transition-all ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(placeId)}
                        className="mt-1"
                        aria-label={`Selecionar ${place.name}`}
                      />

                      {/* Conteúdo Principal */}
                      <div className="flex-1 min-w-0">
                        {/* Nome e Avaliação */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg leading-tight">
                              {place.name}
                            </h3>
                            {place.rating && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium text-sm">
                                  {place.rating.toFixed(1)}
                                </span>
                                {place.reviews_count && (
                                  <span className="text-xs text-muted-foreground">
                                    ({place.reviews_count} avaliações)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Botão Expandir */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => toggleExpanded(placeId)}
                            aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                        </div>

                        {/* Descrição */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {description}
                        </p>

                        {/* Ícones de Contato e Redes Sociais */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Telefone */}
                          {place.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3"
                              asChild
                            >
                              <a href={`tel:${place.phone}`} title={`Ligar: ${place.phone}`}>
                                <Phone className="h-4 w-4 mr-2" />
                                Telefone
                              </a>
                            </Button>
                          )}

                          {/* WhatsApp */}
                          {whatsapp && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
                              asChild
                            >
                              <a
                                href={`https://wa.me/55${whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                              </a>
                            </Button>
                          )}

                          {/* Email (placeholder - precisa ser extraído) */}
                          {place.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3"
                              asChild
                            >
                              <a href={`mailto:${place.email}`} title={`Email: ${place.email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Email
                              </a>
                            </Button>
                          )}

                          {/* Website */}
                          {place.website && place.website.trim() !== '' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3"
                              asChild
                            >
                              <a
                                href={place.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Visitar website"
                              >
                                <Globe className="h-4 w-4 mr-2" />
                                Site
                              </a>
                            </Button>
                          )}

                          {/* Comentários/Reviews */}
                          {place.top_reviews && place.top_reviews.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3"
                              onClick={() => toggleExpanded(placeId)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Comentários ({place.top_reviews.length})
                            </Button>
                          )}

                          {/* Instagram */}
                          {social.instagram && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              asChild
                            >
                              <a
                                href={social.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Instagram"
                              >
                                <Instagram className="h-4 w-4" />
                              </a>
                            </Button>
                          )}

                          {/* Facebook */}
                          {social.facebook && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              asChild
                            >
                              <a
                                href={social.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Facebook"
                              >
                                <Facebook className="h-4 w-4" />
                              </a>
                            </Button>
                          )}

                          {/* YouTube */}
                          {social.youtube && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              asChild
                            >
                              <a
                                href={social.youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="YouTube"
                              >
                                <Youtube className="h-4 w-4" />
                              </a>
                            </Button>
                          )}

                          {/* Google Business (Maps Link) */}
                          {place.link && place.link.trim() !== '' && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              asChild
                            >
                              <a
                                href={place.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ver no Google Maps"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo Expandido (Sanfona) */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4">
                      <div className="grid gap-4 text-sm">
                        {/* Endereço */}
                        {place.address && (
                          <div>
                            <div className="font-medium text-muted-foreground mb-1">
                              📍 Endereço
                            </div>
                            <div>{place.address}</div>
                          </div>
                        )}

                        {/* Horário de Funcionamento */}
                        {place.opening_hours && (
                          <div>
                            <div className="font-medium text-muted-foreground mb-1">
                              🕐 Horário de Funcionamento
                            </div>
                            <div>{place.opening_hours}</div>
                          </div>
                        )}

                        {/* Reviews/Comentários */}
                        {place.top_reviews && place.top_reviews.length > 0 && (
                          <div>
                            <div className="font-medium text-muted-foreground mb-2">
                              💬 Comentários de Clientes
                            </div>
                            <div className="space-y-3">
                              {place.top_reviews.slice(0, 3).map((review, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-background rounded-lg border"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {review.author}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs">{review.rating}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {review.time}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-3">
                                    {review.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Link do Google Maps */}
                        {place.link && place.link.trim() !== '' && (
                          <div>
                            <a
                              href={place.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver localização completa no Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
