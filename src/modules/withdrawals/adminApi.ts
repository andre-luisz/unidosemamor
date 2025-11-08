import { supabase } from '@/lib/supabase';

export type AdminWithdrawal = {
  id: string;
  user_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

/** Linha “completa” (quando vier da listagem geral) */
export type AdminWithdrawalFull = AdminWithdrawal & {
  user_name: string | null;
  user_email: string | null;
  note: string | null;
};

/* =========================
 *  LISTAGENS
 * ========================= */

/**
 * (LEGADO) Lista apenas pendentes.
 * Continua disponível para compatibilidade.
 */
export async function listPendingWithdrawals(): Promise<AdminWithdrawal[]> {
  const { data, error } = await supabase.rpc('admin_list_withdrawals_by_status', {
    p_status: 'pending',
  });
  if (error) throw new Error(error.message || 'Erro ao listar pedidos pendentes');
  return (data ?? []) as AdminWithdrawal[];
}

/**
 * (NOVA) Lista pedidos com filtros (status, período, busca, paginação).
 * Requer a RPC `admin_list_withdrawals_secure` (que te passei).
 */
export async function listWithdrawals(params: {
  status?: 'pending' | 'approved' | 'rejected';
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  q?: string;    // nome / e-mail / id do pedido
  limit?: number;
  offset?: number;
}): Promise<AdminWithdrawalFull[]> {
  const { status, from, to, q, limit = 20, offset = 0 } = params || {};

  const { data, error } = await supabase.rpc<AdminWithdrawalFull[]>(
    'admin_list_withdrawals_secure',
    {
      p_status: status ?? null,
      p_from: from ?? null,
      p_to: to ?? null,
      p_q: q ?? null,
      p_limit: limit,
      p_offset: offset,
    }
  );

  if (error) throw new Error(error.message || 'Erro ao listar pedidos');
  return (data ?? []) as AdminWithdrawalFull[];
}

/* =========================
 *  AÇÕES
 * ========================= */

export async function approveWithdrawal(id: string, note?: string) {
  const { data, error } = await supabase.rpc('admin_approve_withdrawal', {
    p_withdrawal_id: id,
    p_approve: true,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message || 'Erro ao aprovar pedido');
  return data as 'approved';
}

export async function rejectWithdrawal(id: string, note?: string) {
  const { data, error } = await supabase.rpc('admin_approve_withdrawal', {
    p_withdrawal_id: id,
    p_approve: false,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message || 'Erro ao rejeitar pedido');
  return data as 'rejected';
}

/* =========================
 *  ITENS DO PEDIDO
 * ========================= */

export type WithdrawalItemRow = {
  quantity: number;
  item: { id: string; nome: string; unidade: string | null } | null;
};

/** Carrega itens de um pedido (RLS com acesso de admin) */
export async function getWithdrawalItems(withdrawalId: string): Promise<WithdrawalItemRow[]> {
  const { data, error } = await supabase
    .from('withdrawal_items')
    .select('quantity, item:items(id, nome, unidade)')
    .eq('withdrawal_id', withdrawalId);

  if (error) throw new Error(error.message || 'Erro ao buscar itens do pedido');
  return (data ?? []) as WithdrawalItemRow[];
}
