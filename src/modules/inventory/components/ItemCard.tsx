// src/modules/inventory/components/ItemCard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, PackageOpen, ShoppingCart, ShoppingBag, ShoppingCartIcon } from 'lucide-react';
import { FaCartPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import type { Item } from '@/modules/inventory/api';
import { getSignedImageUrl } from '@/modules/inventory/api';

export function ItemCard({
  item,
  onAdd,
  onRemove, // mantido se for usado em outro lugar
  inCartQty,
}: {
  item: Item;
  onAdd: () => void;
  onRemove: () => void;
  inCartQty: number;
}) {
  const esgotando = item.quantidade > 0 && item.quantidade <= 5;

  // seletor local
  const [pickQty, setPickQty] = useState(0);
  const stockLeft = Math.max(item.quantidade - inCartQty, 0);
  const canAdd = pickQty > 0 && stockLeft > 0;

  // signed url da imagem (bucket privado)
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const url = await getSignedImageUrl(item.image_url, 3600); // 1h
      if (alive) setImgSrc(url);
    })();
    return () => { alive = false; };
  }, [item.image_url]);

  function incPick() { setPickQty(q => (q + 1 > stockLeft ? q : q + 1)); }
  function decPick() { setPickQty(q => Math.max(q - 1, 0)); }
  function handleAdd() {
    if (!canAdd) return;
    for (let i = 0; i < pickQty; i++) onAdd();
    setPickQty(0);
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full flex flex-col rounded-2xl border bg-white/90 backdrop-blur shadow-sm overflow-hidden hover:shadow-md transition-all">
        {/* Imagem proporcional (sem cortar) */}
        <div className="w-full aspect-square bg-white/80 grid place-items-center p-3">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={item.nome}
              className="max-h-full max-w-full object-contain"
              onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Sem imagem
            </div>
          )}
        </div>

        <CardContent className="px-4 pt-3 pb-5 flex-1 flex flex-col">
          {/* topo: título + estoque */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[15px] leading-snug line-clamp-2">{item.nome}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="secondary" className="bg-blue-50 text-blue-800">{item.categoria}</Badge>
                {item.prioridade && <Badge>{item.prioridade}</Badge>}
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[11px] text-muted-foreground">Estoque</p>
              <p className="text-base sm:text-lg font-semibold">
                {item.quantidade}{' '}
                <span className="text-xs sm:text-sm font-normal text-muted-foreground">{item.unidade}</span>
              </p>
              {esgotando && <p className="text-[11px] text-amber-600">Esgotando</p>}
            </div>
          </div>

          <Separator className="my-3" />

          {/* info de carrinho/estoque */}
          {inCartQty > 0 && (
            <p className="text-xs text-muted-foreground">
              No carrinho: {inCartQty} • Disponível: {stockLeft}
            </p>
          )}

          {/* rodapé (sempre no fundo) */}
          <div className="mt-auto">
            {/* SAFE PADDING À DIREITA */}
            <div className="ms-card-safe pl-2 lg:pl-3 pt-2 pb-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-lg"
                  onClick={decPick}
                  disabled={pickQty === 0}
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <div className="min-w-[28px] text-center font-medium">{pickQty}</div>

                <Button
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={incPick}
                  disabled={stockLeft === 0}
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                {/* empurra o CTA pra direita mas dentro do safe area */}
                <div className="flex-1" />

                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!canAdd}
                  className="h-8 rounded-lg px-3 text-sm whitespace-nowrap shrink-0"
                >
                  <FaCartPlus size={20} color="white" />
                  Add
                </Button>
              </div>

              {/* aviso de indisponível respeitando o mesmo recuo */}
              {item.quantidade === 0 && (
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground gap-2">
                  <PackageOpen className="h-4 w-4" />
                  Indisponível — precisamos de doações
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
