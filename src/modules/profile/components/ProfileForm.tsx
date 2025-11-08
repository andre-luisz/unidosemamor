'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export type ProfileData = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  cpf?: string | null;               // pode vir mascarado (quando já existe)
  family_size?: number | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
};

type ProfileFormProps = {
  initial?: ProfileData;
  onCancel?: () => void;
  onSaved?: () => void;
};

/** validação de CPF (dígitos verificadores) */
function isValidCPF(raw: string): boolean {
  const s = raw.replace(/\D/g, '');
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false;

  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += parseInt(base[i]) * (factor - i);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calc(s.slice(0, 9), 10);
  const d2 = calc(s.slice(0, 9) + d1, 11);
  return s.endsWith(`${d1}${d2}`);
}

export default function ProfileForm({ initial, onCancel, onSaved }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);

  // estados base
  const [firstName, setFirstName] = useState(initial?.first_name ?? '');
  const [lastName, setLastName] = useState(initial?.last_name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const alreadyHasCpf = Boolean(initial?.cpf);      // ✅ já existe CPF cadastrado?
  const [cpf, setCpf] = useState('');               // CPF novo (apenas no primeiro cadastro)
  const [familySize, setFamilySize] = useState<number>(Number(initial?.family_size ?? 1));

  const [street, setStreet] = useState(initial?.street ?? '');
  const [number, setNumber] = useState(initial?.number ?? '');
  const [complement, setComplement] = useState(initial?.complement ?? '');
  const [district, setDistrict] = useState(initial?.district ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [uf, setUf] = useState(initial?.state ?? '');
  const [postal, setPostal] = useState(initial?.postal_code ?? '');

  // máscaras simples
  const maskedPhone = useMemo(() => {
    const d = (phone || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  }, [phone]);

  const maskedCEP = useMemo(() => {
    const d = (postal || '').replace(/\D/g, '').slice(0, 8);
    return d.replace(/(\d{5})(\d{0,3})/, '$1-$2').trim();
  }, [postal]);

  const maskedCpfInput = useMemo(() => {
    const d = (cpf || '').replace(/\D/g, '').slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }, [cpf]);

  const cpfIsValid = alreadyHasCpf || (cpf && isValidCPF(cpf));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.warning('Faça login para salvar seu cadastro.');
        return;
      }

      // valida CPF apenas quando ainda não existe
      const cpfRaw = (cpf || '').replace(/\D/g, '');
      if (!alreadyHasCpf && !isValidCPF(cpfRaw)) {
        toast.error('Digite um CPF válido.');
        return;
      }

      const postalRaw = (postal || '').replace(/\D/g, '');
      const fam = Number.isFinite(Number(familySize)) ? Math.max(1, Number(familySize)) : 1;

      const { error } = await supabase.rpc('upsert_my_profile_secure', {
        p_first_name: firstName?.trim() || null,
        p_last_name: lastName?.trim() || null,
        p_phone: phone?.trim() || null,
        // ✅ nunca enviamos p_cpf quando o usuário já tem CPF (não permite atualização)
        p_cpf: alreadyHasCpf ? null : (cpfRaw ? cpfRaw : null),
        p_family_size: fam,
        p_street: street?.trim() || null,
        p_number: number?.trim() || null,
        p_complement: complement?.trim() || null,
        p_district: district?.trim() || null,
        p_city: city?.trim() || null,
        p_state: uf?.trim().toUpperCase() || null,
        p_postal_code: postalRaw || null,
      });

      if (error) {
        const msg =
          (error as any)?.message ||
          (error as any)?.details ||
          (error as any)?.hint ||
          JSON.stringify(error);
        if (String(msg).toLowerCase().includes('duplicate')) {
          toast.error('Este CPF já está cadastrado.');
        } else {
          toast.error(`Falha ao salvar: ${msg}`);
        }
        return;
      }

      toast.success('Cadastro salvo com sucesso!');
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Cadastro de Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Preencha seus dados para liberar retiradas e doações.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border bg-white/90 backdrop-blur p-4 sm:p-6 space-y-5 shadow-sm"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </Field>

          <Field label="Sobrenome">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </Field>

          <Field label="Telefone">
            <Input
              inputMode="numeric"
              value={maskedPhone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </Field>

          {/* CPF */}
          <Field label="CPF">
            {alreadyHasCpf ? (
              <>
                {/* readOnly para permitir copiar o valor, mas sem editar */}
                <Input
                  value={initial?.cpf || ''}
                  readOnly
                  aria-readonly="true"
                  className="font-medium bg-slate-50 text-slate-700 cursor-default focus-visible:ring-0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  CPF verificado e associado ao seu perfil. Alterações só com o responsável.
                </p>
              </>
            ) : (
              <>
                <Input
                  inputMode="numeric"
                  value={maskedCpfInput}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  aria-invalid={cpf ? (!cpfIsValid).toString() : 'false'}
                />
                {!cpfIsValid && cpf.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">CPF inválido.</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  O CPF será verificado e associado permanentemente ao seu perfil.
                </p>
              </>
            )}
          </Field>

          <Field label="Membros na família">
            <Input
              type="number"
              min={1}
              value={familySize}
              onChange={(e) => setFamilySize(Math.max(1, Number(e.target.value || 1)))}
            />
          </Field>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Rua" full>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} />
          </Field>

          <Field label="Número">
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </Field>

          <Field label="Complemento">
            <Input value={complement} onChange={(e) => setComplement(e.target.value)} />
          </Field>

          <Field label="Bairro">
            <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
          </Field>

          <Field label="Cidade">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>

          <Field label="UF">
            <Input
              value={uf?.toUpperCase()}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
              maxLength={2}
            />
          </Field>

          <Field label="CEP">
            <Input
              inputMode="numeric"
              value={maskedCEP}
              onChange={(e) => setPostal(e.target.value)}
              placeholder="00000-000"
            />
          </Field>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            disabled={saving || (!alreadyHasCpf && !cpfIsValid)}
            className="rounded-full"
          >
            {saving ? 'Salvando…' : 'Salvar cadastro'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
