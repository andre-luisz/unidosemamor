'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
//import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRequireApprovedUser } from '@/hooks/useRequireApprovedUser';
import { supabase } from '@/lib/supabase';
import { donateItemsBulk, type DonationLine } from '@/modules/donations/api';
import { getSignedImageUrl } from '@/modules/inventory/api';
import { ImageOff } from 'lucide-react';

/* ===========================
   Tipos locais
=========================== */
type Item = {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: string | null;
  image_url?: string | null;
  quantidade?: number | null;
};

type CartLine = DonationLine & {
  item_nome: string;
  item_categoria: string | null;
  item_unidade: string | null;
};

export default function DoarPage() {
  useRequireApprovedUser();

  // catálogo
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [qRaw, setQRaw] = useState('');
  const [q, setQ] = useState(''); // debounced

  // observação
  const [note, setNote] = useState<string>('');

  // “sacola”
  const [cart, setCart] = useState<CartLine[]>([]);
  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + (l.quantity || 0), 0),
    [cart]
  );

  // thumbs (sacola + catálogo)
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const [catalogThumbs, setCatalogThumbs] = useState<Record<string, string | null>>({});

  // toast minimalista
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'error' } | null>(null);
  function showToast(message: string, type: 'info' | 'success' | 'error' = 'info', ms = 2000) {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), ms);
  }

  /* Debounce da busca */
  useEffect(() => {
    const t = setTimeout(() => setQ(qRaw.trim()), 250);
    return () => clearTimeout(t);
  }, [qRaw]);

  /* Carrega itens cadastrados */
  async function loadItems() {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, nome, categoria, unidade, image_url, quantidade')
        .order('nome', { ascending: true });
      if (error) throw error;
      setItems((data ?? []) as Item[]);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message ?? 'Falha ao listar itens', 'error');
    } finally {
      setLoadingItems(false);
    }
  }
  useEffect(() => {
    loadItems();
  }, []);

  /* Signed URLs da sacola */
  useEffect(() => {
    let alive = true;
    (async () => {
      const map: Record<string, string | null> = {};
      for (const line of cart) {
        const it = items.find((i) => i.id === line.item_id);
        if (it?.image_url) {
          try {
            map[it.id] = await getSignedImageUrl(it.image_url, 3600);
          } catch {
            map[it.id] = null;
          }
        } else {
          map[line.item_id] = null;
        }
      }
      if (alive) setThumbs(map);
    })();
    return () => {
      alive = false;
    };
  }, [cart, items]);

  /* Signed URLs do catálogo (pré-carrega) */
  useEffect(() => {
    let alive = true;
    (async () => {
      const map: Record<string, string | null> = {};
      for (const it of items) {
        if (it.image_url) {
          try {
            map[it.id] = await getSignedImageUrl(it.image_url, 3600);
          } catch {
            map[it.id] = null;
          }
        } else {
          map[it.id] = null;
        }
      }
      if (alive) setCatalogThumbs(map);
    })();
    return () => {
      alive = false;
    };
  }, [items]);

  /* Sacola */
  function addToCart(item: Item) {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.item_id === item.id);
      if (i >= 0) {
        const clone = [...prev];
        clone[i] = { ...clone[i], quantity: clone[i].quantity + 1 };
        return clone;
      }
      showToast(`"${item.nome}" adicionado à sacola`, 'success');
      return [
        ...prev,
        {
          item_id: item.id,
          quantity: 1,
          expires_at: null,
          item_nome: item.nome,
          item_categoria: item.categoria,
          item_unidade: item.unidade,
        },
      ];
    });
  }
  function changeQty(item_id: string, delta: number) {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.item_id === item_id);
      if (i < 0) return prev;
      const next = Math.max(0, (prev[i].quantity ?? 0) + delta);
      const clone = [...prev];
      if (next === 0) {
        const removed = prev[i];
        clone.splice(i, 1);
        showToast(`"${removed.item_nome}" removido da sacola`, 'info');
      } else {
        clone[i] = { ...clone[i], quantity: next };
      }
      return clone;
    });
  }
  function changeExpiry(item_id: string, value: string) {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.item_id === item_id);
      if (i < 0) return prev;
      const clone = [...prev];
      clone[i] = { ...clone[i], expires_at: value || null };
      return clone;
    });
  }
  function removeLine(item_id: string) {
    setCart((prev) => {
      const removed = prev.find((l) => l.item_id === item_id);
      showToast(`"${removed?.item_nome ?? 'Item'}" removido da sacola`, 'info');
      return prev.filter((l) => l.item_id !== item_id);
    });
  }
  function clearCart() {
    setCart([]);
    setNote('');
    showToast('Sacola limpa', 'info');
  }

  /* Registrar doação */
  async function handleRegistrarDoacao() {
    try {
      if (cart.length === 0) {
        showToast('Adicione ao menos um item.', 'error');
        return;
      }
      const payload: DonationLine[] = cart.map((l) => ({
        item_id: l.item_id,
        quantity: l.quantity,
        expires_at: l.expires_at ?? null,
      }));
      await donateItemsBulk(payload, note || undefined);

      // ✅ mensagem especial e acolhedora
      showToast(
        '💙 Obrigado por sua doação! Deus te abençoe. Sua doação foi enviada para análise. Fale com o responsável ou leve os itens até o ponto de coleta.',
        'success',
        5500
      );

      clearCart();
    } catch (e: any) {
      console.error(e);
      showToast(e?.message ?? 'Falha ao registrar doação', 'error');
    }
  }

  /* Filtro simples do catálogo */
  const filtered = useMemo(() => {
    if (!q) return items;
    const t = q.toLowerCase();
    return items.filter(
      (it) =>
        it.nome.toLowerCase().includes(t) ||
        (it.categoria ?? '').toLowerCase().includes(t) ||
        (it.unidade ?? '').toLowerCase().includes(t)
    );
  }, [items, q]);

  /* ===== helpers UI ===== */
  const hasCart = cart.length > 0;

  return (
    <div className="min-h-dvh px-4 sm:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header modo="doar" cartCount={cartCount} />

        {/* ===== Sacola ===== */}
        <Card className="rounded-2xl border-blue-200 bg-white/90 backdrop-blur shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-blue-900">
                Itens na doação
                {hasCart ? (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    • {cartCount} {cartCount === 1 ? 'unidade' : 'unidades'}
                  </span>
                ) : null}
              </h2>
              {hasCart && (
                <Button variant="ghost" onClick={clearCart} className="rounded-full">
                  Limpar
                </Button>
              )}
            </div>

            {/* vazio */}
            {!hasCart && (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground bg-blue-50/30">
                Sua sacola de doação está vazia. Use o catálogo abaixo para adicionar itens.
              </div>
            )}

            {/* mobile: cards */}
            {hasCart && (
              <div className="md:hidden space-y-3">
                <AnimatePresence initial={false}>
                  {cart.map((l) => {
                    const it = items.find((i) => i.id === l.item_id);
                    const thumb = it ? thumbs[it.id] : null;
                    return (
                      <motion.div
                        key={l.item_id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="rounded-xl border p-3 shadow-sm bg-white ring-1 ring-blue-100/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={l.item_nome}
                                  className="h-full w-full object-cover"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                                />
                              ) : (
                                <div className="h-full w-full grid place-items-center text-gray-400">
                                  <ImageOff className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{l.item_nome}</p>
                              <p className="text-xs text-muted-foreground">
                                Estoque: {it?.quantidade ?? 0} {it?.unidade ?? ''}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeLine(l.item_id)}
                            className="rounded-full"
                            aria-label={`Remover ${l.item_nome}`}
                          >
                            Remover
                          </Button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => changeQty(l.item_id, -1)}
                              className="rounded-full"
                              aria-label={`Diminuir ${l.item_nome}`}
                            >
                              –
                            </Button>
                            <span className="w-8 text-center">{l.quantity}</span>
                            <Button
                              size="icon"
                              onClick={() => changeQty(l.item_id, +1)}
                              className="rounded-full"
                              aria-label={`Aumentar ${l.item_nome}`}
                            >
                              +
                            </Button>
                          </div>

                          <input
                            type="date"
                            className="w-40 rounded-md bg-background border px-2 py-1"
                            value={l.expires_at ?? ''}
                            onChange={(e) => changeExpiry(l.item_id, e.target.value)}
                            aria-label={`Validade de ${l.item_nome}`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* desktop: tabela */}
            {hasCart && (
              <div className="hidden md:block overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground bg-blue-50/50">
                    <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2">
                      <th>Produto</th>
                      <th style={{ width: 160 }}>Qtd</th>
                      <th>Unid</th>
                      <th>Categoria</th>
                      <th style={{ width: 180 }}>Validade</th>
                      <th style={{ width: 120 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((l) => {
                      const it = items.find((i) => i.id === l.item_id);
                      const thumb = it ? thumbs[it.id] : null;
                      return (
                        <tr key={l.item_id} className="[&>td]:px-4 [&>td]:py-3 border-t">
                          <td className="font-medium">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt={l.item_nome}
                                    className="h-full w-full object-cover"
                                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                                  />
                                ) : (
                                  <div className="h-full w-full grid place-items-center text-gray-400">
                                    <ImageOff className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate">{l.item_nome}</div>
                                <div className="text-[11px] text-muted-foreground">
                                  Estoque: {it?.quantidade ?? 0} {it?.unidade ?? ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => changeQty(l.item_id, -1)}
                                className="rounded-full"
                                aria-label={`Diminuir ${l.item_nome}`}
                              >
                                –
                              </Button>
                              <span className="w-8 text-center">{l.quantity}</span>
                              <Button
                                size="icon"
                                onClick={() => changeQty(l.item_id, +1)}
                                className="rounded-full"
                                aria-label={`Aumentar ${l.item_nome}`}
                              >
                                +
                              </Button>
                            </div>
                          </td>
                          <td>{l.item_unidade ?? '—'}</td>
                          <td>{l.item_categoria ?? '—'}</td>
                          <td>
                            <input
                              type="date"
                              className="w-full rounded-md bg-background border px-2 py-1"
                              value={l.expires_at ?? ''}
                              onChange={(e) => changeExpiry(l.item_id, e.target.value)}
                              aria-label={`Validade de ${l.item_nome}`}
                            />
                          </td>
                          <td className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeLine(l.item_id)}
                              className="rounded-full"
                              aria-label={`Remover ${l.item_nome}`}
                            >
                              Remover
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Observação + CTA */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">Observação da doação (opcional)</label>
                <input
                  className="w-full rounded-md bg-background border px-3 py-2"
                  placeholder="Ex.: doação da campanha de natal"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="hidden sm:flex justify-end">
              <Button onClick={handleRegistrarDoacao} disabled={!hasCart} className="rounded-full">
                Registrar doação
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===== Catálogo ===== */}
        <Card className="rounded-2xl border-blue-200 bg-white/90 backdrop-blur shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-blue-900">Escolha os itens cadastrados</h2>
              <input
                placeholder="Buscar por nome, categoria ou unidade…"
                value={qRaw}
                onChange={(e) => setQRaw(e.target.value)}
                className="w-full max-w-sm rounded-md bg-background border px-3 py-2"
                aria-label="Buscar itens"
              />
            </div>

            <Separator />

            {loadingItems ? (
              /* Skeleton grid */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border p-3 bg-white ring-1 ring-blue-100/40">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-slate-100 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                      </div>
                      <div className="h-8 w-20 rounded-full bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground bg-blue-50/30">
                Nenhum item encontrado. Tente outro termo.
              </div>
            ) : (
              <motion.div
                layout
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <AnimatePresence initial={false}>
                  {filtered.map((it) => {
                    const thumb = catalogThumbs[it.id] ?? null;
                    return (
                      <motion.div
                        key={it.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-xl border p-3 shadow-sm bg-white ring-1 ring-blue-100/40 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={it.nome}
                                  className="h-full w-full object-cover"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                                />
                              ) : (
                                <div className="h-full w-full grid place-items-center text-gray-400">
                                  <ImageOff className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{it.nome}</div>
                              <div className="text-xs text-muted-foreground">
                                {it.categoria ?? '—'} · {it.unidade ?? '—'}
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => addToCart(it)}
                            className="rounded-full"
                            aria-label={`Adicionar ${it.nome}`}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA fixo no mobile */}
      <AnimatePresence>
        {hasCart && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="sm:hidden fixed bottom-4 left-0 right-0 px-4 z-40"
          >
            <div className="mx-auto max-w-7xl">
              <div className="rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-between px-4 py-2">
                <span className="text-sm">
                  {cartCount} {cartCount === 1 ? 'unidade' : 'unidades'} na doação
                </span>
                <Button
                  size="sm"
                  onClick={handleRegistrarDoacao}
                  disabled={!hasCart}
                  className="rounded-full bg-white text-blue-700 hover:bg-white/90"
                >
                  Registrar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 right-4 z-[60]"
          >
            <div
              className={[
                'px-4 py-2 rounded-md shadow-lg text-white text-sm max-w-sm',
                toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600',
              ].join(' ')}
            >
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
