// src/app/admin/estoque/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Search, ArrowUpDown } from 'lucide-react';
import {
  fetchItems,
  subscribeItems,
  updateItem,
  type Item,
} from '@/modules/inventory/api';

export default function AdminEstoquePage() {
  useRequireAdmin();

  const [itens, setItens] = useState<Item[]>([]);
  const [qRaw, setQRaw] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<'nome' | 'quantidade' | 'prioridade'>('nome');
  const [savingId, setSavingId] = useState<string | null>(null);

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setQ(qRaw.trim()), 250);
    return () => clearTimeout(t);
  }, [qRaw]);

  // carregamento inicial + subscribe com cleanup síncrono
  useEffect(() => {
    let active = true;

    const load = async () => {
      const data = await fetchItems();
      if (active) setItens(data);
    };

    load().catch(console.error);

    const unsub = subscribeItems(load); // retorna () => Promise<...> ou () => void

    return () => {
      active = false;
      // Garante cleanup síncrono para o React: não retornar Promise aqui
      void unsub();
    };
  }, []);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    itens.forEach((i) => i.categoria && s.add(i.categoria));
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [itens]);

  const visiveis = useMemo(() => {
    const needle = q.toLowerCase();
    let arr = itens.filter((i) => {
      const matchNome = !needle || i.nome.toLowerCase().includes(needle);
      const matchCat = cat === 'all' || i.categoria === cat;
      return matchNome && matchCat;
    });

    arr = [...arr].sort((a, b) => {
      if (sort === 'nome')
        return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
      if (sort === 'quantidade') return (b.quantidade ?? 0) - (a.quantidade ?? 0);
      // prioridade: “alta” > “média” > “baixa”; empate por nome
      const ord = (p?: string | null) =>
        p === 'alta' ? 3 : p === 'media' ? 2 : p === 'baixa' ? 1 : 0;
      const d = ord(b.prioridade) - ord(a.prioridade);
      return d !== 0 ? d : a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    });

    return arr;
  }, [itens, q, cat, sort]);

  async function setQuantidade(id: string, delta: number) {
    const item = itens.find((x) => x.id === id);
    if (!item) return;
    const nova = Math.max(0, (item.quantidade ?? 0) + delta);
    setSavingId(id);
    try {
      await updateItem(id, { quantidade: nova } as any);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="min-h-dvh px-4 sm:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />

        <Card className="rounded-2xl border-blue-200 bg-white/90 backdrop-blur">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="text-blue-900 font-semibold">Gestão de estoque</div>

              <div className="flex flex-1 items-center gap-2 min-w-[260px] max-w-2xl">
                {/* Busca */}
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-md border bg-background"
                    placeholder="Buscar por nome…"
                    value={qRaw}
                    onChange={(e) => setQRaw(e.target.value)}
                  />
                </div>

                {/* Categoria */}
                <select
                  className="rounded-md border bg-background px-2 py-2"
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  aria-label="Filtrar por categoria"
                >
                  <option value="all">Todas as categorias</option>
                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Ordenação */}
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    setSort((s) =>
                      s === 'nome' ? 'quantidade' : s === 'quantidade' ? 'prioridade' : 'nome'
                    )
                  }
                  title="Alternar ordenação"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sort === 'nome' ? 'Nome' : sort === 'quantidade' ? 'Quantidade' : 'Prioridade'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Lista */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {visiveis.map((i) => {
                const low = (i.quantidade ?? 0) <= 3;
                return (
                  <div key={i.id} className="rounded-xl border p-3 bg-white/70">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{i.nome}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {i.categoria && <Badge variant="secondary">{i.categoria}</Badge>}
                          {i.prioridade && (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              {i.prioridade}
                            </Badge>
                          )}
                          {low && <Badge variant="destructive">baixo estoque</Badge>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQuantidade(i.id, -1)}
                          disabled={savingId === i.id || (i.quantidade ?? 0) <= 0}
                          className="rounded-full"
                        >
                          −
                        </Button>
                        <div className="w-[88px] text-center">
                          <div className="text-xs text-muted-foreground">Qtd</div>
                          <div className="font-semibold">
                            {i.quantidade ?? 0} {i.unidade}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setQuantidade(i.id, +1)}
                          disabled={savingId === i.id}
                          className="rounded-full"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {visiveis.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
