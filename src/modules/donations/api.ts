'use client';

import { supabase } from '@/lib/supabase';

/* ==== Tipos ==== */
export type DonationLine = {
  item_id: string;
  quantity: number;
  expires_at?: string | null; // ISO YYYY-MM-DD (opcional)
};

export type DonationRow = {
  id: string;
  donated_at: string;
  note: string | null;
  user_id: string;
  user_email: string | null;
  item_id?: string;
  item_nome: string;
  item_categoria: string | null;
  item_unidade: string | null;
  quantity: number;
  expires_at: string | null;
};

export type DonationHeader = {
  header_id: string;
  donated_at: string;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  user_email?: string | null;
  item_count: number;
  lines: Array<{
    item_id: string;
    item_nome: string;
    item_categoria: string | null;
    item_unidade: string | null;
    quantity: number;
    expires_at: string | null;
  }>;
};

/* ==== Helpers ==== */
async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user) throw new Error('not_authenticated');
  return data.user;
}

function normalizeRow(r: any): DonationRow {
  return {
    id: r.id ?? r.donation_id,
    donated_at: r.donated_at ?? r.created_at,
    note: r.note ?? null,
    user_id: r.user_id ?? null,
    user_email: r.user_email ?? r.email ?? null,
    item_id: r.item_id ?? null,
    item_nome: r.item_nome ?? r.item_name ?? r.nome ?? '',
    item_categoria: r.item_categoria ?? r.categoria ?? null,
    item_unidade: r.item_unidade ?? r.unidade ?? null,
    quantity: r.quantity ?? r.quantidade ?? 0,
    expires_at: r.expires_at ?? r.valid_until ?? null,
  };
}

function groupRowsToHeaders(rows: DonationRow[]): DonationHeader[] {
  const byHeader = new Map<string, DonationHeader>();
  for (const r0 of rows) {
    const r = normalizeRow(r0);
    const hId = r.id;
    if (!hId) continue;
    if (!byHeader.has(hId)) {
      byHeader.set(hId, {
        header_id: hId,
        donated_at: r.donated_at,
        note: r.note ?? null,
        status: 'pending',
        user_email: r.user_email ?? null,
        item_count: 0,
        lines: [],
      });
    }
    const h = byHeader.get(hId)!;
    h.lines.push({
      item_id: r.item_id ?? `noitem-${h.lines.length}`,
      item_nome: r.item_nome,
      item_categoria: r.item_categoria,
      item_unidade: r.item_unidade,
      quantity: r.quantity,
      expires_at: r.expires_at,
    });
    h.item_count = h.lines.length;
  }
  return Array.from(byHeader.values()).sort(
    (a, b) => new Date(b.donated_at).getTime() - new Date(a.donated_at).getTime()
  );
}

/* ==== 1) Registrar doação ==== */
export async function donateItemsBulk(lines: DonationLine[], note?: string) {
  const user = await requireUser();

  const payload = (lines ?? [])
    .filter((l) => l.item_id && Number(l.quantity) > 0)
    .map((l) => ({
      item_id: l.item_id,
      quantidade: Number(l.quantity),
      validade: l.expires_at ?? null,
    }));

  if (payload.length === 0) return;

  // ❗️Sem generic; args sempre no 2º parâmetro
  const { error } = await supabase.rpc('donate_items_bulk', {
    p_note: note ?? null,
    p_payload: payload,
    p_user_id: user.id,
  });
  if (error) throw error;
}

/* ==== 2) Listagens “flat” (retro) ==== */
export async function userListMyDonations(opts?: {
  q?: string;
  from?: string | null;
  to?: string | null;
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}) {
  await requireUser();
  const { q = null, from = null, to = null, sortDir = 'desc', limit = 20, offset = 0 } = opts ?? {};
  const sd = sortDir === 'asc' ? 'asc' : 'desc';

  const { data, error } = await supabase.rpc('user_list_my_donations', {
    p_from: from,
    p_to: to,
    p_q: q,
    p_limit: limit,
    p_offset: offset,
    p_sortdir: sd,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeRow) as DonationRow[];
}
export const userListDonations = userListMyDonations;

/* (Admin) lista “flat” - se sua RPC aceitar p_status, inclua aqui também */
export async function adminListDonations(opts?: {
  q?: string;
  from?: string | null;
  to?: string | null;
  limit?: number;
  offset?: number;
}) {
  await requireUser();
  const { q = null, from = null, to = null, limit = 20, offset = 0 } = opts ?? {};
  const { data, error } = await supabase.rpc('admin_get_all_donations', {
    p_from: from,
    p_to: to,
    p_q: q,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeRow) as DonationRow[];
}

/* ==== 3) Cabeçalhos (usuario) ==== */
export async function userListMyDonationHeaders(opts?: {
  from?: string | null;
  to?: string | null;
  limit?: number;
  offset?: number;
}): Promise<DonationHeader[]> {
  await requireUser();
  const { from = null, to = null, limit = 10, offset = 0 } = opts ?? {};

  const { data, error } = await supabase.rpc('user_get_my_donation_headers', {
    p_from: from,
    p_to: to,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;

  const arr = Array.isArray(data) ? data : [];
  return (arr as any[]).map((h) => ({
    item_count: h.item_count ?? (Array.isArray(h.lines) ? h.lines.length : 0),
    lines: Array.isArray(h.lines) ? h.lines : [],
    ...h,
  })) as DonationHeader[];
}

/* ==== 4) Cabeçalhos (admin) — força p_status ==== */
export async function adminListDonationHeaders(opts?: {
  from?: string | null;
  to?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | null; // null = Todos
  limit?: number;
  offset?: number;
}): Promise<DonationHeader[]> {
  await requireUser();
  const { from = null, to = null, status = null, limit = 20, offset = 0 } = opts ?? {};

  // Envie SEMPRE p_status para desambiguar overloads no backend
  const { data, error } = await supabase.rpc('admin_get_all_donations', {
    p_from: from,
    p_to: to,
    p_status: status ?? null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;

  const arr = Array.isArray(data) ? data : [];

  if (arr.length && ('header_id' in arr[0] || 'lines' in arr[0])) {
    return (arr as any[]).map((h) => ({
      item_count: h.item_count ?? (Array.isArray(h.lines) ? h.lines.length : 0),
      lines: Array.isArray(h.lines) ? h.lines : [],
      ...h,
    })) as DonationHeader[];
  }

  // fallback para retornar vazio caso a função esteja retornando flat
  return [];
}

/* ==== 5) Revisão (admin) ==== */
export async function adminReviewDonation(
  headerId: string,
  status: 'approved' | 'rejected',
  note: string | null,
  lines: { item_id: string; quantity: number; expires_at?: string | null }[],
) {
  await requireUser();
  const payload = (lines ?? []).map((l) => ({
    item_id: l.item_id,
    quantity: Number(l.quantity),
    expires_at: l.expires_at ?? null,
  }));

  const { error } = await supabase.rpc('admin_review_donation', {
    p_header_id: headerId,
    p_status: status,
    p_note: note,
    p_lines: payload,
  });
  if (error) throw error;
}

/* ==== (Opcional) Utilitário se precisar agrupar rows em headers ==== */
export { groupRowsToHeaders };
