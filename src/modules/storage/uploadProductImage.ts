import { supabase } from '@/lib/supabase';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

/**
 * Sobe a imagem e retorna apenas o **path** (bucket privado).
 * Para exibir, gere uma Signed URL (abaixo tem helper).
 */
export async function uploadProductImage(file: File, itemId: string) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `items/${itemId}/${Date.now()}.${ext}`;

  const { error } = await supabase
    .storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type || 'image/*',
    });

  if (error) throw error;

  return { path };
}

/** Gera uma Signed URL a partir do path salvo no banco */
export async function getSignedUrlFromPath(path: string, expiresInSeconds = 3600) {
  const { data, error } = await supabase
    .storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}
