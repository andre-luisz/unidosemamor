'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { adminReviewDonation, type DonationHeader } from '@/modules/donations/api';
import { toast } from 'sonner';
import { X } from 'lucide-react';

type EditableLine = {
  item_id: string;
  item_nome: string;
  item_categoria: string | null;
  item_unidade: string | null;
  quantity: number;
  expires_at: string | null; // YYYY-MM-DD
  removed?: boolean;
};

export default function ReviewDialog({
  open,
  onOpenChange,
  header,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  header: DonationHeader | null;
  onDone?: () => void;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<EditableLine[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onOpenChange(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || !header) return;
    setNote(header.note ?? '');
    setLines(
      (header.lines ?? []).map((l) => ({
        item_id: l.item_id,
        item_nome: l.item_nome,
        item_categoria: l.item_categoria,
        item_unidade: l.item_unidade,
        quantity: Number(l.quantity ?? 0),
        expires_at: l.expires_at ? String(l.expires_at).slice(0, 10) : null,
        removed: false,
      }))
    );
  }, [open, header]);

  const remainingCount = useMemo(
    () => lines.filter((l) => !l.removed && Number(l.quantity) > 0).length,
    [lines]
  );
  const missingExpiry = useMemo(
    () => lines.some((l) => !l.removed && Number(l.quantity) > 0 && !l.expires_at),
    [lines]
  );

  if (!open || !header) return null;

  function setQty(idx: number, v: number) {
    setLines((arr) => {
      const n = [...arr];
      n[idx] = { ...n[idx], quantity: v < 0 ? 0 : v };
      return n;
    });
  }
  function toggleRemoved(idx: number) {
    setLines((arr) => {
      const n = [...arr];
      n[idx] = { ...n[idx], removed: !n[idx].removed };
      return n;
    });
  }
  function setExpiry(idx: number, iso: string) {
    setLines((arr) => {
      const n = [...arr];
      n[idx] = { ...n[idx], expires_at: iso || null };
      return n;
    });
  }

  async function submit(status: 'approved' | 'rejected') {
    if (status === 'approved' && missingExpiry) {
      toast.error('Preencha a validade de todos os itens mantidos para aprovar.');
      return;
    }
    setSaving(true);
    try {
      const payload =
        status === 'approved'
          ? lines
              .filter((l) => !l.removed && Number(l.quantity) > 0)
              .map((l) => ({
                item_id: l.item_id,
                quantity: Number(l.quantity),
                expires_at: l.expires_at ?? null,
              }))
          : [];

      await adminReviewDonation(header.header_id, status, note || null, payload);
      toast.success(status === 'approved' ? 'Doação aprovada' : 'Doação rejeitada');
      onOpenChange(false);
      onDone?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Falha ao salvar revisão');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute inset-0 flex items-center justify-center p-4"
            initial={{ scale: 0.98, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className="w-full max-w-3xl rounded-2xl bg-card shadow-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Revisar doação</h2>
                  <Badge variant="secondary">
                    {new Date(header.donated_at).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 space-y-3">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="[&>th]:text-left [&>th]:px-3 [&>th]:py-2">
                        <th style={{ width: '40%' }}>Produto</th>
                        <th>Qtd</th>
                        <th>Unid</th>
                        <th>Categoria</th>
                        <th>Validade</th>
                        <th>Remover</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l, idx) => (
                        <tr
                          key={`${header.header_id}-${l.item_id}-${idx}`}
                          className="[&>td]:px-3 [&>td]:py-2 border-t"
                        >
                          <td className={l.removed ? 'line-through text-muted-foreground' : ''}>
                            {l.item_nome}
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              className="w-24 rounded-md border bg-background px-2 py-1"
                              value={l.quantity}
                              onChange={(e) => setQty(idx, Number(e.target.value))}
                              disabled={l.removed}
                            />
                          </td>
                          <td>{l.item_unidade ?? '—'}</td>
                          <td>{l.item_categoria ?? '—'}</td>
                          <td>
                            <input
                              type="date"
                              className="w-44 rounded-md border bg-background px-2 py-1"
                              value={l.expires_at ?? ''}
                              min={new Date().toISOString().slice(0, 10)}
                              onChange={(e) => setExpiry(idx, e.target.value)}
                              disabled={l.removed}
                            />
                          </td>
                          <td>
                            <Button
                              variant={l.removed ? 'default' : 'destructive'}
                              size="sm"
                              onClick={() => toggleRemoved(idx)}
                            >
                              {l.removed ? 'Desfazer' : 'Remover'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {lines.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                            Sem itens.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Separator />

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Observação (opcional)</label>
                  <textarea
                    className="w-full min-h-[96px] rounded-md border bg-background p-2"
                    placeholder="Ex.: aprovado parcialmente…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {remainingCount} item(s) serão aprovados.
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" disabled={saving} onClick={() => submit('rejected')}>
                    Rejeitar
                  </Button>
                  <Button
                    disabled={saving || remainingCount === 0 || missingExpiry}
                    onClick={() => submit('approved')}
                  >
                    Aprovar {remainingCount > 0 ? `(${remainingCount})` : ''}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
