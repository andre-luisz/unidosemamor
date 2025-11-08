'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRequireApprovedUser } from '@/hooks/useRequireApprovedUser';

import {
  userListMyDonationHeaders,
  type DonationHeader,
} from '@/modules/donations/api';

import {
  userListMyWithdrawals,
  getWithdrawalItems,
  type MyWithdrawalHeader,
  type WithdrawalItemRow,
} from '@/modules/withdrawals/api';

import {
  Filter,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Package,
  Loader2,
  UserRound,
} from 'lucide-react';

/* ============== Helpers ============== */
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { dateStyle: 'short' });

function StatusBadge({
  status,
}: {
  status: 'pending' | 'approved' | 'rejected';
}) {
  if (status === 'approved')
    return (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
        Aprovado
      </Badge>
    );
  if (status === 'rejected')
    return <Badge variant="destructive">Rejeitado</Badge>;
  return <Badge variant="secondary">Pendente</Badge>;
}

/* ============== Página ============== */
export default function HistoricoPage() {
  useRequireApprovedUser();

  // filtros / paginação compartilhados
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);

  const [tab, setTab] = useState<'doacoes' | 'pedidos'>('doacoes');

  useEffect(() => {
    setFrom(null);
    setTo(null);
  }, []);

  const activeFilters = useMemo(
    () => [from, to].filter(Boolean).length,
    [from, to]
  );

  return (
    <div className="min-h-dvh px-4 sm:px-8 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header modo={tab === 'doacoes' ? 'doar' : 'retirar'} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="doacoes">Doações</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          </TabsList>

          {/* ======= Filtros (iguais para as duas listas) ======= */}
          <Card className="mt-4 rounded-2xl border-blue-200 bg-white/90 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900">
                  <Filter className="h-4 w-4" />
                  <h2 className="font-semibold">
                    {tab === 'doacoes' ? 'Filtrar histórico de doações' : 'Filtrar histórico de pedidos'}
                  </h2>
                  {activeFilters > 0 && (
                    <Badge className="ml-1 bg-blue-600 text-white hover:bg-blue-700">
                      {activeFilters}
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex rounded-full"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="ml-2">Opções</span>
                </Button>
              </div>

              <div className="mt-3 grid sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">De</label>
                  <input
                    type="date"
                    className="w-full rounded-md bg-background border px-3 py-2"
                    value={from ?? ''}
                    onChange={(e) => setFrom(e.target.value || null)}
                    max={to ?? undefined}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Até</label>
                  <input
                    type="date"
                    className="w-full rounded-md bg-background border px-3 py-2"
                    value={to ?? ''}
                    onChange={(e) => setTo(e.target.value || null)}
                    min={from ?? undefined}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Itens por página</label>
                  <select
                    className="w-full rounded-md bg-background border px-2 py-2"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {[10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ======= Conteúdo por aba ======= */}
          <TabsContent value="doacoes" className="mt-4">
            <HistoricoDoacoes from={from} to={to} pageSize={pageSize} />
          </TabsContent>

          <TabsContent value="pedidos" className="mt-4">
            <HistoricoPedidos from={from} to={to} pageSize={pageSize} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ============== Doações ============== */
function HistoricoDoacoes({
  from,
  to,
  pageSize,
}: {
  from: string | null;
  to: string | null;
  pageSize: number;
}) {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<DonationHeader[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await userListMyDonationHeaders({
        from: from ?? undefined,
        to: to ?? undefined,
        limit: pageSize,
        offset: page * pageSize,
      });
      setHeaders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao carregar histórico de doações');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(0);
  }, [from, to, pageSize]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, from, to]);

  return (
    <>
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        )}

        {!loading && (headers?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma doação encontrada.
          </p>
        )}

        {(headers ?? []).map((h) => (
          <DonationCard key={h.header_id} header={h} />
        ))}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="rounded-full"
        >
          Anterior
        </Button>
        <div className="text-xs text-muted-foreground px-2">pág. {page + 1}</div>
        <Button
          variant="ghost"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || (headers?.length ?? 0) < pageSize}
          className="rounded-full"
        >
          Próxima
        </Button>
      </div>
    </>
  );
}

