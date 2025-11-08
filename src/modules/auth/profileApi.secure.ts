// src/modules/auth/profileApi.secure.ts
import { supabase } from '@/lib/supabase';

export type ProfileSecure = {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  cpf: string; // descriptografado só para o próprio usuário
  family_size: number;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
  created_at: string;
};

export async function getMyProfileSecure() {
  const { data, error } = await supabase.rpc('get_my_profile_secure');
  if (error) throw error;
  return (data?.[0] as ProfileSecure) || null;
}

export async function upsertMyProfileSecure(input: {
  first_name: string;
  last_name: string;
  phone?: string;
  cpf: string;
  family_size: number;
}) {
  const { error } = await supabase.rpc('upsert_my_profile_secure', {
    p_first_name: input.first_name,
    p_last_name: input.last_name,
    p_phone: input.phone ?? null,
    p_cpf: input.cpf,
    p_family_size: input.family_size,
  });
  if (error) throw error;
}

export type AdminPendingRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  cpf_masked: string;
  family_size: number;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
  created_at: string;
};

export async function adminListPendingSecure() {
  const { data, error } = await supabase.rpc('admin_list_pending_secure');
  if (error) throw error;
  return (data || []) as AdminPendingRow[];
}

export async function adminSetStatus(user_id: string, status: 'approved' | 'rejected' | 'pending') {
  const { error } = await supabase.rpc('admin_set_user_status', { p_user_id: user_id, p_status: status });
  if (error) throw error;
}

export async function isCurrentUserApproved() {
  const { data, error } = await supabase.rpc('is_current_user_approved');
  if (error) throw error;
  return Boolean(data);
}
/** 
 * Lista usuários com filtros (status opcional, busca opcional, paginação).
 * Requer a RPC do passo 3 (admin_list_users_secure).
 */
export async function adminListUsersSecure(params: {
  status?: 'pending' | 'approved' | 'rejected' | null;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const { status = null, q = null, limit = 20, offset = 0 } = params ?? {};
  const { data, error } = await supabase.rpc('admin_list_users_secure', {
    p_status: status,
    p_q: q,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data ?? []) as AdminPendingRow[];
}