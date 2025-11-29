'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Label } from '@kit/ui/label';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Switch } from '@kit/ui/switch';
import { X, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export function MasterCrmFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    leadStatus: searchParams.get('leadStatus') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    hasWebsite: searchParams.get('hasWebsite') || '',
    ratingMin: searchParams.get('ratingMin') || '',
    reviewsMin: searchParams.get('reviewsMin') || '',
    semInteracaoDias: searchParams.get('semInteracaoDias') || '',
    followupVencido: searchParams.get('followupVencido') === 'true',
    isHotLead: searchParams.get('isHotLead') === 'true',
    // Novos filtros de pressão
    status: searchParams.get('status') || '',
    followup: searchParams.get('followup') || '',
    proposta: searchParams.get('proposta') || '',
  });

  function applyFilters() {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== false) {
        params.set(key, String(value));
      }
    });
    
    router.push(`/home/crm?${params.toString()}`);
  }

  function clearFilters() {
    setFilters({
      leadStatus: '',
      category: '',
      city: '',
      state: '',
      hasWebsite: '',
      ratingMin: '',
      reviewsMin: '',
      semInteracaoDias: '',
      followupVencido: false,
      isHotLead: false,
      status: '',
      followup: '',
      proposta: '',
    });
    router.push('/home/crm');
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== false);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filtros</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status do Lead */}
        <div className="space-y-2">
          <Label htmlFor="leadStatus">Status do Lead</Label>
          <Select
            value={filters.leadStatus || undefined}
            onValueChange={(value) => setFilters({ ...filters, leadStatus: value })}
          >
            <SelectTrigger id="leadStatus">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="contatado">Contatado</SelectItem>
              <SelectItem value="qualificado">Qualificado</SelectItem>
              <SelectItem value="proposta">Proposta</SelectItem>
              <SelectItem value="negociacao">Negociação</SelectItem>
              <SelectItem value="ganho">Ganho</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
              <SelectItem value="descartado">Descartado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            placeholder="Ex: Restaurante"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          />
        </div>

        {/* Cidade */}
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            placeholder="Ex: São Paulo"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="state">Estado (UF)</Label>
          <Input
            id="state"
            placeholder="Ex: SP"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value.toUpperCase() })}
            maxLength={2}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="hasWebsite">Website</Label>
          <Select
            value={filters.hasWebsite || undefined}
            onValueChange={(value) => setFilters({ ...filters, hasWebsite: value })}
          >
            <SelectTrigger id="hasWebsite">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Com site</SelectItem>
              <SelectItem value="false">Sem site</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Avaliação Mínima */}
        <div className="space-y-2">
          <Label htmlFor="ratingMin">Avaliação Mínima</Label>
          <Select
            value={filters.ratingMin || undefined}
            onValueChange={(value) => setFilters({ ...filters, ratingMin: value })}
          >
            <SelectTrigger id="ratingMin">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4.5">4.5+</SelectItem>
              <SelectItem value="4.0">4.0+</SelectItem>
              <SelectItem value="3.5">3.5+</SelectItem>
              <SelectItem value="3.0">3.0+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews Mínimas */}
        <div className="space-y-2">
          <Label htmlFor="reviewsMin">Reviews Mínimas</Label>
          <Input
            id="reviewsMin"
            type="number"
            placeholder="Ex: 50"
            value={filters.reviewsMin}
            onChange={(e) => setFilters({ ...filters, reviewsMin: e.target.value })}
          />
        </div>

        {/* Sem Interação (dias) */}
        <div className="space-y-2">
          <Label htmlFor="semInteracaoDias">Sem Interação há (dias)</Label>
          <Input
            id="semInteracaoDias"
            type="number"
            placeholder="Ex: 30"
            value={filters.semInteracaoDias}
            onChange={(e) => setFilters({ ...filters, semInteracaoDias: e.target.value })}
          />
        </div>

        {/* Switches */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="followupVencido" className="cursor-pointer">
              Follow-up Vencido
            </Label>
            <Switch
              id="followupVencido"
              checked={filters.followupVencido}
              onCheckedChange={(checked) => 
                setFilters({ ...filters, followupVencido: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isHotLead" className="cursor-pointer">
              Hot Leads
            </Label>
            <Switch
              id="isHotLead"
              checked={filters.isHotLead}
              onCheckedChange={(checked) => 
                setFilters({ ...filters, isHotLead: checked })
              }
            />
          </div>
        </div>

        {/* Botão Aplicar */}
        <Button 
          className="w-full" 
          onClick={applyFilters}
        >
          Aplicar Filtros
        </Button>
      </CardContent>
    </Card>
  );
}
