// src/app/cadastro/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import ProfileLoader from '@/modules/profile/components/ProfileLoader';
import ProfileView from '@/modules/profile/components/ProfileView';
import ProfileForm, { type ProfileData } from '@/modules/profile/components/ProfileForm';

type ProfileResponse = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  cpf: string | null; // já vem mascarado pela RPC
  family_size: number | null;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  created_at: string;
};

export default function CadastroPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [editing, setEditing] = useState(false);

  async function loadProfile() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      window.location.href = '/login';
      return;
    }

    const { data } = await supabase.rpc<ProfileResponse[]>('get_my_profile_secure');
    const row = data?.[0] ?? null;
    setProfile(row);
    setLoading(false);

    // se não tem perfil ainda, já abre o formulário
    setEditing(!row);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) return <ProfileLoader />;

  const initial: ProfileData | undefined = profile
    ? {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        cpf: profile.cpf || null, // mantém o CPF visível/imutável no form
        family_size: profile.family_size ?? 1,
        street: profile.street,
        number: profile.number,
        complement: profile.complement,
        district: profile.district,
        city: profile.city,
        state: profile.state,
        postal_code: profile.postal_code,
      }
    : undefined;

  return (
    <div className="min-h-dvh bg-blue-50/50">
      {/* Cabeçalho simples, sem botão sair */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center">
          <Header modo="doar" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {editing || !profile ? (
          <ProfileForm
            initial={initial}
            onCancel={() => setEditing(false)}
            onSaved={loadProfile}
          />
        ) : (
          <ProfileView profile={profile} onEdit={() => setEditing(true)} />
        )}
      </div>
    </div>
  );
}
