'use client';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Checkbox } from '@kit/ui/checkbox';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
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

const columns: ColumnDef<Place>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <Button
          {...{
            className: 'size-7 shadow-none text-muted-foreground',
            onClick: row.getToggleExpandedHandler(),
            'aria-expanded': row.getIsExpanded(),
            'aria-label': row.getIsExpanded()
              ? `Recolher detalhes de ${row.original.name}`
              : `Expandir detalhes de ${row.original.name}`,
            size: 'icon',
            variant: 'ghost',
          }}
        >
          {row.getIsExpanded() ? (
            <ChevronUp
              className="opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className="opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
          )}
        </Button>
      ) : undefined;
    },
  },
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
  },
  {
    header: 'Empresa',
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className="min-w-[200px]">
        <div className="font-semibold">{row.getValue('name')}</div>
        {row.original.categories && row.original.categories.length > 0 && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {row.original.categories.slice(0, 2).join(' • ')}
          </div>
        )}
      </div>
    ),
  },
  {
    header: 'Localização',
    accessorKey: 'address',
    cell: ({ row }) => {
      const address = row.getValue('address') as string | undefined;
      if (!address) return <span className="text-muted-foreground text-sm">-</span>;
      
      return (
        <div className="flex items-start gap-2 min-w-[200px]">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
          <span className="text-sm line-clamp-2">{address}</span>
        </div>
      );
    },
  },
  {
    header: 'Avaliação',
    accessorKey: 'rating',
    cell: ({ row }) => {
      const rating = row.getValue('rating') as number | undefined;
      const reviews = row.original.reviews_count;

      if (!rating) {
        return <span className="text-muted-foreground text-sm">Sem avaliações</span>;
      }

      return (
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="font-medium text-sm">{rating.toFixed(1)}</span>
          {reviews && (
            <span className="text-xs text-muted-foreground">({reviews})</span>
          )}
        </div>
      );
    },
  },
  {
    header: 'Status',
    accessorKey: 'opening_hours',
    cell: ({ row }) => {
      const hasWebsite = !!row.original.website;
      const hasPhone = !!row.original.phone;

      // Determinar status baseado nos dados disponíveis
      let status: 'verified' | 'partial' | 'basic' = 'basic';
      if (hasWebsite && hasPhone) status = 'verified';
      else if (hasWebsite || hasPhone) status = 'partial';

      return (
        <Badge
          variant={
            status === 'verified'
              ? 'success'
              : status === 'partial'
                ? 'warning'
                : 'secondary'
          }
          className="whitespace-nowrap"
        >
          {status === 'verified'
            ? 'Verificado'
            : status === 'partial'
              ? 'Parcial'
              : 'Básico'}
        </Badge>
      );
    },
  },
  {
    header: () => <div className="text-right">Ações</div>,
    id: 'actions',
    cell: ({ row }) => {
      const place = row.original;

      return (
        <div className="flex items-center justify-end gap-2">
          {place.website && place.website.trim() !== '' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                title="Visitar website"
              >
                <Globe className="h-4 w-4" />
              </a>
            </Button>
          )}
          {place.phone && place.phone.trim() !== '' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={`tel:${place.phone}`} title={place.phone}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
          {place.link && place.link.trim() !== '' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
      );
    },
  },
];

export function ResultsTable({ results, onNewSearch }: ResultsTableProps) {
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: results,
    columns,
    getRowCanExpand: (row) =>
      Boolean(
        row.original.address ||
          row.original.phone ||
          row.original.website ||
          row.original.opening_hours,
      ),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 className="text-lg font-semibold">Resultados da busca</h2>
            <p className="text-sm text-muted-foreground">
              {results.length} empresas encontradas
              {selectedCount > 0 && ` • ${selectedCount} selecionadas`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <Button variant="outline" size="sm">
                Exportar ({selectedCount})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onNewSearch}>
              Nova busca
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="h-12">
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
                    <Fragment key={row.id}>
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="[&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0 [&:has([aria-expanded])]:pr-0"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      {row.getIsExpanded() && (
                        <TableRow className="bg-muted/30 hover:bg-muted/40">
                          <TableCell
                            colSpan={row.getVisibleCells().length}
                            className="py-4"
                          >
                            <div className="grid grid-cols-2 gap-4 text-sm max-w-3xl">
                              {row.original.address && (
                                <div>
                                  <div className="font-medium text-muted-foreground mb-1">
                                    Endereço completo
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>{row.original.address}</span>
                                  </div>
                                </div>
                              )}

                              {row.original.phone && (
                                <div>
                                  <div className="font-medium text-muted-foreground mb-1">
                                    Telefone
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <a
                                      href={`tel:${row.original.phone}`}
                                      className="hover:underline"
                                    >
                                      {row.original.phone}
                                    </a>
                                  </div>
                                </div>
                              )}

                              {row.original.website && row.original.website.trim() !== '' && (
                                <div>
                                  <div className="font-medium text-muted-foreground mb-1">
                                    Website
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <a
                                      href={row.original.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline truncate"
                                    >
                                      {row.original.website
                                        .replace(/^https?:\/\//, '')
                                        .replace(/\/$/, '')}
                                    </a>
                                  </div>
                                </div>
                              )}

                              {row.original.opening_hours && (
                                <div>
                                  <div className="font-medium text-muted-foreground mb-1">
                                    Horário
                                  </div>
                                  <div>{row.original.opening_hours}</div>
                                </div>
                              )}

                              {row.original.link && row.original.link.trim() !== '' && (
                                <div className="col-span-2">
                                  <a
                                    href={row.original.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Ver localização no Google Maps
                                  </a>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
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
      </div>
    </div>
  );
}
