'use client';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Star,
  Instagram,
  Facebook,
  Youtube,
  ExternalLink,
  MoreVertical,
  ChevronDown,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

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
  top_reviews?: Array<{
    author: string;
    rating: string | number;
    text: string;
    time: string;
  }>;
  images?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

interface ResultsTableProps {
  results: Place[];
  onNewSearch: () => void;
}

function extractWhatsApp(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `55${digits}`;
  }
  return null;
}

function hasSocialMedia(place: Place, platform: string): boolean {
  if (!place.about || typeof place.about !== 'string') return false;
  const text = place.about.toLowerCase();
  const keywords: Record<string, string[]> = {
    instagram: ['instagram', 'insta', '@'],
    facebook: ['facebook', 'fb.com'],
    youtube: ['youtube', 'youtu.be'],
    tiktok: ['tiktok', 'tik tok'],
  };
  return keywords[platform]?.some((k) => text.includes(k)) || false;
}

function CompanyItem({ place }: { place: Place; index?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const whatsapp = extractWhatsApp(place.phone);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={`border-b border-border transition-colors ${
          isOpen ? 'bg-muted/30' : 'hover:bg-muted/20'
        }`}
      >
        {/* SINGLE LINE */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-4 px-6 py-3 cursor-pointer">
            {/* A) IDENTIDADE */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar/Logo */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-primary">
                  {place.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Nome + Categoria */}
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-sm text-foreground truncate">
                  {place.name}
                </span>
                {place.categories && place.categories[0] && (
                  <span className="text-xs text-muted-foreground truncate">
                    {place.categories[0]}
                  </span>
                )}
              </div>
            </div>

            {/* B) AVALIAÇÃO */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">
                {place.rating?.toFixed(1) || 'N/A'}
              </span>
              {place.reviews_count && (
                <span className="text-muted-foreground">
                  ({place.reviews_count})
                </span>
              )}
            </div>

            {/* C) ÍCONES DE CONTATO */}
            <div className="flex items-center gap-2 shrink-0">
              {place.phone && (
                <a
                  href={`tel:${place.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  title="Telefone"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </a>
              )}

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-green-50 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                </a>
              )}

              {place.email && (
                <a
                  href={`mailto:${place.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  title="Email"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </a>
              )}

              {place.website && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  title="Website"
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </a>
              )}

              {place.link && (
                <a
                  href={place.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  title="Google Maps"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </a>
              )}

              <div className="w-px h-5 bg-border mx-1" />

              {hasSocialMedia(place, 'instagram') && (
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                </button>
              )}

              {hasSocialMedia(place, 'facebook') && (
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  title="Facebook"
                >
                  <Facebook className="h-4 w-4 text-muted-foreground" />
                </button>
              )}

              {hasSocialMedia(place, 'youtube') && (
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  title="YouTube"
                >
                  <Youtube className="h-4 w-4 text-muted-foreground" />
                </button>
              )}

              {hasSocialMedia(place, 'tiktok') && (
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  title="TikTok"
                >
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </button>
              )}
            </div>

            {/* D) STATUS + MENU */}
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="secondary" className="text-xs">
                Novo
              </Badge>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>

              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        {/* SANFONA - DETALHES */}
        <CollapsibleContent>
          <div className="px-6 pb-6 pt-2 space-y-6 bg-muted/10">
            {/* DESCRIÇÃO */}
            {place.about && (
              <div>
                <h3 className="text-sm font-medium mb-2">Sobre</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {place.about}
                </p>
              </div>
            )}

            {/* ENDEREÇO + MAPA */}
            {place.address && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {place.address}
                </p>
                {place.link && (
                  <a
                    href={place.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Ver no Google Maps
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* HORÁRIO DE FUNCIONAMENTO */}
            {place.opening_hours && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário de Funcionamento
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {place.opening_hours}
                </p>
              </div>
            )}

            {/* FOTOS */}
            {place.images && place.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Fotos ({place.images.length})
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {place.images.slice(0, 8).map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-md overflow-hidden bg-muted relative"
                    >
                      <Image
                        src={img}
                        alt={`${place.name} - ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {place.top_reviews && place.top_reviews.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Avaliações Recentes
                </h3>
                <div className="space-y-4">
                  {place.top_reviews.slice(0, 3).map((review, idx) => (
                    <div
                      key={idx}
                      className="border border-border rounded-lg p-4 bg-background"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">
                            {review.author}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {review.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Number(review.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AÇÕES */}
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline">
                Visualizar Completo
              </Button>
              <Button size="sm" variant="outline">
                Analisar Site
              </Button>
              <Button size="sm">Criar Proposta</Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ResultsTable({ results, onNewSearch }: ResultsTableProps) {
  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="border-b border-border bg-muted/5">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {results.length} empresas encontradas
            </h2>
            <p className="text-sm text-muted-foreground">
              Clique em cada item para ver os detalhes completos
            </p>
          </div>
          <Button onClick={onNewSearch} variant="outline" size="sm">
            Nova Busca
          </Button>
        </div>
      </div>

      {/* LISTA */}
      <div className="border border-border rounded-lg overflow-hidden bg-background mt-4">
        {results.map((place, index) => (
          <CompanyItem key={place.place_id || index} place={place} index={index} />
        ))}
      </div>
    </div>
  );
}
