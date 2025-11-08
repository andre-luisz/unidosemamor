'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getMyProfileSecure } from '@/modules/auth/profileApi.secure';

// Ajuste aqui os nomes das tabelas/colunas se forem diferentes no seu schema.
const TABLES = {
  profiles: { schema: 'public', table: 'profiles', id: 'user_id', status: 'status' as const },
  donations: { schema: 'public', table: 'donation_headers', id: 'header_id', status: 'status' as const },
  withdrawals: { schema: 'public', table: 'withdrawals', id: 'id', status: 'status' as const, userId: 'user_id' as const },
};

type Role = 'guest' | 'user' | 'admin';

export default function RealtimeNotifications() {
  const chanRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [role, setRole] = useState<Role>('guest');
  const [meId, setMeId] = useState<string | null>(null);

  // antipânico: evitar toasts repetidos (debounce por id+status por 5s)
  const dedupeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user ?? null;
      setMeId(user?.id ?? null);

      const p = await getMyProfileSecure().catch(() => null);
      const r: Role = p?.role === 'admin' ? 'admin' : (user ? 'user' : 'guest');
      if (!isMounted) return;
      setRole(r);

      // (Re)assina os canais conforme papel
      subscribe(r, user?.id ?? null);
    })();

    return () => {
      isMounted = false;
      if (chanRef.current) {
        supabase.removeChannel(chanRef.current);
        chanRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function subscribe(myRole: Role, userId: string | null) {
    // limpa canal anterior
    if (chanRef.current) {
      supabase.removeChannel(chanRef.current);
      chanRef.current = null;
    }

    // Sem usuário logado, não assina nada
    if (myRole === 'guest') return;

    const ch = supabase.channel('realtime-app-notifications');

    // ========== NOTIFICAÇÕES PARA ADMIN ==========
    if (myRole === 'admin') {
      // 1) Novos perfis pendentes (INSERT em profiles)
      ch.on(
        'postgres_changes',
        { event: 'INSERT', schema: TABLES.profiles.schema, table: TABLES.profiles.table },
        (payload: any) => {
          try {
            const row = payload.new || {};
            if (row[TABLES.profiles.status] === 'pending') {
              showOnce(
                `new-profile-${row[TABLES.profiles.id]}`,
                () =>
                  toast.info('Novo cadastro pendente', {
                    description: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Usuário pendente de aprovação',
                    action: {
                      label: 'Abrir',
                      onClick: () => (window.location.href = '/admin/usuarios'),
                    },
                  })
              );
            }
          } catch {}
        }
      );

      // 2) Novas doações pendentes (INSERT em donation_headers)
      ch.on(
        'postgres_changes',
        { event: 'INSERT', schema: TABLES.donations.schema, table: TABLES.donations.table },
        (payload: any) => {
          try {
            const row = payload.new || {};
            if (row[TABLES.donations.status] === 'pending') {
              showOnce(
                `new-donation-${row[TABLES.donations.id]}`,
                () =>
                  toast.info('Nova doação recebida', {
                    description: 'Há uma doação aguardando revisão.',
                    action: {
                      label: 'Revisar',
                      onClick: () => (window.location.href = '/admin/doacoes'),
                    },
                  })
              );
            }
          } catch {}
        }
      );

      // 3) Novos pedidos pendentes (INSERT em withdrawals)
      ch.on(
        'postgres_changes',
        { event: 'INSERT', schema: TABLES.withdrawals.schema, table: TABLES.withdrawals.table },
        (payload: any) => {
          try {
            const row = payload.new || {};
            if (row[TABLES.withdrawals.status] === 'pending') {
              showOnce(
                `new-withdrawal-${row[TABLES.withdrawals.id]}`,
                () =>
                  toast.info('Novo pedido de retirada', {
                    description: `Pedido #${String(row[TABLES.withdrawals.id]).slice(0, 8)} aguardando aprovação.`,
                    action: {
                      label: 'Ver',
                      onClick: () => (window.location.href = '/admin/pedidos'),
                    },
                  })
              );
            }
          } catch {}
        }
      );
    }

    // ========== NOTIFICAÇÕES PARA USUÁRIO ==========
    // Mudança de status do pedido do próprio usuário (UPDATE em withdrawals onde user_id = meu id)
    if (userId) {
      ch.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: TABLES.withdrawals.schema,
          table: TABLES.withdrawals.table,
          filter: `${TABLES.withdrawals.userId}=eq.${userId}`,
        },
        (payload: any) => {
          try {
            const oldRow = payload.old || {};
            const row = payload.new || {};
            const oldStatus = oldRow[TABLES.withdrawals.status];
            const newStatus = row[TABLES.withdrawals.status];

            if (!oldStatus || oldStatus === newStatus) return;

            const shortId = String(row[TABLES.withdrawals.id]).slice(0, 8);
            if (newStatus === 'approved') {
              showOnce(
                `withdrawal-approved-${row[TABLES.withdrawals.id]}`,
                () =>
                  toast.success('Seu pedido foi aprovado!', {
                    description: `Pedido #${shortId} está pronto conforme instruções do local.`,
                    action: {
                      label: 'Ver histórico',
                      onClick: () => (window.location.href = '/doar/historico?tab=pedidos'),
                    },
                  })
              );
            } else if (newStatus === 'rejected') {
              showOnce(
                `withdrawal-rejected-${row[TABLES.withdrawals.id]}`,
                () =>
                  toast.error('Seu pedido foi rejeitado', {
                    description: `Pedido #${shortId}. Verifique o motivo com a equipe.`,
                    action: {
                      label: 'Detalhes',
                      onClick: () => (window.location.href = '/doar/historico?tab=pedidos'),
                    },
                  })
              );
            }
          } catch {}
        }
      );
    }

    ch.subscribe();
    chanRef.current = ch;
  }

  function showOnce(key: string, fn: () => void) {
    const now = Date.now();
    const last = dedupeRef.current[key] ?? 0;
    if (now - last < 5000) return; // 5s de janela para evitar duplicados
    dedupeRef.current[key] = now;
    fn();
  }

  return null;
}
