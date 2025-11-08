// src/app/admin/usuarios/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  getMyProfileSecure,
  adminSetStatus,
  type AdminPendingRow,
  // nova função (passo 2)
  adminListUsersSecure,
} from '@/modules/auth/profileApi.secure';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Users, CheckCircle2, XCircle, ListFilter } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected' | 'all';

const statusLabel: Record<Exclude<Status, 'all'>, string> = {
  pending: 'pendente',
  approved: 'aprovado',
  rejected: 'rejeitado',
};

function StatusPill({ s }: { s: AdminPendingRow['status'] }) {
  if (s === 'approved')
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">aprovado</Badge>;
  if (s === 'rejected') return <Badge variant="destructive">rejeitado</Badge>;
  return <Badge variant="secondary">pendente</Badge>;
}

/**
 * Algumas respostas podem trazer `email` fora do tipo gerado, ou dentro de `user`.
 * Estendemos localmente só para viabilizar o fallback no render.
 */
type AdminPendingRowUI = AdminPendingRow & {
  email?: string | null;
  user?: { email?: string | null } | null;
};

export default function AdminUsuariosPage() {
  const [isAdmin, setIsAdmin] = useState(false);

  // filtros
  const [tab, setTab] = useState<Status>('pending');
  const [qRaw, setQRaw] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // dados
  const [rows, setRows] = useState<AdminPendingRowUI[]>([]);
  const [loading, setLoading] = useState(true);

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setQ(qRaw.trim()), 300);
    return () => clearTimeout(t);
  }, [qRaw]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const me = await getMyProfileSecure();
      const ok = me?.role === 'admin';
      setIsAdmin(Boolean(ok));
      if (!ok) {
        alert('Acesso restrito a administradores.');
        window.location.href = '/';
        return;
      }
      await refresh();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, page, pageSize]);

  async function refresh() {
    setLoading(true);
    try {
      const data = await adminListUsersSecure({
        status: tab === 'all' ? null : tab,
        q: q || undefined,
        limit: pageSize,
        offset: page * pageSize,
      });
      setRows((data ?? []) as AdminPendingRowUI[]);
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(user_id: string, status: 'approved' | 'rejected' | 'pending') {
    setLoading(true);
    try {
      await adminSetStatus(user_id, status);
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  const activeCount = useMemo(() => rows.length, [rows]);

  const displayEmail = (p: AdminPendingRowUI) => p.email ?? p.user?.email ?? '';

  if (!isAdmin) return null;

  return (
    <div className="min-h-dvh px-4 sm:px-8 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header modo="retirar" />

        {/* ===== Barra de filtros ===== */}
        <Card className="rounded-2xl border-blue-200 bg-white/90 backdrop-blur">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Abas */}
              <div className="flex flex-wrap items-center gap-2">
                <TabButton
                  icon={<Users className="h-4 w-4" />}
                  active={tab === 'pending'}
                  onClick={() => {
                    setTab('pending');
                    setPage(0);
                  }}
                >
                  Pendentes
                </TabButton>
                <TabButton
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  active={tab === 'approved'}
                  onClick={() => {
                    setTab('approved');
                    setPage(0);
                  }}
                >
                  Aprovados
                </TabButton>
                <TabButton
                  icon={<XCircle className="h-4 w-4" />}
                  active={tab === 'rejected'}
                  onClick={() => {
                    setTab('rejected');
                    setPage(0);
                  }}
                >
                  Rejeitados
                </TabButton>
                <TabButton
                  icon={<ListFilter className="h-4 w-4" />}
                  active={tab === 'all'}
                  onClick={() => {
                    setTab('all');
                    setPage(0);
                  }}
                >
                  Todos
                </TabButton>
              </div>

              {/* Busca + page size */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={qRaw}
                    onChange={(e) => {
                      setQRaw(e.target.value);
                      setPage(0);
                    }}
                    placeholder="Buscar por nome, CPF, e-mail ou telefone…"
                    className="pl-8"
                  />
                </div>
                <select
                  className="rounded-md border bg-background px-2 py-2 text-sm"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}/pág.
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== Lista ===== */}
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            {loading ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border p-4 bg-white/70">
                    <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                    <div className="mt-2 h-3 w-64 bg-slate-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {rows.map((p) => (
                    <motion.div
                      key={p.user_id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-xl p-3 bg-card/60"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          CPF {p.cpf_masked ?? '—'}
                          {' · '}Família: {p.family_size ?? '—'}
                          {' · '}Fone: {p.phone || '—'}
                          {displayEmail(p) ? ` · ${displayEmail(p)}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <StatusPill s={p.status} />
                        {p.status !== 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => setStatus(p.user_id, 'approved')}
                            className="rounded-full"
                          >
                            Aprovar
                          </Button>
                        )}
                        {p.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setStatus(p.user_id, 'rejected')}
                            className="rounded-full"
                          >
                            Rejeitar
                          </Button>
                        )}
                        {p.status !== 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus(p.user_id, 'pending')}
                            className="rounded-full"
                          >
                            Voltar p/ pendente
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* paginação */}
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                Anterior
              </Button>
              <div className="text-xs text-muted-foreground px-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>pág. {page + 1} · {activeCount} itens</>
                )}
              </div>
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || rows.length < pageSize}
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

function TabButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={`rounded-full ${active ? '' : 'bg-white'}`}
    >
      {icon ? <span className="mr-2">{icon}</span> : null}
      {children}
    </Button>
  );
}
