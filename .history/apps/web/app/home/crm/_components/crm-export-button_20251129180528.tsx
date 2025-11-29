'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@kit/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

/**
 * FASE P4: Botão de Exportação CSV
 * 
 * Exporta empresas do CRM respeitando filtros ativos
 */
export function CrmExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const searchParams = useSearchParams();

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Construir query params com filtros ativos
      const params = new URLSearchParams();
      
      const leadStatus = searchParams.get('leadStatus');
      const category = searchParams.get('category');
      const city = searchParams.get('city');
      const listId = searchParams.get('listId');

      if (leadStatus) params.append('leadStatus', leadStatus);
      if (category) params.append('category', category);
      if (city) params.append('city', city);
      if (listId) params.append('listId', listId);

      // Fazer download
      const response = await fetch(`/api/companies/export-csv?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao exportar');
      }

      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spec64_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Exportação concluída!', {
        description: 'Seu arquivo CSV foi baixado com sucesso.',
      });

    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar', {
        description: 'Não foi possível exportar os dados.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? 'Exportando...' : 'Exportar CSV'}
    </Button>
  );
}
