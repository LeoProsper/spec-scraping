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
  MoreVertical,
  ChevronDown,
  Clock,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useRef } from 'react';
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
  plus_code?: string;
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
  const [imageScrollPosition, setImageScrollPosition] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const whatsapp = extractWhatsApp(place.phone);

  const scrollImages = (direction: 'left' | 'right') => {
    if (!imageContainerRef.current) return;
    const scrollAmount = 176; // 160px (width) + 16px (gap * 2)
    const newPosition = direction === 'left' 
      ? Math.max(0, imageScrollPosition - scrollAmount)
      : imageScrollPosition + scrollAmount;
    
    imageContainerRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    setImageScrollPosition(newPosition);
  };

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
          <div className="px-6 pb-6 pt-2 bg-muted/10">
            <div className="grid grid-cols-2 gap-6">
              {/* COLUNA ESQUERDA - GOOGLE BUSINESS */}
              <div className="space-y-6">
                <div className="pb-2 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    📍 Informações do Google Business
                  </h3>
                </div>

                {/* DESCRIÇÃO */}
                {place.about && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sobre</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {place.about}
                    </p>
                  </div>
                )}

                {/* ENDEREÇO */}
                {place.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground">{place.address}</p>
                      {place.link && (
                        <a
                          href={place.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs mt-1 inline-block"
                        >
                          Ver no mapa
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* LOCALIZADO EM */}
                {place.address && place.address.includes(',') && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Localizado em: <span className="text-foreground font-medium">{place.address.split(',').slice(-2).join(',').trim()}</span></p>
                    </div>
                  </div>
                )}

                {/* WEBSITE */}
                {place.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </a>
                  </div>
                )}

                {/* TELEFONE */}
                {place.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <a
                      href={`tel:${place.phone}`}
                      className="text-primary hover:underline"
                    >
                      {place.phone}
                    </a>
                  </div>
                )}

                {/* PLUS CODE */}
                {place.plus_code && (
                  <div className="flex items-start gap-3 text-sm">
                    <svg className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-foreground">{place.plus_code}</p>
                  </div>
                )}

                {/* HORÁRIO DE CHECK-IN/CHECK-OUT */}
                {place.opening_hours && place.opening_hours.includes('check') && (
                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      {place.opening_hours.split('\n').map((line, i) => (
                        <p key={i} className="text-foreground">{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* EMPRESA LGBTQ+ */}
                {place.about && place.about.toLowerCase().includes('lgbtq') && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="h-5 w-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-foreground">Empresa que acolhe a comunidade LGBTQ+</p>
                  </div>
                )}

                {/* SUAS ATIVIDADES NO GOOGLE MAPS */}
                {place.link && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="h-5 w-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <a
                      href={place.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Suas atividades no Google Maps
                    </a>
                  </div>
                )}

                {/* ADICIONAR MARCADOR */}
                {place.link && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="h-5 w-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <button className="text-primary hover:underline text-left">
                      Adicionar marcador
                    </button>
                  </div>
                )}

                {/* HORÁRIO DE FUNCIONAMENTO */}
                {place.opening_hours && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horário de Funcionamento
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {place.opening_hours}
                    </p>
                  </div>
                )}

                {/* FOTOS */}
                {place.images && place.images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Fotos ({place.images.length})
                    </h4>
                    <div className="relative group">
                      {/* Botão Anterior */}
                      {imageScrollPosition > 0 && (
                        <button
                          onClick={() => scrollImages('left')}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center bg-background/90 hover:bg-background border border-border rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      )}

                      {/* Container de Imagens */}
                      <div 
                        ref={imageContainerRef}
                        className="flex gap-2 overflow-x-hidden scroll-smooth"
                      >
                        {place.images.slice(0, 10).map((img, idx) => (
                          <div
                            key={idx}
                            className="h-20 w-20 rounded-md overflow-hidden bg-muted relative shrink-0"
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

                      {/* Botão Próximo */}
                      {place.images.length > 5 && (
                        <button
                          onClick={() => scrollImages('right')}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center bg-background/90 hover:bg-background border border-border rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* REVIEWS */}
                {place.top_reviews && place.top_reviews.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Avaliações Recentes
                    </h4>
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

                {/* RESUMO DAS AVALIAÇÕES DO GOOGLE */}
                {place.rating && place.reviews_count && (
                  <div className="border-t border-border pt-6 mt-6">
                    {/* HEADER COM TÍTULO E ÍCONE DE AJUDA */}
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-base font-normal text-foreground">Resumo de avaliações</h4>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* LAYOUT EM DUAS COLUNAS - EXATAMENTE COMO NO GOOGLE MAPS */}
                    <div className="flex items-start gap-8">
                      {/* COLUNA ESQUERDA - BARRAS DE DISTRIBUIÇÃO */}
                      <div className="flex-1 space-y-2.5">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          // Simulação de distribuição baseada no rating médio
                          const avgRating = place.rating || 0;
                          let percentage = 0;
                          
                          if (stars === 5) percentage = avgRating >= 4.5 ? 75 : avgRating >= 4 ? 50 : 30;
                          else if (stars === 4) percentage = avgRating >= 4 ? 20 : 15;
                          else if (stars === 3) percentage = avgRating < 4 ? 10 : 5;
                          else if (stars === 2) percentage = avgRating < 3 ? 8 : 3;
                          else percentage = avgRating < 3 ? 7 : 2;
                          
                          return (
                            <div key={stars} className="flex items-center gap-2.5">
                              <span className="text-xs text-foreground w-2 text-right">{stars}</span>
                              <div className="flex-1 h-3 bg-[#e8eaed] dark:bg-gray-700 rounded-sm overflow-hidden">
                                <div
                                  className="h-full bg-[#fbbc04] transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* COLUNA DIREITA - NOTA GRANDE, ESTRELAS E LINK */}
                      <div className="flex flex-col items-end gap-1.5">
                        {/* NOTA GRANDE */}
                        <div className="text-[56px] font-normal leading-none text-foreground tracking-tight">
                          {place.rating?.toFixed(1).replace('.', ',')}
                        </div>
                        {/* ESTRELAS */}
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(place.rating || 0)
                                  ? 'fill-[#fbbc04] text-[#fbbc04]'
                                  : i < (place.rating || 0)
                                  ? 'fill-[#fbbc04] text-[#fbbc04]'
                                  : 'fill-none text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        {/* LINK DE AVALIAÇÕES */}
                        <a 
                          href={place.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                        >
                          {place.reviews_count?.toLocaleString('pt-BR')} avaliações
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* ANÁLISE DE COMENTÁRIOS */}
                {place.top_reviews && place.top_reviews.length > 0 && (
                  <div className="border-t border-border pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-medium">Avaliações</h4>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-muted rounded-full transition-colors">
                          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-lg transition-colors">
                          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                          </svg>
                          <span className="text-sm">Ordenar</span>
                        </button>
                      </div>
                    </div>

                    {/* ANÁLISE DE SENTIMENTO */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* PONTOS POSITIVOS */}
                      <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                        <h5 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Satisfação
                        </h5>
                        <div className="space-y-2">
                          {(() => {
                            const positiveWords = ['excelente', 'ótimo', 'maravilhoso', 'perfeito', 'delicioso', 'fantástico', 'incrível', 'adorei', 'amei', 'recomendo', 'melhor', 'boa', 'bom', 'gostoso', 'agradável'];
                            const allText = place.top_reviews
                              .map(r => r.text.toLowerCase())
                              .join(' ');
                            
                            const foundWords: Array<{word: string, count: number}> = [];
                            positiveWords.forEach(word => {
                              const regex = new RegExp(word, 'gi');
                              const matches = allText.match(regex);
                              if (matches && matches.length > 0) {
                                foundWords.push({ word, count: matches.length });
                              }
                            });

                            return foundWords
                              .sort((a, b) => b.count - a.count)
                              .slice(0, 5)
                              .map(({ word, count }) => (
                                <div key={word} className="flex items-center justify-between text-sm">
                                  <span className="text-foreground capitalize">{word}</span>
                                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                                    {count}x
                                  </span>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>

                      {/* PONTOS DE ATENÇÃO */}
                      <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                        <h5 className="text-sm font-semibold mb-3 flex items-center gap-2 text-orange-700 dark:text-orange-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Dores/Problemas
                        </h5>
                        <div className="space-y-2">
                          {(() => {
                            const negativeWords = ['ruim', 'péssimo', 'demorado', 'caro', 'frio', 'demora', 'espera', 'problema', 'erro', 'falta', 'sujo', 'mal', 'difícil', 'lento'];
                            const allText = place.top_reviews
                              .map(r => r.text.toLowerCase())
                              .join(' ');
                            
                            const foundWords: Array<{word: string, count: number}> = [];
                            negativeWords.forEach(word => {
                              const regex = new RegExp(word, 'gi');
                              const matches = allText.match(regex);
                              if (matches && matches.length > 0) {
                                foundWords.push({ word, count: matches.length });
                              }
                            });

                            if (foundWords.length === 0) {
                              return (
                                <p className="text-sm text-muted-foreground italic">
                                  Nenhum problema recorrente identificado
                                </p>
                              );
                            }

                            return foundWords
                              .sort((a, b) => b.count - a.count)
                              .slice(0, 5)
                              .map(({ word, count }) => (
                                <div key={word} className="flex items-center justify-between text-sm">
                                  <span className="text-foreground capitalize">{word}</span>
                                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                                    {count}x
                                  </span>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* MENÇÕES FREQUENTES (PALAVRAS-CHAVE GERAIS) */}
                    <div className="mb-6">
                      <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Menções frequentes
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const allText = place.top_reviews
                            .map(r => r.text.toLowerCase())
                            .join(' ');
                          
                          const stopWords = ['o', 'a', 'de', 'da', 'do', 'e', 'é', 'em', 'para', 'com', 'um', 'uma', 'os', 'as', 'dos', 'das', 'no', 'na', 'que', 'se', 'por', 'mais', 'muito', 'bem', 'foi', 'ser', 'tem', 'são', 'mas', 'como', 'está', 'pela', 'pelo'];
                          
                          const words = allText
                            .replace(/[.,!?;:()[\]]/g, '')
                            .split(' ')
                            .filter(w => w.length > 4 && !stopWords.includes(w));
                          
                          const wordCount: Record<string, number> = {};
                          words.forEach(word => {
                            wordCount[word] = (wordCount[word] || 0) + 1;
                          });
                          
                          const topWords = Object.entries(wordCount)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 10)
                            .map(([word, count]) => ({ word, count }));
                          
                          return topWords.map(({ word, count }) => (
                            <button
                              key={word}
                              className="px-3 py-1.5 text-xs bg-background border border-border rounded-full hover:bg-muted transition-colors"
                            >
                              {word} {count > 1 && <span className="text-muted-foreground">{count}</span>}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* FILTROS */}
                    <div>
                      <h5 className="text-xs font-medium mb-3 text-muted-foreground">
                        Filtrar avaliações
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-3 py-1.5 text-xs bg-muted border border-border rounded-full">
                          ✓ Tudo
                        </button>
                        {(() => {
                          const ratings = place.top_reviews.map(r => Number(r.rating));
                          const has5Stars = ratings.some(r => r === 5);
                          const has4Stars = ratings.some(r => r === 4);
                          const hasLow = ratings.some(r => r <= 3);
                          
                          return (
                            <>
                              {has5Stars && (
                                <button className="px-3 py-1.5 text-xs bg-background border border-border rounded-full hover:bg-muted transition-colors">
                                  5 estrelas
                                </button>
                              )}
                              {has4Stars && (
                                <button className="px-3 py-1.5 text-xs bg-background border border-border rounded-full hover:bg-muted transition-colors">
                                  4 estrelas
                                </button>
                              )}
                              {hasLow && (
                                <button className="px-3 py-1.5 text-xs bg-background border border-border rounded-full hover:bg-muted transition-colors">
                                  Críticas
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COLUNA DIREITA - INFORMAÇÕES ESTRATÉGICAS */}
              <div className="space-y-6">
                <div className="pb-2 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    🎯 Análise Estratégica
                  </h3>
                </div>

                {/* PLACEHOLDER */}
                <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg p-8">
                  <p className="text-sm text-muted-foreground text-center">
                    Informações estratégicas
                    <br />
                    serão adicionadas aqui
                  </p>
                </div>
              </div>
            </div>

            {/* AÇÕES - ABAIXO DAS DUAS COLUNAS */}
            <div className="flex gap-2 pt-6 mt-6 border-t border-border">
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
