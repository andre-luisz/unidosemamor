'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

type Role = 'guest' | 'user' | 'admin';

/* ===== tipos de notificações do usuário ===== */
type UserNotif = {
  id: string;   // algo único para deduplicar (ex.: table:id:status)
  text: string; // mensagem exibida
  href?: string;
  ts: number;
};

function debounce(fn: () => void, ms: number) {
  let t: any;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(), ms);
  };
}

export default function NotificationBell({ role }: { role: Role }) {
  // não renderiza para guest
  if (role === 'guest') return null;

  // ===== admin: contadores =====
  const [notifUsers, setNotifUsers] = useState(0);
  const [notifDonations, setNotifDonations] = useState(0);
  const [notifWithdrawals, setNotifWithdrawals] = useState(0);
  const [notifTotal, setNotifTotal] = useState(0);

  // ===== usuário: mensagens =====
  const [userId, setUserId] = useState<string | null>(null);
  const [userNotifs, setUserNotifs] = useState<UserNotif[]>([]);

  // canais realtime
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const bellTotal = useMemo(
    () => (role === 'admin' ? notifTotal : userNotifs.length),
    [role, notifTotal, userNotifs.length]
  );

  // bootstrap da sessão e assinatura apropriada
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);

      // limpa qualquer canal antigo (hot reload)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (role === 'admin') {
        await fetchAdminCounts();
        subscribeAdmin();
      } else if (role === 'user' && uid) {
        subscribeUser(uid);
      }
    })();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  /* =========================
     ADMIN
  ========================= */
  async function fetchAdminCounts() {
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
    setNotifTotal(u + d + w);
  }

  function subscribeAdmin() {
    if (channelRef.current) return;

    const ch = supabase
      .channel('admin-bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debounce(fetchAdminCounts, 300))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_headers' }, debounce(fetchAdminCounts, 300))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, debounce(fetchAdminCounts, 300))
      .subscribe();

    channelRef.current = ch;
  }

  /* =========================
     USER
  ========================= */
  function pushUserNotif(n: UserNotif) {
    setUserNotifs((prev) => {
      if (prev.some((x) => x.id === n.id)) return prev; // dedup
      return [n, ...prev].slice(0, 15);
    });
  }

  function subscribeUser(uid: string) {
    if (channelRef.current) return;

    const ch = supabase
      .channel('user-bell')
      // pedidos (withdrawals)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, (payload: any) => {
        const row = payload.new as { id?: string; user_id?: string | null; status?: string | null } | undefined;
        if (!row || row.user_id !== uid) return;
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
      // doações (donation_headers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_headers' }, (payload: any) => {
        const row = payload.new as { id?: string; user_id?: string | null; status?: string | null } | undefined;
        if (!row || row.user_id !== uid) return;
        if (row.status === 'rejected') {
          pushUserNotif({
            id: `donations:${row.id}:rejected`,
            text: `❌ Sua doação #${String(row.id ?? '').slice(0, 8)} foi rejeitada (fale com o admin)`,
            href: '/doar/historico',
            ts: Date.now(),
          });
        }
      })
      // cadastro (profiles)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
        const row = payload.new as { user_id?: string; status?: string | null } | undefined;
        if (!row || row.user_id !== uid) return;
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

    channelRef.current = ch;
  }

  function clearNotifications() {
    if (role === 'admin') {
      setNotifUsers(0);
      setNotifDonations(0);
      setNotifWithdrawals(0);
      setNotifTotal(0);
    } else {
      setUserNotifs([]);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 md:h-6 md:w-6 text-blue-800" />
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
  );
}
