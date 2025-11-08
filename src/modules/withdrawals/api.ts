import { supabase } from '@/lib/supabase';

export type Withdrawal = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

/** Mantido: cria um pedido de retirada via RPC existente */
export async function requestWithdrawal(
  items: { item_id: string; quantity: number }[]
) {
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_items: items,
  });
  if (error) throw new Error(error.message || 'Erro ao enviar pedido de retirada');
  return data as string; // id do pedido
}

/** Mantido: lista “simples” via RPC já existente (sem filtros/paginação) */
export async function listMyWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase.rpc('list_my_withdrawals');
  if (error) throw new Error(error.message || 'Erro ao listar seus pedidos');
  return (data ?? []) as Withdrawal[];
}

/* =========================================================
   NOVO: histórico com filtros e paginação (usa tabela + RLS)
   — não interfere na função listMyWithdrawals() acima
========================================================= */

export type MyWithdrawalHeader = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export async function userListMyWithdrawals(args: {
  from?: string;          // 'YYYY-MM-DD'
  to?: string;            // 'YYYY-MM-DD'
  limit?: number;         // padrão 20
  offset?: number;        // padrão 0
} = {}): Promise<MyWithdrawalHeader[]> {
  const { from, to, limit = 20, offset = 0 } = args;

  // Usa a tabela diretamente, confiando no RLS para restringir ao usuário logado
  let q = supabase
    .from('withdrawals')
    .select('id,status,created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (from) q = q.gte('created_at', from);
  if (to)   q = q.lte('created_at', `${to}T23:59:59.999Z`);

  const { data, error } = await q;
  if (error) throw new Error(error.message || 'Erro ao listar pedidos');
  return (data ?? []) as MyWithdrawalHeader[];
}

/* =========================================================
   NOVO: itens de um pedido do usuário
========================================================= */

export type WithdrawalItemRow = {
  quantity: number;
  item: { id: string; nome: string; unidade: string } | null;
};

export async function getWithdrawalItems(
  withdrawalId: string
): Promise<WithdrawalItemRow[]> {
  const { data, error } = await supabase
    .from('withdrawal_items')
    .select('quantity, item:items(id, nome, unidade)')
    .eq('withdrawal_id', withdrawalId);

  if (error) throw new Error(error.message || 'Erro ao buscar itens do pedido');
  return (data ?? []) as WithdrawalItemRow[];
}
