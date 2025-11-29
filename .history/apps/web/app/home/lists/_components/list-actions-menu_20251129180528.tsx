'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Download, Copy, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@kit/ui/dropdown-menu';

/**
 * FASE P3: Ações de Lista como Produto
 * 
 * - Exportar lista para CSV
 * - Duplicar lista
 * - Tornar pública/privada
 */
interface ListActionsMenuProps {
  listId: string;
  listName: string;
  isPublic: boolean;
  onTogglePublic: () => void;
  onDuplicate: () => void;
}

export function ListActionsMenu({ 
  listId, 
  listName, 
  isPublic,
  onTogglePublic,
  onDuplicate,
}: ListActionsMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Exportar usando API com filtro de lista
      const response = await fetch(`/api/companies/export-csv?listId=${listId}`);

      if (!response.ok) {
        throw new Error('Erro ao exportar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${listName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Exportação concluída!', {
        description: `Lista "${listName}" exportada com sucesso.`,
      });

      // Registrar telemetria
      await fetch('/api/telemetry/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'lista_exportada',
          list_id: listId,
        }),
      });

    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar lista');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Ações
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar CSV'}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar Lista
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onTogglePublic}>
          {isPublic ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Tornar Privada
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Tornar Pública
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
