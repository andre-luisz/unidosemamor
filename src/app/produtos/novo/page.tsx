// src/app/produtos/novo/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { ProductForm, type FormValues } from '@/modules/inventory/components/ProductForm';
import {
  fetchItems,
  subscribeItems,
  updateItem,
  createItem,
  type Item,
} from '@/modules/inventory/api';
import { getSignedUrlFromPath, uploadProductImage } from '@/modules/storage/uploadProductImage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';

type Editing = { id: string; nome: string; file?: File | null } | null;

export default function CadastrarProdutoPage() {
  const [itens, setItens] = useState<Item[]>([]);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const [signedMap, setSignedMap] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string } | null>(null);

  // --- busca e filtros (locais) ---
  const [qRaw, setQRaw] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setQ(qRaw.trim()), 250);
    return () => clearTimeout(t);
  }, [qRaw]);

  function showToast(message: string, ms = 2500) {
    setToast({ message });
    window.setTimeout(() => setToast(null), ms);
  }

  // checa sessão
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthorized(!!data.session);
      if (!data.session) window.location.href = '/login';
    });
  }, []);

  // carrega itens + realtime (cleanup sempre síncrono)
  useEffect(() => {
    if (!authorized) return;

    let mounted = true;

    const load = async () => {
      const list = await fetchItems();
      if (mounted) setItens(list);
    };

    load().catch(console.error);

    const stop = subscribeItems(() => {
      load().catch(console.error);
    });

    return () => {
      mounted = false;
      if (typeof stop === 'function') {
        const maybe = stop();
        // se retornar Promise, ignoramos para manter o cleanup síncrono
        if (maybe && typeof (maybe as any).then === 'function') {
          void maybe;
        }
      }
    };
  }, [authorized]);

  // gera signed URLs das imagens
  useEffect(() => {
    let alive = true;
    (async () => {
      const entries: [string, string][] = [];
      for (const i of itens) {
        if (i.image_url) {
          try {
            const url = await getSignedUrlFromPath(i.image_url);
            if (!alive) return;
            entries.push([i.id, url]);
          } catch {
            // ignora erro individual de imagem
          }
        }
      }
    if (alive) setSignedMap(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [itens]);

  // categorias únicas para o filtro
  const categorias = useMemo(() => {
    const set = new Set<string>();
    itens.forEach((i) => i.categoria && set.add(i.categoria));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [itens]);

  const itensOrdenados = useMemo(
    () => [...itens].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })),
    [itens]
  );

  // aplica busca + filtro de categoria
  const visiveis = useMemo(() => {
    const needle = q.toLocaleLowerCase();
    return itensOrdenados.filter((i) => {
      const matchNome = !needle || i.nome.toLocaleLowerCase().includes(needle);
      const matchCat = cat === 'all' || i.categoria === cat;
      return matchNome && matchCat;
    });
  }, [itensOrdenados, q, cat]);

  async function handleSubmit(data: FormValues) {
    try {
      await createItem({
        nome: data.nome,
        categoria: data.categoria,
        unidade: data.unidade,
        prioridade: data.prioridade,
        imageFile: (data as any).imageFile?.[0] ?? undefined,
      });
      showToast('Produto cadastrado com sucesso!');
      // lista será atualizada pelo subscribeItems
    } catch (e: any) {
      alert(e?.message || 'Erro ao cadastrar');
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      let path: string | undefined;
      if (editing.file) {
        const up = await uploadProductImage(editing.file, editing.id);
        path = up.path;
      }
      await updateItem(editing.id, { nome: editing.nome, ...(path ? { image_url: path } : {}) });
      setEditing(null);
      showToast('Item atualizado!');
    } catch (e: any) {
      alert(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (authorized === null) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Carregando...</div>;
  }

  return (
    <div className="min-h-dvh bg-[#e6f0ff]">
      <Header modo="retirar" />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* Card de cadastro */}
        <section className="rounded-2xl border border-blue-200 bg-white/90 backdrop-blur p-6 shadow-md">
          <h2 className="font-semibold text-xl text-blue-800 mb-4">Cadastrar produto</h2>
          <ProductForm onSubmit={handleSubmit} />
        </section>

        {/* Filtros do estoque */}
        <section className="rounded-2xl border border-blue-200 bg-white/90 backdrop-blur p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-blue-900">
              <Filter className="h-4 w-4" />
              <h3 className="font-medium">Estoque atual</h3>
              <span className="text-xs text-muted-foreground">({visiveis.length})</span>
            </div>

            <div className="flex flex-1 min-w-[240px] max-w-xl items-center gap-2">
              {/* Busca */}
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full pl-9 pr-8 py-2 rounded-md border bg-background"
                  placeholder="Buscar por nome…"
                  value={qRaw}
                  onChange={(e) => setQRaw(e.target.value)}
                />
                {qRaw && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                    onClick={() => setQRaw('')}
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Categoria */}
              <select
                className="min-w-[160px] rounded-md border bg-background px-2 py-2"
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
            </div>
          </div>
        </section>

        {/* Grade de produtos (com filtros aplicados) */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {visiveis.map((i) => (
              <Card
                key={i.id}
                className="rounded-2xl overflow-hidden bg-white shadow hover:shadow-lg transition"
              >
                <CardContent className="p-0">
                  {i.image_url && signedMap[i.id] ? (
                    <div className="aspect-square w-full overflow-hidden bg-gray-100">
                      <img
                        src={signedMap[i.id]}
                        alt={i.nome}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center text-sm text-gray-400 bg-gray-100">
                      Sem imagem
                    </div>
                  )}

                  <div className="p-3 sm:p-4">
                    <p className="font-medium text-gray-800 truncate">{i.nome}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {i.categoria}
                      </Badge>
                      {i.prioridade && (
                        <Badge className="bg-yellow-100 text-yellow-700">{i.prioridade}</Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">Qtd</span>
                      <span className="font-semibold text-gray-700">
                        {i.quantidade} {i.unidade}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full border border-blue-100 text-blue-700 hover:bg-blue-50"
                      onClick={() => setEditing({ id: i.id, nome: i.nome })}
                    >
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visiveis.length === 0 && (
            <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground mt-4 bg-white/70">
              Nenhum item encontrado com os filtros atuais.
            </div>
          )}
        </section>
      </main>

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800">Editar item</h3>
            <div>
              <label className="text-xs text-gray-500">Nome</label>
              <input
                className="w-full border rounded-md px-3 py-2 mt-1"
                value={editing.nome}
                onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Imagem (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditing({ ...editing, file: e.target.files?.[0] ?? null })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast simples local */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[60]">
          <div className="rounded-md bg-blue-600 text-white px-4 py-2 shadow-lg">
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
