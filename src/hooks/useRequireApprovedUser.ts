'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useRequireApprovedUser() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        if (!cancelled) router.replace('/login');
        return;
      }

      const { data, error } = await supabase.rpc('get_my_profile_secure');
      const profile = Array.isArray(data) ? data[0] : data;

      if (error || !profile || profile.status !== 'approved') {
        // sem alert: manda para a tela de espera
        if (!cancelled) router.replace('/aguardando-aprovacao');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);
}
