'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useRequireAdmin() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        if (!cancelled) router.replace('/login');
        return;
      }

      const { data } = await supabase.rpc('get_my_profile_secure');
      const profile = Array.isArray(data) ? data[0] : data;

      if (!profile || profile.role !== 'admin') {
        if (!cancelled) router.replace('/');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);
}
