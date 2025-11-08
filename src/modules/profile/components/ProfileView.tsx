'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type ProfileViewProps = {
  profile: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    cpf: string | null;               // mascarado pela RPC
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
  onEdit: () => void;
};

function StatusBadge({ s }: { s: 'pending' | 'approved' | 'rejected' }) {
  if (s === 'approved') return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">aprovado</Badge>;
  if (s === 'rejected') return <Badge variant="destructive">rejeitado</Badge>;
  return <Badge variant="secondary">pendente</Badge>;
}

export default function ProfileView({ profile, onEdit }: ProfileViewProps) {
  const fullName =
    [profile.first_name || '', profile.last_name || ''].join(' ').trim() || '—';
  const address = [profile.street, profile.number, profile.complement].filter(Boolean).join(', ') || '—';
  const area = [profile.district, profile.city, profile.state].filter(Boolean).join(' - ') || '—';
  const postal = profile.postal_code || '—';

  // iniciais para “avatar”
  const initials = (fullName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-700 grid place-items-center font-semibold">
            {initials || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Meu cadastro</h1>
            <p className="text-sm text-muted-foreground">
              Visualize seus dados cadastrados e atualize quando quiser.
            </p>
          </div>
        </div>
        <StatusBadge s={profile.status} />
      </div>

      <div className="rounded-2xl border bg-white/90 backdrop-blur p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome completo" value={fullName} />
          <Field label="Telefone" value={profile.phone || '—'} />
          <Field label="CPF" value={profile.cpf || '—'} />
          <Field label="Membros na família" value={String(profile.family_size ?? '—')} />
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Endereço" value={address} />
          <Field label="Bairro / Cidade / UF" value={area} />
          <Field label="CEP" value={postal} />
          <Field label="Papel" value={profile.role} />
        </div>

        <div className="pt-2">
          <Button onClick={onEdit} className="rounded-full">Atualizar cadastro</Button>
        </div>
      </div>

      {profile.status !== 'approved' && (
        <p className="text-sm text-muted-foreground">
          Seu cadastro ainda não está aprovado. Após a validação por um administrador, você poderá
          realizar retiradas e doações.
        </p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
