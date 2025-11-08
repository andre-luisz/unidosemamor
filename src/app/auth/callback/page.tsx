'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

function parseHashParams(hash: string) {
  const out: Record<string, string> = {};
  const str = hash.startsWith('#') ? hash.slice(1) : hash;
  for (const part of str.split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState('Conectando…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1) Fluxo PKCE (moderno): ?code=...
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession({ code });
          if (error) throw error;
          setMsg('Login confirmado! Redirecionando…');
          window.location.replace('/');
          return;
        }

        // 2) Fluxo antigo (hash com tokens): #access_token=...&refresh_token=...
        if (window.location.hash.includes('access_token')) {
          const params = parseHashParams(window.location.hash);
          const access_token = params['access_token'];
          const refresh_token = params['refresh_token'];

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            setMsg('Login confirmado! Redirecionando…');
            window.location.replace('/');
            return;
          }
        }

        // 3) Já existe sessão? (talvez navegador voltou da caixa de e-mail)
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          window.location.replace('/');
          return;
        }

        setMsg('Link inválido ou expirado. Solicite um novo.');
      } catch (e: any) {
        setMsg(e?.message ?? 'Erro ao confirmar login');
      }
    })();
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="text-sm text-muted-foreground">{msg}</div>
    </div>
  );
}
