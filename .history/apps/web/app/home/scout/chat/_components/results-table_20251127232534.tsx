'use client';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Checkbox } from '@kit/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
} from '@kit/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
  Phone,
  Star,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  ExternalLink,
} from 'lucide-react';
import { useMemo } from 'react';

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
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

interface ResultsTableProps {
  results: Place[];
  onNewSearch: () => void;
}

export function ResultsTable({ results, onNewSearch }: ResultsTableProps) {
  const columns = useMemo<ColumnDef<Place>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          return row.getCanExpand() ? (
            <button
              {...{
                onClick: row.getToggleExpandedHandler(),
                style: { cursor: 'pointer' },
              }}
              className="flex items-center"
            >
              {row.getIsExpanded() ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          ) : null;
        },
        size: 40,
      },
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Selecionar todos"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Selecionar linha"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: 'name',
        header: 'Empresa',
        cell: ({ row }) => {
          const place = row.original;
          const description = place.about || 
            (place.categories && place.categories.length > 0 
              ? place.categories.join(' • ') 
              : 'Estabelecimento local');
          
          // Extrair WhatsApp do telefone
          const whatsapp = place.phone ? place.phone.replace(/\D/g, '') : null;
          
          // Detectar redes sociais (simulado - será extraído do scraper)
          const hasInstagram = place.about?.toLowerCase().includes('instagram');
          const hasFacebook = place.about?.toLowerCase().includes('facebook');
          const hasYoutube = place.about?.toLowerCase().includes('youtube');
          const hasTiktok = place.about?.toLowerCase().includes('tiktok');

          return (
            <div className="py-2">
              {/* Nome do estabelecimento */}
              <div className="font-semibold text-base mb-1">
                {place.name}
              </div>
              
              {/* Descrição */}
              <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {description}
              </div>

              {/* Ícones de contato e redes sociais */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Telefone */}
                {place.phone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title={`Telefone: ${place.phone}`}
                  >
                    <a href={`tel:${place.phone}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {/* WhatsApp */}
                {whatsapp && whatsapp.length >= 10 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    asChild
                    title="WhatsApp"
                  >
                    <a
                      href={`https://wa.me/55${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {/* Email */}
                {place.email && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title={`Email: ${place.email}`}
                  >
                    <a href={`mailto:${place.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {/* Website */}
                {place.website && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title="Website"
                  >
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {/* Comentários */}
                {place.top_reviews && place.top_reviews.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1"
                    title={`${place.top_reviews.length} comentários`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{place.top_reviews.length}</span>
                  </Button>
                )}

                <div className="w-px h-5 bg-border mx-0.5" />

                {/* Instagram */}
                {hasInstagram && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title="Instagram"
                  >
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {/* Facebook */}
                {hasFacebook && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title="Facebook"
                  >
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {/* YouTube */}
                {hasYoutube && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title="YouTube"
                  >
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {/* TikTok */}
                {hasTiktok && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title="TikTok"
                  >
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </a>
                  </Button>
                )}

                {/* Google Business (Maps) */}
                {place.link && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title="Ver no Google Maps"
                  >
                    <a
                      href={place.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'rating',
        header: 'Avaliação',
        cell: ({ row }) => {
          const rating = row.original.rating;
          const reviewsCount = row.original.reviews_count;

          if (!rating) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
              </Badge>
              {reviewsCount && (
                <span className="text-xs text-muted-foreground">
                  ({reviewsCount})
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: results,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => row.place_id || row.name,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Resultados da busca</h2>
            <p className="text-sm text-muted-foreground">
              {results.length} empresas encontradas
              {table.getSelectedRowModel().rows.length > 0 &&
                ` • ${table.getSelectedRowModel().rows.length} selecionadas`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {table.getSelectedRowModel().rows.length > 0 && (
              <Button variant="outline" size="sm">
                Exportar ({table.getSelectedRowModel().rows.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onNewSearch}>
              Nova busca
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Collapsible key={row.id} asChild>
                  <>
                    <TableRow data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={columns.length}>
                          <div className="p-4 bg-muted/30 rounded-md grid gap-3 text-sm">
                            {row.original.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <a
                                  href={row.original.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {row.original.website}
                                </a>
                              </div>
                            )}
                            {row.original.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{row.original.phone}</span>
                              </div>
                            )}
                            {row.original.opening_hours && (
                              <div>
                                <div className="font-medium mb-1">
                                  Horário de Funcionamento
                                </div>
                                <div className="text-muted-foreground">
                                  {row.original.opening_hours}
                                </div>
                              </div>
                            )}
                            {row.original.link && (
                              <div>
                                <a
                                  href={row.original.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  <MapPin className="h-4 w-4" />
                                  Ver no Google Maps
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
