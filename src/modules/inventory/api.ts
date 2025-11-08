// src/modules/inventory/api.ts
import { supabase } from '@/lib/supabase';
import { uploadProductImage } from '@/modules/storage/uploadProductImage';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export type Categoria =
  | 'Grãos'
  | 'Higiene'
  | 'Enlatados'
  | 'Limpeza'
  | 'Bebidas'
  | 'Outros';

export type Item = {
  id: string;
  nome: string;
  categoria: Categoria;
  unidade: string;
  quantidade: number;
  prioridade?: 'Baixa' | 'Média' | 'Alta' | null;
  /** Path no bucket (privado), ex.: 'items/<id>/<arquivo>.jpg' */
  image_url?: string | null;
};

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('id, nome, categoria, unidade, quantidade, prioridade, image_url')
    .order('nome');

  if (error) throw error;
  return (data ?? []) as Item[];
}

/** Cria item com estoque 0 e sobe imagem (opcional) ao bucket privado. */
export async function createItem(input: {
  nome: string;
  categoria: Categoria;
  unidade: string;
  prioridade?: 'Baixa' | 'Média' | 'Alta';
  imageFile?: File | null;
}) {
  const { data: inserted, error: insErr } = await supabase
    .from('items')
    .insert([
      {
        nome: input.nome,
        categoria: input.categoria,
        unidade: input.unidade,
        quantidade: 0,
        prioridade: input.prioridade ?? null,
      },
    ])
    .select('id')
    .single();

  if (insErr) throw insErr;
  const itemId = inserted.id as string;

  if (input.imageFile) {
    const up = await uploadProductImage(input.imageFile, itemId);
    const { error: upErr } = await supabase
      .from('items')
      .update({ image_url: up.path })
      .eq('id', itemId);
    if (upErr) throw upErr;
  }

  return itemId;
}

/** Atualiza campos do item (nome e/ou image_url - path no Storage). */
export async function updateItem(
  id: string,
  patch: Partial<Pick<Item, 'nome' | 'image_url'>>
) {
  const { error } = await supabase.from('items').update(patch).eq('id', id);
  if (error) throw error;
}

/** Realtime para tabela items. */
export function subscribeItems(onChange: () => void) {
  const channel = supabase
    .channel('items-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items' },
      onChange
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/* =========================================================
   IMAGENS PRIVADAS: helper para gerar Signed URL segura
   ========================================================= */

/** Retorna true se a string já é uma URL absoluta http/https. */
function isAbsoluteUrl(u?: string | null): boolean {
  if (!u) return false;
  return /^https?:\/\//i.test(u);
}

/** Garante sessão antes de acessar recursos privados. */
async function ensureSessionOrRedirect(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (!session) {
      // Redireciona apenas em ambiente de browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return false;
    }
    return true;
  } catch {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  }
}

/**
 * Gera uma Signed URL para exibir imagens do bucket privado.
 * - Se `path` já for uma URL absoluta, retorna como está.
 * - Se `path` for vazio/nulo, retorna null (sem quebrar a UI).
 * - Se não houver sessão, redireciona para /login e retorna null.
 * - Em caso de erro (ex.: "Object not found"), retorna null.
 */
export async function getSignedImageUrl(
  path?: string | null,
  expiresInSeconds = 60 * 60 // 1h
): Promise<string | null> {
  if (!path) return null;
  if (isAbsoluteUrl(path)) return path;

  // Exige sessão antes de tentar gerar a URL assinada
  const ok = await ensureSessionOrRedirect();
  if (!ok) return null;

  try {
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      // Evita quebrar a UI. Apenas loga para debug.
      console.error('Erro ao criar signed URL:', error.message);
      return null;
    }
    return data?.signedUrl ?? null;
  } catch (err: any) {
    console.error('Erro inesperado ao criar signed URL:', err?.message || err);
    return null;
  }
}
