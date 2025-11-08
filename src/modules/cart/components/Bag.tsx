'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { fetchItems, type Item, getSignedImageUrl } from '@/modules/inventory/api';

type BagProps = {
  cart: Record<string, number>;
  setCart: (v: Record<string, number>) => void;
  onFinalizar: () => void;
};

export default function Bag({ cart, setCart, onFinalizar }: BagProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [images, setImages] = useState<Record<string, string | null>>({}); // itemId -> signed url

  useEffect(() => {
    fetchItems().then(setItems).catch(console.error);
  }, []);

  useEffect(() => {
    const load = async () => {
      const map: Record<string, string | null> = {};
      for (const id of Object.keys(cart)) {
        const it = items.find((x) => x.id === id);
        map[id] = it?.image_url ? await getSignedImageUrl(it.image_url) : null;
      }
      setImages(map);
    };
    if (items.length) load();
  }, [cart, items]);

  const lines = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const item = items.find((i) => i.id === id);
        return item ? { item, qty } : null;
      })
      .filter(Boolean) as { item: Item; qty: number }[];
  }, [cart, items]);

  function inc(id: string) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const atual = cart[id] || 0;
    if (atual >= it.quantidade) return;
    setCart({ ...cart, [id]: atual + 1 });
  }

  function dec(id: string) {
    const atual = cart[id] || 0;
    if (atual <= 1) {
      const { [id]: _, ...rest } = cart;
      setCart(rest);
    } else {
      setCart({ ...cart, [id]: atual - 1 });
    }
  }

  function clear() {
    setCart({});
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-12 rounded-full shadow-lg">
          <ShoppingCart className="mr-2 h-5 w-5" />
          {lines.length > 0 ? `${lines.length} item(ns)` : 'Minha sacola'}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>Minha sacola ({lines.length})</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {lines.length === 0 && (
            <p className="text-sm text-muted-foreground">Sua sacola está vazia.</p>
          )}

          {lines.map(({ item, qty }) => {
            const imgSrc = images[item.id] ?? null;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm ring-1 ring-blue-100/50"
              >
                <div className="aspect-square h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={item.nome}
                      className="h-full w-full object-cover"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      Sem imagem
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Estoque: {item.quantidade} {item.unidade}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => dec(item.id)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-6 text-center text-sm font-medium">{qty}</div>
                  <Button size="icon" onClick={() => inc(item.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {lines.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={clear}>
                Limpar sacola
              </Button>
              <Button onClick={onFinalizar}>Finalizar retirada</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
