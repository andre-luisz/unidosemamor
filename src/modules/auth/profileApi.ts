import { supabase } from '@/lib/supabase';

export type Profile = {
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  cpf: string;
  family_size: number;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
  created_at?: string;
};

// Validação simples de CPF (formato + dígitos) — regra oficial pode ser aperfeiçoada
export function isValidCPF(raw: string) {
  const cpf = raw.replace(/\D/g, '');
  if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11; if (rest === 10 || rest === 11) rest = 0; if (rest !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0; for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11; if (rest === 10 || rest === 11) rest = 0; return rest === parseInt(cpf.substring(10, 11));
}

export async function getMyProfile() {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function upsertMyProfile(input: Omit<Profile, 'user_id' | 'status' | 'role' | 'created_at'>) {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) throw new Error('not_authenticated');
  if (!isValidCPF(input.cpf)) throw new Error('CPF inválido');

  const payload: Partial<Profile> = {
    user_id: uid,
    first_name: input.first_name,
    last_name: input.last_name,
    phone: input.phone || null,
    cpf: input.cpf.replace(/\D/g, ''),
    family_size: input.family_size,
  };
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function listPendingProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Profile[];
}

export async function adminSetStatus(user_id: string, status: 'approved' | 'rejected' | 'pending') {
  const { error } = await supabase.rpc('admin_set_user_status', { p_user_id: user_id, p_status: status });
  if (error) throw error;
}
