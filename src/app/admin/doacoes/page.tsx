'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  adminListDonationHeaders,
  type DonationHeader,
} from '@/modules/donations/api';
import ReviewDialog from './ReviewDialog';
import { toast } from 'sonner';
import {
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  CalendarClock,
  Package,
  Loader2,
  UserRound,
} from 'lucide-react';

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function StatusPill({ status }: { status: DonationHeader['status'] }) {
  if (status === 'approved')
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Aprovada</Badge>;
  if (status === 'rejected') return <Badge variant="destructive">Rejeitada</Badge>;
  return <Badge variant="secondary">Pendente</Badge>;
}

export default function AdminDoacoesPage() {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<DonationHeader[]>([]);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<DonationHeader | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  // ------- filtro por doador (debounced) -------
  const [donorQRaw, setDonorQRaw] = useState('');
  const [donorQ, setDonorQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDonorQ(donorQRaw.trim()), 250);
    return () => clearTimeout(t);
  }, [donorQRaw]);

  // contagem de filtros ativos
  const activeFilters = useMemo(
    () => [from, to, status, donorQ].filter(Boolean).length,
    [from, to, status, donorQ]
  );

  async function load() {
    setLoading(true);
    try {
      const data = await adminListDonationHeaders({
        from: from ?? undefined,
        to: to ?? undefined,
        status: status ?? null,
        limit: pageSize,
        offset: page * pageSize,
        // donor: donorQ || undefined, // <— se sua RPC aceitar, habilite
      } as any);

      let list = (Array.isArray(data) ? data : []) as DonationHeader[];

      // Filtro client-side por doador (fallback)
      if (donorQ) {
        const needle = donorQ.toLowerCase();
        list = list.filter((h) => {
          const donorName =
            (h as any).donor_name ??
            (h as any).user_name ??
            (h as any).user_full_name ??
            (h as any).user_email ??
            '';
          return String(donorName).toLowerCase().includes(needle);
        });
      }

      setHeaders(list);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao carregar doações');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status, from, to, donorQ]);

  function openReview(h: DonationHeader) {
    if (!h.header_id) return;
    setSelected(h);
    setReviewOpen(true);
  }

  return (
    <div className="min-h-dvh px-4 sm:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header modo="doar" />

        {/* ===== Filtros ===== */}
        <Card className="rounded-2xl border-blue-200 bg-white/90 backdrop-blur">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900">
                <Filter className="h-4 w-4" />
                <h2 className="font-semibold">Filtrar doações</h2>
                {activeFilters > 0 && (
                  <Badge className="ml-1 bg-blue-600 text-white hover:bg-blue-700">
                    {activeFilters}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="ml-2">Opções</span>
                </Button>

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
            </div>

            <div className="mt-3">
              {/* desktop */}
              <div className="hidden sm:grid sm:grid-cols-6 gap-3">
                <FilterFields
                  from={from}
                  to={to}
                  setFrom={setFrom}
                  setTo={setTo}
                  status={status}
                  setStatus={setStatus}
                  pageSize={pageSize}
                  setPageSize={(n) => {
                    setPageSize(n);
                    setPage(0);
                  }}
                  donorQRaw={donorQRaw}
                  setDonorQRaw={setDonorQRaw}
                  onApply={() => {
                    setPage(0);
                    load();
                  }}
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
                        from={from}
                        to={to}
                        setFrom={setFrom}
                        setTo={setTo}
                        status={status}
                        setStatus={setStatus}
                        pageSize={pageSize}
                        setPageSize={(n) => {
                          setPageSize(n);
                          setPage(0);
                        }}
                        donorQRaw={donorQRaw}
                        setDonorQRaw={setDonorQRaw}
                        onApply={() => {
                          setShowFilters(false);
                          setPage(0);
                          load();
                        }}
                        loading={loading}
                        isCompact
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* ===== Lista ===== */}
        {loading && (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-white ring-1 ring-blue-100/40 p-4">
                <div className="h-5 w-1/3 bg-slate-100 rounded animate-pulse" />
                <div className="mt-3 h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!loading && (headers?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma doação encontrada.</p>
        )}

        <div className="space-y-3">
          {(headers ?? []).map((h) => (
            <DonationCard key={h.header_id} header={h} onReview={openReview} />
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
      </div>

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        header={selected}
        onDone={load}
      />
    </div>
  );
}

function FilterFields({
  from,
  to,
  setFrom,
  setTo,
  status,
  setStatus,
  pageSize,
  setPageSize,
  onApply,
  loading,
  donorQRaw,
  setDonorQRaw,
  isCompact,
}: {
  from: string | null;
  to: string | null;
  setFrom: (v: string | null) => void;
  setTo: (v: string | null) => void;
  status: 'pending' | 'approved' | 'rejected' | null;
  setStatus: (v: 'pending' | 'approved' | 'rejected' | null) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  onApply: () => void;
  loading: boolean;
  donorQRaw: string;
  setDonorQRaw: (v: string) => void;
  isCompact?: boolean;
}) {
  return (
    <>
      {/* Doador */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Doador</label>
        <input
          className="w-full rounded-md bg-background border px-3 py-2"
          placeholder="Buscar por nome ou e-mail…"
          value={donorQRaw}
          onChange={(e) => setDonorQRaw(e.target.value)}
        />
      </div>

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
        <label className="text-xs text-muted-foreground">Status</label>
        <select
          className="w-full rounded-md bg-background border px-2 py-2"
          value={status ?? 'all'}
          onChange={(e) => {
            const v = e.target.value as 'all' | 'pending' | 'approved' | 'rejected';
            setStatus(v === 'all' ? null : v);
          }}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovada</option>
          <option value="rejected">Rejeitada</option>
        </select>
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

      <div className={isCompact ? 'flex items-end' : 'flex items-end'}>
        <Button onClick={onApply} disabled={loading} className="w-full rounded-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aplicar filtros
        </Button>
      </div>
    </>
  );
}

function DonationCard({
  header,
  onReview,
}: {
  header: DonationHeader;
  onReview: (h: DonationHeader) => void;
}) {
  const [open, setOpen] = useState(false);

  // Melhor tentativa de extrair o nome do doador de diferentes campos
  const donorName =
    (header as any).donor_name ??
    (header as any).user_name ??
    (header as any).user_full_name ??
    (header as any).user_email ??
    'Doador';

  const toggle = () => setOpen((o) => !o);
  const keyToggle: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <motion.div
      layout
      className="rounded-2xl border bg-gradient-to-br from-white to-blue-50/40 ring-1 ring-blue-100/60 shadow-sm"
    >
      {/* Cabeçalho clicável sem usar <button> (evita button dentro de button) */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={keyToggle}
        aria-expanded={open}
        aria-controls={`sec-${header.header_id}`}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 grid place-items-center ring-1 ring-blue-200">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium truncate">{fmtDateTime(header.donated_at)}</span>
                <StatusPill status={header.status} />
              </div>

              {/* Nome do doador */}
              <div className="mt-1 flex items-center gap-2 text-xs text-blue-950">
                <UserRound className="h-3.5 w-3.5 opacity-80" />
                <span className="truncate">{donorName}</span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                {(header.lines?.length ?? 0)} item(s)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {header.status === 'pending' && header.header_id && (
              <Button
                size="sm"
                className="hidden sm:inline-flex rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(header);
                }}
              >
                Revisar
              </Button>
            )}
            <motion.div
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </motion.div>
          </div>
        </div>
      </div>

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
                      <td>{r.expires_at ? new Date(r.expires_at).toLocaleDateString('pt-BR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {header.status === 'pending' && (
              <>
                <Separator />
                <div className="p-3 flex justify-end sm:hidden">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => onReview(header)}
                  >
                    Revisar
                  </Button>
                </div>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
