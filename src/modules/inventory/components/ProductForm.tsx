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
const categorias = ['Grãos', 'Higiene', 'Enlatados', 'Limpeza', 'Bebidas', 'Outros'] as const;

const schema = z.object({
  nome: z.string().min(2, 'Informe um nome válido'),
  categoria: z.enum(categorias),
  unidade: z.enum(unidades),
  // coerce => input é unknown, output é number
  quantidade: z.coerce.number().int().min(0, 'Mínimo 0'),
  prioridade: z.enum(['Baixa', 'Média', 'Alta']).optional(),
  validade: z
    .string()
    .optional()
    .or(z.literal('').transform(() => undefined))
    .nullable()
    .transform((v) => (v === '' ? undefined : v ?? undefined)),
  imageFile: z.any().optional(),
});

export type FormValues = z.output<typeof schema>; // valores já validados pelo Zod
type FormInputs = z.input<typeof schema>;         // valores crus do formulário (antes do Zod)

export function ProductForm({
  onSubmit,
}: {
  onSubmit: (data: FormValues) => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      categoria: 'Grãos',
      unidade: 'unid',
      // ok ter número aqui; o tipo de input é unknown e aceita
      quantidade: 0 as unknown as number,
      validade: '',
    },
  });

  const categoria = watch('categoria');
  const unidade = watch('unidade');
  const prioridade = watch('prioridade');

  return (
    <form
      onSubmit={handleSubmit(async (raw) => {
        // depois do resolver, os dados estão válidos como FormValues
        const data = raw as unknown as FormValues;
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
          <Select
            value={categoria}
            onValueChange={(v) =>
              setValue('categoria', v as Categoria, { shouldValidate: true })
            }
          >
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
          {errors.categoria && (
            <p className="text-xs text-red-600 mt-1">{errors.categoria.message as any}</p>
          )}
        </div>

        <div>
          <Label>Unidade</Label>
          <Select
            value={unidade}
            onValueChange={(v) =>
              setValue('unidade', v as (typeof unidades)[number], { shouldValidate: true })
            }
          >
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
          {errors.unidade && (
            <p className="text-xs text-red-600 mt-1">{errors.unidade.message as any}</p>
          )}
        </div>

        <div>
          <Label>Quantidade</Label>
          {/* NÃO use valueAsNumber aqui; o z.coerce já cuida */}
          <Input type="number" min={0} step={1} {...register('quantidade')} />
          {errors.quantidade && (
            <p className="text-xs text-red-600 mt-1">{errors.quantidade.message as any}</p>
          )}
        </div>

        <div>
          <Label>Prioridade (opcional)</Label>
          <Select
            value={prioridade ?? 'none'}
            onValueChange={(v) =>
              setValue('prioridade', v === 'none' ? undefined : (v as any), {
                shouldValidate: true,
              })
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
          {errors.prioridade && (
            <p className="text-xs text-red-600 mt-1">{errors.prioridade.message as any}</p>
          )}
        </div>

        <div>
          <Label>Validade (opcional)</Label>
          <Input type="date" {...register('validade')} />
          {errors.validade && (
            <p className="text-xs text-red-600 mt-1">{errors.validade as any}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label>Imagem do produto (opcional)</Label>
          <Input type="file" accept="image/*" {...register('imageFile')} />
          {errors.imageFile && (
            <p className="text-xs text-red-600 mt-1">{errors.imageFile.message as any}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : 'Cadastrar produto'}
      </Button>
    </form>
  );
}
