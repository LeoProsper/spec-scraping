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
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.categories && row.original.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {row.original.categories.slice(0, 2).map((cat, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Localização',
        cell: ({ row }) => (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <span className="text-sm">{row.original.address || '-'}</span>
          </div>
        ),
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
      {
        accessorKey: 'status',
        header: 'Status',
        cell: () => (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Novo
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: () => (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              Visualizar
            </Button>
            <Button variant="ghost" size="sm">
              Analisar
            </Button>
            <Button variant="ghost" size="sm">
              Proposta
            </Button>
          </div>
        ),
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
