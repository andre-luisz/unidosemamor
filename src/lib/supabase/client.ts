// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Singleton de cliente Supabase para o navegador.
 * - Não usa 'cookies' (isso é para uso no servidor).
 * - Evita múltiplas instâncias e problemas de sessão.
 */
export function createClient() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!url || !anon) {
      throw new Error(
        "Faltam variáveis NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }

    browserClient = createBrowserClient(url, anon);
  }
  return browserClient;
}
