// src/components/layout/Header.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  HandPlatter,
  Plus,
  LogOut,
  Menu,
  User2,
  ShieldCheck,
  ClipboardList,
  History,
  HandCoins,
  Boxes,
  Bell,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { supabase } from '@/lib/supabase';
import { getMyProfileSecure } from '@/modules/auth/profileApi.secure';

type HeaderProps = {
  modo?: 'retirar' | 'doar';
  setModo?: (m: 'retirar' | 'doar') => void;
  cartCount?: number;
};

const LOW_STOCK_THRESHOLD = 3; // limite para “baixo estoque”

function StatusPill({
  status,
}: {
  status: 'approved' | 'pending' | 'rejected' | null;
}) {
  if (!status) return null;
  if (status === 'approved')
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white">
        aprovado
      </Badge>
    );
  if (status === 'rejected') return <Badge variant="destructive">rejeitado</Badge>;
  return <Badge className="bg-amber-100 text-amber-800">pendente</Badge>;
}

/* ===== tipos de notificações do usuário ===== */
type UserNotif = {
  id: string;       // algo único para deduplicar (ex.: table:id:status)
  text: string;     // mensagem
  href?: string;    // rota útil
  ts: number;       // timestamp para ordenar
};

export default function Header({
  modo = 'retirar',
  setModo,
  cartCount = 0,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState<'guest' | 'user' | 'admin'>('guest');
  const [status, setStatus] = useState<'approved' | 'pending' | 'rejected' | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [nameInitials, setNameInitials] = useState<string>('');
  const [openMobile, setOpenMobile] = useState(false);

  // ---- Estoque baixo (admin) ----
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const lowStockChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ---- Notificações (admin – contadores) ----
  const [notifCount, setNotifCount] = useState(0);
  const [notifUsers, setNotifUsers] = useState(0);
  const [notifDonations, setNotifDonations] = useState(0);
  const [notifWithdrawals, setNotifWithdrawals] = useState(0);

  // ---- Notificações (usuário – lista de mensagens) ----
  const [userNotifs, setUserNotifs] = useState<UserNotif[]>([]);

  // canais realtime
  const notifChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isAdminRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  const isActive = useMemo(
    () => (href: string) => pathname?.startsWith(href),
    [pathname]
  );

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        currentUserIdRef.current = user?.id ?? null;
        setEmail(user?.email ?? null);

        if (user?.email) {
          const base = user.email.split('@')[0];
          const parts = base.replace(/[._-]+/g, ' ').split(' ');
          const initials =
            parts.length >= 2
              ? (parts[0][0] + parts[1][0]).toUpperCase()
              : base.slice(0, 2).toUpperCase();
          setNameInitials(initials);
        } else {
          setNameInitials('');
        }

        const p = await getMyProfileSecure().catch(() => null);
        if (!p) {
          setRole(user ? 'user' : 'guest');
          setStatus(null);
          isAdminRef.current = false;
          // sino para usuário (apenas realtime das coisas dele)
          if (user?.id) {
            subscribeUserNotifications(user.id);
          }
        } else {
          const isAdmin = p.role === 'admin';
          setRole(isAdmin ? 'admin' : 'user');
          setStatus(p.status ?? null);
          isAdminRef.current = isAdmin;

          if (isAdmin) {
            await fetchLowStockCount();
            subscribeLowStockRealtime();
            await fetchAdminNotifCount();
            subscribeAdminNotifications();
          } else {
            // usuário comum
            if (user?.id) {
              subscribeUserNotifications(user.id);
            }
          }
        }
      } catch {
        setRole('guest');
        setStatus(null);
        setEmail(null);
        setNameInitials('');
        isAdminRef.current = false;
      }
    })();

    return () => {
      if (lowStockChannelRef.current) {
        supabase.removeChannel(lowStockChannelRef.current);
        lowStockChannelRef.current = null;
      }
      if (notifChannelRef.current) {
        supabase.removeChannel(notifChannelRef.current);
        notifChannelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     BAIXO ESTOQUE (ADMIN)
     ========================================================= */
  async function fetchLowStockCount() {
    const { count } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .lte('quantidade', LOW_STOCK_THRESHOLD);

    setLowStockCount(count ?? 0);
  }

  function subscribeLowStockRealtime() {
    if (lowStockChannelRef.current) return;

    const ch = supabase
      .channel('low-stock-items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        (() => {
          let t: any;
          return () => {
            if (t) clearTimeout(t);
            t = setTimeout(() => {
              if (isAdminRef.current) fetchLowStockCount().catch(() => {});
            }, 300);
          };
        })()
      )
      .subscribe();

    lowStockChannelRef.current = ch;
  }

  /* =========================================================
     NOTIFICAÇÕES – ADMIN (contadores)
     ========================================================= */
  async function fetchAdminNotifCount() {
    const [users, donations, withdrawals] = await Promise.all([
      supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('donation_headers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    const u = users.count ?? 0;
    const d = donations.count ?? 0;
    const w = withdrawals.count ?? 0;

    setNotifUsers(u);
    setNotifDonations(d);
    setNotifWithdrawals(w);
    setNotifCount(u + d + w);
  }

  function subscribeAdminNotifications() {
    if (notifChannelRef.current) return;

    const ch = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debounce(fetchAdminNotifCount, 300))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_headers' }, debounce(fetchAdminNotifCount, 300))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, debounce(fetchAdminNotifCount, 300))
      .subscribe();

    notifChannelRef.current = ch;
  }

  /* =========================================================
     NOTIFICAÇÕES – USUÁRIO (mensagens)
     ========================================================= */
  function pushUserNotif(n: UserNotif) {
    setUserNotifs((prev) => {
      // dedup por id
      if (prev.some((x) => x.id === n.id)) return prev;
      const next = [n, ...prev].slice(0, 15); // mantém últimas 15
      return next;
    });
  }

  function subscribeUserNotifications(userId: string) {
    if (notifChannelRef.current) return;

    const ch = supabase
      .channel('user-notifications')
      // Pedidos (withdrawals) -> aprovado/rejeitado
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, (payload: any) => {
        const row = payload.new as { id?: string; user_id?: string | null; status?: string | null } | undefined;
        if (!row || row.user_id !== userId) return;
        if (row.status === 'approved') {
          pushUserNotif({
            id: `withdrawals:${row.id}:approved`,
            text: `✅ Seu pedido #${String(row.id ?? '').slice(0, 8)} foi aprovado`,
            href: '/retirada',
            ts: Date.now(),
          });
        } else if (row.status === 'rejected') {
          pushUserNotif({
            id: `withdrawals:${row.id}:rejected`,
            text: `❌ Seu pedido #${String(row.id ?? '').slice(0, 8)} foi rejeitado`,
            href: '/retirada',
            ts: Date.now(),
          });
        }
      })
      // Doações (donation_headers) -> rejeitado
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_headers' }, (payload: any) => {
        const row = payload.new as { id?: string; user_id?: string | null; status?: string | null } | undefined;
        if (!row || row.user_id !== userId) return;
        if (row.status === 'rejected') {
          pushUserNotif({
            id: `donation:${row.id}:rejected`,
            text: `❌ Sua doação #${String(row.id ?? '').slice(0, 8)} foi rejeitada (fale com o admin)`,
            href: '/doar/historico',
            ts: Date.now(),
          });
        }
      })
      // Cadastro (profiles) -> aprovado/rejeitado
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
        const row = payload.new as { user_id?: string; status?: string | null } | undefined;
        if (!row || row.user_id !== userId) return;
        if (row.status === 'approved') {
          pushUserNotif({
            id: `profile:${row.user_id}:approved`,
            text: '✅ Seu cadastro foi aprovado',
            href: '/retirada',
            ts: Date.now(),
          });
        } else if (row.status === 'rejected') {
          pushUserNotif({
            id: `profile:${row.user_id}:rejected`,
            text: '❌ Seu cadastro foi rejeitado (fale com o admin)',
            href: '/cadastro',
            ts: Date.now(),
          });
        }
      })
      .subscribe();

    notifChannelRef.current = ch;
  }

  function clearNotifications() {
    if (isAdminRef.current) {
      // admin: zera contadores
      setNotifCount(0);
      setNotifUsers(0);
      setNotifDonations(0);
      setNotifWithdrawals(0);
    } else {
      // usuário: limpa mensagens
      setUserNotifs([]);
    }
  }

  function debounce(fn: () => void, ms: number) {
    let t: any;
    return () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => fn(), ms);
    };
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace('/login');
    }
  }

  /* =========================================================
     RENDER
     ========================================================= */
  // badge do sino:
  const bellTotal = isAdminRef.current ? notifCount : userNotifs.length;

  return (
    <header className="w-full sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* barra clara com sombra suave */}
        <div className="mt-4 rounded-2xl bg-white/95 backdrop-blur ring-1 ring-blue-100 shadow-sm">
          {/* faixa superior fina azul (branding) */}
          <div className="h-1 rounded-t-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400" />

          <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
            {/* ESQUERDA: logo + nome + status */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-blue-50 grid place-items-center ring-1 ring-blue-100">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                />
              </div>
              <Link href="/" className="hover:opacity-90">
                <div className="leading-tight">
                  <h1 className="text-lg sm:text-2xl font-semibold text-blue-900">Unidos em Amor</h1>
                  <p className="hidden sm:block text-xs text-slate-500">unir quem doa e quem precisa 💙</p>
                </div>
              </Link>
              {role !== 'guest' && <StatusPill status={status} />}
            </div>

            {/* CENTRO (desktop): navegação/ações */}
            <div className="hidden md:flex items-center gap-2">
              {setModo ? (
                <div className="grid grid-cols-2 bg-blue-50 rounded-full p-1 text-sm ring-1 ring-blue-100">
                  <Button
                    variant={modo === 'retirar' ? 'default' : 'ghost'}
                    className={`rounded-full ${modo === 'retirar' ? 'shadow bg-blue-600 hover:bg-blue-600 text-white' : 'text-blue-700'}`}
                    onClick={() => setModo('retirar')}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Retirar
                  </Button>
                  <Button
                    variant={modo === 'doar' ? 'default' : 'ghost'}
                    className={`rounded-full ${modo === 'doar' ? 'shadow bg-blue-600 hover:bg-blue-600 text-white' : 'text-blue-700'}`}
                    onClick={() => setModo('doar')}
                  >
                    <HandPlatter className="mr-2 h-4 w-4" /> Doar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Link href="/retirada">
                    <Button
                      variant={isActive('/retirada') ? 'default' : 'ghost'}
                      className={`rounded-full ${isActive('/retirada') ? 'bg-blue-600 hover:bg-blue-600 text-white' : 'text-blue-700'}`}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" /> Retirar
                    </Button>
                  </Link>
                  <Link href="/doar">
                    <Button
                      variant={isActive('/doar') ? 'default' : 'ghost'}
                      className={`rounded-full ${isActive('/doar') ? 'bg-blue-600 hover:bg-blue-600 text-white' : 'text-blue-700'}`}
                    >
                      <HandPlatter className="mr-2 h-4 w-4" /> Doar
                    </Button>
                  </Link>
                </div>
              )}

              <Badge className="bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-100">
                {cartCount} na sacola
              </Badge>

              {role === 'admin' && (
                <>
                  <div className="flex items-center gap-2">
                    <Link href="/admin/estoque">
                      <Button
                        variant={isActive('/admin/estoque') ? 'default' : 'outline'}
                        className="rounded-full"
                      >
                        <Boxes className="mr-2 h-4 w-4" /> Estoque
                      </Button>
                    </Link>

                    {lowStockCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="rounded-full px-2 py-1 text-[11px]"
                        title={`Itens com quantidade ≤ ${LOW_STOCK_THRESHOLD}`}
                      >
                        {lowStockCount}
                      </Badge>
                    )}
                  </div>

                  <Link href="/produtos/novo">
                    <Button className="rounded-full bg-emerald-600 hover:bg-emerald-600/90 text-white">
                      <Plus className="mr-2 h-4 w-4" /> Cadastrar produto
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* DIREITA (desktop): sino + usuário */}
            <div className="hidden md:flex items-center gap-2">
              {(role === 'admin' || role === 'user') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                      <Bell className="h-5 w-5 text-blue-800" />
                      {bellTotal > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-600 text-[10px] text-white grid place-items-center px-[5px]">
                          {bellTotal > 99 ? '99+' : bellTotal}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {role === 'admin' ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/usuarios" className="flex w-full items-center justify-between">
                            <span>Usuários pendentes</span>
                            {notifUsers > 0 && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {notifUsers}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/doacoes" className="flex w-full items-center justify-between">
                            <span>Doações pendentes</span>
                            {notifDonations > 0 && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {notifDonations}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/pedidos" className="flex w-full items-center justify-between">
                            <span>Pedidos pendentes</span>
                            {notifWithdrawals > 0 && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {notifWithdrawals}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearNotifications} className="text-blue-700">
                          Limpar contador
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {userNotifs.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Sem novas notificações.</div>
                        ) : (
                          userNotifs
                            .sort((a, b) => b.ts - a.ts)
                            .slice(0, 8)
                            .map((n) => (
                              <DropdownMenuItem key={n.id} asChild>
                                <Link href={n.href ?? '#'} className="truncate">{n.text}</Link>
                              </DropdownMenuItem>
                            ))
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearNotifications} className="text-blue-700">
                          Marcar como lidas
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {email ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full px-2 text-blue-800">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 ring-1 ring-blue-200 text-[10px] font-bold grid place-items-center text-blue-800">
                          {nameInitials || 'EU'}
                        </div>
                        <span className="hidden sm:block truncate max-w-[200px]">
                          {email}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Conta</span>
                      <StatusPill status={status} />
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/cadastro" className="flex items-center gap-2">
                        <User2 className="h-4 w-4" /> Meu cadastro
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/doar/historico" className="flex items-center gap-2">
                        <History className="h-4 w-4" /> Histórico
                      </Link>
                    </DropdownMenuItem>

                    {role === 'admin' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/estoque" className="flex items-center gap-2">
                            <Boxes className="h-4 w-4" /> Estoque
                            {lowStockCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-auto h-5 px-2 rounded-full text-[11px]"
                                title={`Itens com quantidade ≤ ${LOW_STOCK_THRESHOLD}`}
                              >
                                {lowStockCount}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/admin/doacoes" className="flex items-center gap-2">
                            <HandCoins className="h-4 w-4" /> Doações (admin)
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/usuarios" className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Aprovar usuários
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/pedidos" className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" /> Pedidos pendentes
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full text-blue-700">
                    Entrar
                  </Button>
                </Link>
              )}
            </div>

            {/* MOBILE: sino + menu */}
            <div className="md:hidden flex items-center gap-1">
              {(role === 'admin' || role === 'user') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                      <Bell className="h-6 w-6 text-blue-800" />
                      {bellTotal > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-600 text-[10px] text-white grid place-items-center px-[5px]">
                          {bellTotal > 99 ? '99+' : bellTotal}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {role === 'admin' ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/usuarios" className="flex w-full items-center justify-between">
                            <span>Usuários pendentes</span>
                            {notifUsers > 0 && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {notifUsers}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/doacoes" className="flex w-full items-center justify-between">
                            <span>Doações pendentes</span>
                            {notifDonations > 0 && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {notifDonations}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/pedidos" className="flex w-full items-center justify-between">
                            <span>Pedidos pendentes</span>
                            {notifWithdrawals > 0 && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {notifWithdrawals}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearNotifications} className="text-blue-700">
                          Limpar contador
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {userNotifs.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Sem novas notificações.</div>
                        ) : (
                          userNotifs
                            .sort((a, b) => b.ts - a.ts)
                            .slice(0, 8)
                            .map((n) => (
                              <DropdownMenuItem key={n.id} asChild>
                                <Link href={n.href ?? '#'} className="truncate">{n.text}</Link>
                              </DropdownMenuItem>
                            ))
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearNotifications} className="text-blue-700">
                          Marcar como lidas
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenMobile((v) => !v)}
              >
                <Menu className="h-6 w-6 text-blue-800" />
              </Button>
            </div>
          </div>

          {/* MENU MOBILE */}
          {openMobile && (
            <div className="px-3 pb-3 md:hidden flex flex-col gap-2 pt-2 border-t border-blue-100">
              {setModo ? (
                <div className="grid grid-cols-2 bg-blue-50 rounded-full p-1 text-sm ring-1 ring-blue-100">
                  <Button
                    variant={modo === 'retirar' ? 'default' : 'ghost'}
                    className={`rounded-full ${modo === 'retirar' ? 'shadow bg-blue-600 hover:bg-blue-600 text-white' : 'text-blue-700'}`}
                    onClick={() => setModo('retirar')}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Retirar
                  </Button>
                  <Button
                    variant={modo === 'doar' ? 'default' : 'ghost'}
                    className={`rounded-full ${modo === 'doar' ? 'shadow bg-blue-600 hover:bg-blue-600 text-white' : 'text-blue-700'}`}
                    onClick={() => setModo('doar')}
                  >
                    <HandPlatter className="mr-2 h-4 w-4" /> Doar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/retirada" onClick={() => setOpenMobile(false)}>
                    <Button
                      variant={isActive('/retirada') ? 'default' : 'ghost'}
                      className={`rounded-full ${isActive('/retirada') ? 'bg-blue-600 hover:bg-blue-600 text-white' : 'text-blue-700'}`}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" /> Retirar
                    </Button>
                  </Link>
                  <Link href="/doar" onClick={() => setOpenMobile(false)}>
                    <Button
                      variant={isActive('/doar') ? 'default' : 'ghost'}
                      className={`rounded-full ${isActive('/doar') ? 'bg-blue-600 hover:bg-blue-600 text-white' : 'text-blue-700'}`}
                    >
                      <HandPlatter className="mr-2 h-4 w-4" /> Doar
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Badge className="bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-100">
                  {cartCount} na sacola
                </Badge>
                {role === 'admin' && (
                  <Link href="/produtos/novo" onClick={() => setOpenMobile(false)}>
                    <Button className="rounded-full bg-emerald-600 hover:bg-emerald-600/90 text-white">
                      <Plus className="mr-2 h-4 w-4" /> Cadastrar produto
                    </Button>
                  </Link>
                )}
              </div>

              {email ? (
                <>
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 ring-1 ring-blue-100">
                    <div className="h-7 w-7 rounded-full bg-blue-100 ring-1 ring-blue-200 grid place-items-center text-[10px] font-bold text-blue-800">
                      {nameInitials || 'EU'}
                    </div>
                    <span className="truncate">{email}</span>
                    <StatusPill status={status} />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Link href="/cadastro" onClick={() => setOpenMobile(false)}>
                      <Button
                        variant={isActive('/cadastro') ? 'default' : 'secondary'}
                        className="w-full rounded-full"
                      >
                        <User2 className="h-4 w-4 mr-2" /> Meu cadastro
                      </Button>
                    </Link>

                    <Link href="/doar/historico" onClick={() => setOpenMobile(false)}>
                      <Button
                        variant={isActive('/doar/historico') ? 'default' : 'secondary'}
                        className="w-full rounded-full"
                      >
                        <History className="h-4 w-4 mr-2" /> Histórico
                      </Button>
                    </Link>

                    {role === 'admin' && (
                      <>
                        <Link href="/admin/estoque" onClick={() => setOpenMobile(false)}>
                          <Button
                            variant={isActive('/admin/estoque') ? 'default' : 'secondary'}
                            className="w-full rounded-full"
                          >
                            <Boxes className="h-4 w-4 mr-2" /> Estoque
                            {lowStockCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-2 h-5 px-2 rounded-full text-[11px]"
                                title={`Itens com quantidade ≤ ${LOW_STOCK_THRESHOLD}`}
                              >
                                {lowStockCount}
                              </Badge>
                            )}
                          </Button>
                        </Link>

                        <Link href="/admin/doacoes" onClick={() => setOpenMobile(false)}>
                          <Button
                            variant={isActive('/admin/doacoes') ? 'default' : 'secondary'}
                            className="w-full rounded-full"
                          >
                            <HandCoins className="h-4 w-4 mr-2" /> Doações (admin)
                          </Button>
                        </Link>
                        <Link href="/admin/usuarios" onClick={() => setOpenMobile(false)}>
                          <Button
                            variant={isActive('/admin/usuarios') ? 'default' : 'secondary'}
                            className="w-full rounded-full"
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" /> Aprovar usuários
                          </Button>
                        </Link>
                        <Link href="/admin/pedidos" onClick={() => setOpenMobile(false)}>
                          <Button
                            variant={isActive('/admin/pedidos') ? 'default' : 'secondary'}
                            className="w-full rounded-full"
                          >
                            <ClipboardList className="h-4 w-4 mr-2" /> Pedidos pendentes
                          </Button>
                        </Link>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      className="rounded-full text-red-600"
                      onClick={() => {
                        setOpenMobile(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sair
                    </Button>
                  </div>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpenMobile(false)}>
                  <Button variant="ghost" className="rounded-full text-blue-700">
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
