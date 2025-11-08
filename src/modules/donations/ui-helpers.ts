// --- tipos que você já tem:
export type DonationRow = {
  id: string;
  donated_at: string;
  note: string | null;
  user_id: string;
  user_email: string | null;

  item_id: string;
  item_nome: string;
  item_categoria: string | null;
  item_unidade: string | null;
  quantity: number;
  expires_at: string | null;
};

// --- tipo agrupado por doação:
export type DonationGroup = {
  id: string;
  donated_at: string;
  note: string | null;
  user_id: string;
  user_email: string | null;
  items: Array<{
    item_id: string;
    item_nome: string;
    item_categoria: string | null;
    item_unidade: string | null;
    quantity: number;
    expires_at: string | null;
  }>;
};

// agrupa linhas planas por id da doação
export function groupByDonation(rows: DonationRow[]): DonationGroup[] {
  const map = new Map<string, DonationGroup>();
  for (const r of rows) {
    let g = map.get(r.id);
    if (!g) {
      g = {
        id: r.id,
        donated_at: r.donated_at,
        note: r.note,
        user_id: r.user_id,
        user_email: r.user_email,
        items: [],
      };
      map.set(r.id, g);
    }
    g.items.push({
      item_id: r.item_id,
      item_nome: r.item_nome,
      item_categoria: r.item_categoria,
      item_unidade: r.item_unidade,
      quantity: r.quantity,
      expires_at: r.expires_at,
    });
  }
  return Array.from(map.values());
}

// evita "Invalid Date" e sempre mostra no pt-BR
export function formatDateTime(s?: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
