'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { CATEGORIAS } from '@/modules/inventory/types';

export function SearchBar({
  filtro,
  setFiltro,
  categoria,
  setCategoria,
}: {
  filtro: string;
  setFiltro: (s: string) => void;
  categoria: string; // "" = todas
  setCategoria: (s: string) => void;
}) {
  const selectValue = categoria === '' ? 'all' : categoria;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70" />
        <Input
          placeholder="Buscar por nome…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={selectValue} onValueChange={(v) => setCategoria(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="Todas as categorias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {CATEGORIAS.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
