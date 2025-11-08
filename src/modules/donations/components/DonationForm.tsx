'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIAS, type Categoria } from "@/modules/inventory/types";

export type DonationInput = {
  nome: string;
  categoria: Categoria;
  unidade: string;
  quantidade: number;
  prioridade?: "Baixa" | "Média" | "Alta";
};

export function DonationForm({ onDonate }: { onDonate: (novo: DonationInput) => void }) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Grãos");
  const [unidade, setUnidade] = useState("unid");
  const [quantidade, setQuantidade] = useState(1);
  const [prioridade, setPrioridade] = useState<"Baixa" | "Média" | "Alta" | "">("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || quantidade <= 0) return;
    onDonate({
      nome,
      categoria,
      unidade,
      quantidade,
      prioridade: prioridade || undefined,
    });
    // reset
    setNome("");
    setQuantidade(1);
    setUnidade("unid");
    setCategoria("Grãos");
    setPrioridade("");
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Nome do item</Label>
          <Input
            placeholder="Ex.: Arroz integral"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div>
          <Label>Categoria</Label>
          <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Unidade</Label>
          <Input
            placeholder="Ex.: kg, unid, L"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
          />
        </div>

        <div>
          <Label>Quantidade</Label>
          <Input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value || "0", 10))}
          />
        </div>

        <div>
          <Label>Prioridade (opcional)</Label>
          <Select
            value={prioridade === "" ? "none" : prioridade}
            onValueChange={(v) => setPrioridade(v === "none" ? "" : (v as any))}
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
      </div>

      <Button type="submit">Cadastrar doação</Button>
      <p className="text-xs text-muted-foreground">
        Ao doar, você concorda com o uso comunitário e gratuito dos itens.
      </p>
    </form>
  );
}