function DonationCard({ header }: { header: DonationHeader }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      className="rounded-2xl border bg-gradient-to-br from-white to-blue-50/40 ring-1 ring-blue-100/60 shadow-sm"
    >
      <button
        className="w-full text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`sec-${header.header_id}`}
      >
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 grid place-items-center ring-1 ring-blue-200">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {fmtDateTime(header.donated_at)}
                </span>
                <StatusBadge status={header.status} />
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                {(header.lines?.length ?? 0)} item(s)
              </div>
            </div>
          </div>

          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.section
            id={`sec-${header.header_id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Separator />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2">
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Unid</th>
                    <th>Categoria</th>
                    <th>Validade</th>
                  </tr>
                </thead>
                <tbody>
                  {(header.lines ?? []).map((r, idx) => (
                    <tr
                      key={`${header.header_id}-${r.item_id ?? 'noitem'}-${idx}`}
                      className="[&>td]:px-4 [&>td]:py-2 border-t"
                    >
                      <td className="font-medium">{r.item_nome}</td>
                      <td>{r.quantity}</td>
                      <td>{r.item_unidade ?? '—'}</td>
                      <td>{r.item_categoria ?? '—'}</td>
                      <td>{r.expires_at ? fmtDate(r.expires_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {header.note && (
              <>
                <Separator />
                <div className="p-3 text-xs text-muted-foreground">
                  Obs.: {header.note}
                </div>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ============== Pedidos ============== */
function HistoricoPedidos({
  from,
  to,
  pageSize,
}: {
  from: string | null;
  to: string | null;
  pageSize: number;
}) {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MyWithdrawalHeader[]>([]);
  const [itemsMap, setItemsMap] = useState<
    Record<string, WithdrawalItemRow[] | 'loading'>
  >({});

  async function load() {
    setLoading(true);
    try {
      const data = await userListMyWithdrawals({
        from: from ?? undefined,
        to: to ?? undefined,
        limit: pageSize,
        offset: page * pageSize,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao carregar histórico de pedidos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(0);
  }, [from, to, pageSize]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, from, to]);

  async function toggle(id: string) {
    const cur = itemsMap[id];
    if (cur === 'loading') return;
    if (cur) {
      const cp = { ...itemsMap };
      delete cp[id];
      setItemsMap(cp);
      return;
    }
    setItemsMap((m) => ({ ...m, [id]: 'loading' }));
    const items = await getWithdrawalItems(id);
    setItemsMap((m) => ({ ...m, [id]: items }));
  }

  return (
    <>
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum pedido encontrado.
          </p>
        )}

        {rows.map((r) => {
          const expanded = itemsMap[r.id];
          const open = !!expanded;
          return (
            <motion.div
              key={r.id}
              layout
              className="rounded-2xl border bg-gradient-to-br from-white to-blue-50/40 ring-1 ring-blue-100/60 shadow-sm"
            >
              <button
                className="w-full text-left"
                onClick={() => toggle(r.id)}
                aria-expanded={open}
                aria-controls={`wsec-${r.id}`}
              >
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 grid place-items-center ring-1 ring-blue-200">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {fmtDateTime(r.created_at)}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-blue-950">
                        <UserRound className="h-3.5 w-3.5 opacity-80" />
                        <span className="truncate">#{r.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: open ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-muted-foreground"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.section
                    id={`wsec-${r.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <Separator />
                    <div className="p-3">
                      {expanded === 'loading' ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Carregando itens…
                        </p>
                      ) : Array.isArray(expanded) && expanded.length > 0 ? (
                        <div className="space-y-2">
                          {expanded.map((row, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <p className="truncate">
                                  {row.item?.nome ?? 'Item'}{' '}
                                  {row.item?.unidade ? `· ${row.item.unidade}` : ''}
                                </p>
                              </div>
                              <p className="text-sm">{row.quantity}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sem itens.</p>
                      )}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="rounded-full"
        >
          Anterior
        </Button>
        <div className="text-xs text-muted-foreground px-2">pág. {page + 1}</div>
        <Button
          variant="ghost"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || rows.length < pageSize}
          className="rounded-full"
        >
          Próxima
        </Button>
      </div>
    </>
  );
}
