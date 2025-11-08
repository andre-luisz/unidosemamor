// src/app/admin/pedidos/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { notify } from '@/components/feedback/notify';
import { useConfirm, usePrompt } from '@/components/dialogs/ConfirmProvider';
import {
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalItems,
  type AdminWithdrawal,
  type WithdrawalItemRow,
} from '@/modules/withdrawals/adminApi';
import {
  Filter, ChevronDown, ChevronRight, Package,
  CalendarClock, Loader2, UserRound,
} from 'lucide-react';

function StatusPill({ s }: { s: AdminWithdrawal['status'] }) {
  if (s === 'approved') return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">aprovado</Badge>;
  if (s === 'rejected') return <Badge variant="destructive">rejeitado</Badge>;
  return <Badge variant="secondary">pendente</Badge>;
}

export default function AdminPedidosPage() {
  useRequireAdmin();

  // providers
  const confirm = useConfirm();
  const prompt = usePrompt();

  // ------ filtros ------
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [qRaw, setQRaw] = useState('');
  const [q, setQ] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminWithdrawal[]>([]);
  const [expanding, setExpanding] = useState<Record<string, WithdrawalItemRow[] | 'loading'>>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(qRaw.trim()), 300);
    return () => clearTimeout(t);
  }, [qRaw]);

  const activeFilters = useMemo(
    () => [from, to, status, q].filter(Boolean).length,
    [from, to, status, q]
  );

  async function reload() {
    setLoading(true);
    try {
      const data = await listWithdrawals({
        from: from || undefined,
        to: to || undefined,
        status: status ?? undefined,
        q: q || undefined,
        limit: pageSize,
        offset: page * pageSize,
      });
      setRows(data ?? []);
    } catch (e: any) {
      notify.error(e?.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status, from, to, q]);

  async function toggleItems(id: string) {
    if (expanding[id] === 'loading') return;
    if (expanding[id]) {
      setExpanding((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
      return;
    }
    setExpanding((m) => ({ ...m, [id]: 'loading' }));
    try {
      const data = await getWithdrawalItems(id);
      setExpanding((m) => ({ ...m, [id]: data }));
    } catch (e: any) {
      notify.error(e?.message || 'Erro ao carregar itens do pedido');
      setExpanding((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    }
  }

  async function doApprove(id: string) {
    const ok = await confirm({
      title: 'Aprovar pedido?',
      description: 'O estoque será debitado e este pedido será marcado como aprovado.',
      confirmText: 'Aprovar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    try {
      await approveWithdrawal(id);
      notify.success('Pedido aprovado com sucesso!');
      await reload();
    } catch (e: any) {
      notify.error(e?.message || 'Erro ao aprovar pedido');
    }
  }

  async function doReject(id: string) {
    const note = await prompt({
      title: 'Rejeitar pedido',
      description: 'Você pode informar um motivo (opcional).',
      placeholder: 'Motivo da rejeição…',
      confirmText: 'Rejeitar',
      cancelText: 'Cancelar',
    });
    // null => cancelado
    if (note === null) return;
    try {
      await rejectWithdrawal(id, note || undefined);
      notify.info('Pedido rejeitado.');
      await reload();
    } catch (e: any) {
      notify.error(e?.message || 'Erro ao rejeitar pedido');
    }
  }

  return (
    <div className="min-h-dvh px-4 sm:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />

        {/* ===== Filtros ===== */}
        <Card className="rounded-2xl border-blue-200 bg-white/90 backdrop-blur">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900">
                <Filter className="h-4 w-4" />
                <h2 className="font-semibold">Filtrar pedidos</h2>
                {activeFilters > 0 && (
                  <Badge className="ml-1 bg-blue-600 text-white hover:bg-blue-700">
                    {activeFilters}
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters((s) => !s)}
                className="sm:hidden rounded-full"
              >
                <span className="mr-2">{showFilters ? 'Ocultar' : 'Opções'}</span>
                <motion.div animate={{ rotate: showFilters ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            </div>

            {/* desktop */}
            <div className="mt-3 hidden sm:grid sm:grid-cols-6 gap-3">
              <FilterFields
                from={from} to={to} setFrom={setFrom} setTo={setTo}
                status={status} setStatus={setStatus}
                qRaw={qRaw} setQRaw={setQRaw}
                pageSize={pageSize} setPageSize={(n)=>{ setPageSize(n); setPage(0); }}
                onApply={()=>{ setPage(0); reload(); }}
                loading={loading}
              />
            </div>

            {/* mobile collapse */}
            <AnimatePresence initial={false}>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="sm:hidden overflow-hidden"
                >
                  <div className="grid grid-cols-1 gap-3 pt-3">
                    <FilterFields
                      from={from} to={to} setFrom={setFrom} setTo={setTo}
                      status={status} setStatus={setStatus}
                      qRaw={qRaw} setQRaw={setQRaw}
                      pageSize={pageSize} setPageSize={(n)=>{ setPageSize(n); setPage(0); }}
                      onApply={()=>{ setShowFilters(false); setPage(0); reload(); }}
                      loading={loading}
                      isCompact
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ===== Lista ===== */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            {loading ? (
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border bg-white ring-1 ring-blue-100/40 p-4">
                    <div className="h-5 w-1/3 bg-slate-100 rounded animate-pulse" />
                    <div className="mt-3 h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((r) => {
                  const expanded = expanding[r.id];
                  return (
                    <motion.div key={r.id} layout className="rounded-2xl border bg-gradient-to-br from-white to-blue-50/40 ring-1 ring-blue-100/60 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="min-w-0 flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 grid place-items-center ring-1 ring-blue-200">
                            <CalendarClock className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">
                                Pedido <span className="text-muted-foreground">#{r.id.slice(0, 8)}</span>
                              </span>
                              <StatusPill s={r.status} />
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-xs text-blue-950">
                              <UserRound className="h-3.5 w-3.5 opacity-80" />
                              <span className="truncate">
                                {r.user_name ?? r.user_email ?? r.user_id}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => toggleItems(r.id)}>
                            {expanded ? 'Esconder itens' : 'Ver itens'}
                          </Button>

                          {r.status === 'pending' && (
                            <>
                              <Button size="sm" className="rounded-full" onClick={() => doApprove(r.id)}>
                                Aprovar
                              </Button>
                              <Button size="sm" variant="destructive" className="rounded-full" onClick={() => doReject(r.id)}>
                                Rejeitar
                              </Button>
                            </>
                          )}

                          <motion.div
                            animate={{ rotate: expanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-muted-foreground"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </motion.div>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.section
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
                              ) : expanded.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Pedido sem itens.</p>
                              ) : (
                                <div className="space-y-2">
                                  {expanded.map((row, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                      <div className="min-w-0 flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <p className="truncate">
                                          {row.item?.nome ?? 'Item'} {row.item?.unidade ? `· ${row.item.unidade}` : ''}
                                        </p>
                                      </div>
                                      <p className="text-sm">{row.quantity}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.section>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* paginação */}
            <div className="flex items-center justify-end gap-2 pt-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilterFields({
  from, to, setFrom, setTo,
  status, setStatus,
  qRaw, setQRaw,
  pageSize, setPageSize,
  onApply, loading, isCompact,
}: {
  from: string | null; to: string | null; setFrom: (v: string|null)=>void; setTo: (v: string|null)=>void;
  status: 'pending' | 'approved' | 'rejected' | null; setStatus: (v:'pending'|'approved'|'rejected'|null)=>void;
  qRaw: string; setQRaw: (v:string)=>void;
  pageSize: number; setPageSize: (n:number)=>void;
  onApply: () => void; loading: boolean; isCompact?: boolean;
}) {
  return (
    <>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Buscar (nome, e-mail, id)</label>
        <input
          className="w-full rounded-md bg-background border px-3 py-2"
          placeholder="Ex.: João, joao@..., b5498629…"
          value={qRaw}
          onChange={(e)=>setQRaw(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">De</label>
        <input
          type="date"
          className="w-full rounded-md bg-background border px-3 py-2"
          value={from ?? ''}
          onChange={(e)=>setFrom(e.target.value || null)}
          max={to ?? undefined}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Até</label>
        <input
          type="date"
          className="w-full rounded-md bg-background border px-3 py-2"
          value={to ?? ''}
          onChange={(e)=>setTo(e.target.value || null)}
          min={from ?? undefined}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Status</label>
        <select
          className="w-full rounded-md bg-background border px-2 py-2"
          value={status ?? 'all'}
          onChange={(e)=>setStatus((e.target.value as any) === 'all' ? null : (e.target.value as any))}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Itens por página</label>
        <select
          className="w-full rounded-md bg-background border px-2 py-2"
          value={pageSize}
          onChange={(e)=>setPageSize(Number(e.target.value))}
        >
          {[10,20,50].map(n=>(<option key={n} value={n}>{n}</option>))}
        </select>
      </div>

      <div className={isCompact ? 'flex items-end' : 'flex items-end'}>
        <Button onClick={onApply} disabled={loading} className="w-full rounded-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aplicar filtros
        </Button>
      </div>
    </>
  );
}
