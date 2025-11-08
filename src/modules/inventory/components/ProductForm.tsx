// src/modules/inventory/components/ProductForm.tsx
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Categoria } from '@/modules/inventory/api';

const unidades = ['unid', 'kg', 'g', 'L', 'ml', 'cx'] as const;
const categorias: Categoria[] = ['Grãos', 'Higiene', 'Enlatados', 'Limpeza', 'Bebidas', 'Outros'];

const schema = z.object({
  nome: z.string().min(2, 'Informe um nome válido'),
  categoria: z.enum(categorias),
  unidade: z.enum(unidades),
  quantidade: z.coerce.number().int().min(0, 'Mínimo 0'), // 👈 agora aceita 0
  prioridade: z.enum(['Baixa', 'Média', 'Alta']).optional(),
  validade: z.string().optional().nullable(),
  imageFile: z.any().optional(),
});

export type FormData = z.infer<typeof schema>;

export function ProductForm({
  onSubmit,
}: {
  onSubmit: (data: FormData) => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      categoria: 'Grãos',
      unidade: 'unid',
      quantidade: 0, // 👈 padrão zerado
      validade: '',
    },
  });

  const categoria = watch('categoria');
  const unidade = watch('unidade');
  const prioridade = watch('prioridade');

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSubmitting(true);
        try {
          await onSubmit(data);
          reset();
        } finally {
          setSubmitting(false);
        }
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Nome do item</Label>
          <Input placeholder="Ex.: Arroz integral" {...register('nome')} />
          {errors.nome && <p className="text-xs text-red-600 mt-1">{errors.nome.message as any}</p>}
        </div>

        <div>
          <Label>Categoria</Label>
          <Select value={categoria} onValueChange={(v) => setValue('categoria', v as Categoria)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Unidade</Label>
          <Select value={unidade} onValueChange={(v) => setValue('unidade', v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {unidades.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Quantidade</Label>
          <Input type="number" min={0} {...register('quantidade', { valueAsNumber: true })} />
          {errors.quantidade && (
            <p className="text-xs text-red-600 mt-1">{errors.quantidade.message as any}</p>
          )}
        </div>

        <div>
          <Label>Prioridade (opcional)</Label>
          <Select
            value={prioridade ?? 'none'}
            onValueChange={(v) =>
              setValue('prioridade', v === 'none' ? undefined : (v as any))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem prioridade</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Validade (opcional)</Label>
          <Input type="date" {...register('validade')} />
        </div>

        <div className="sm:col-span-2">
          <Label>Imagem do produto (opcional)</Label>
          <Input type="file" accept="image/*" {...register('imageFile')} />
        </div>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : 'Cadastrar produto'}
      </Button>
    </form>
  );
}
