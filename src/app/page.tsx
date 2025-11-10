'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { SearchBar } from '@/modules/inventory/components/SearchBar';
import { ItemCard } from '@/modules/inventory/components/ItemCard';
import Bag from '@/modules/cart/components/Bag';
import { fetchItems, subscribeItems, type Item, type Categoria } from '@/modules/inventory/api';
import { requestWithdrawal } from '@/modules/withdrawals/api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/dialogs/ConfirmProvider';

export default function HomePage() {
  const [itens, setItens] = useState<Item[]>([]);
  const [filtro, setFiltro] = useState('');
  const [cat, setCat] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const confirm = useConfirm();

  useEffect(() => {
    let mounted = true;

    // carga inicial
    fetchItems()
      .then((data) => {
        if (mounted) setItens(data);
      })
      .catch((e) => {
        console.error(e);
        toast.error(e?.message || 'Falha ao carregar itens');
      });

    // realtime: reconsulta a lista quando houver mudanças
    const stop = subscribeItems(() =>
      fetchItems()
        .then((data) => {
          if (mounted) setItens(data);
        })
        .catch(console.error)
    );

    // cleanup SEM Promise
    return () => {
      mounted = false;
      if (typeof stop === 'function') {
        const maybePromise = stop();
        // se for uma promise, apenas ignore
        if (maybePromise && typeof (maybePromise as any).then === 'function') {
          void maybePromise;
        }
      }
    };
  }, []);

  const visiveis = useMemo(() => {
    return itens.filter((i) => {
      const matchNome = i.nome.toLowerCase().includes(filtro.toLowerCase());
      const matchCat = cat ? i.categoria === (cat as Categoria) : true;
      return matchNome && matchCat;
    });
  }, [itens, filtro, cat]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  function addToCart(id: string) {
    const item = itens.find((x) => x.id === id);
    if (!item || item.quantidade <= 0) {
      toast.info('Sem estoque disponível para este item.');
      return;
    }
    const atual = cart[id] || 0;
    if (atual >= item.quantidade) {
      toast.info('Você já atingiu o máximo disponível em estoque.');
      return;
    }
    setCart({ ...cart, [id]: atual + 1 });
  }

  function removeFromCart(id: string) {
    const atual = cart[id] || 0;
    if (atual <= 1) {
      const { [id]: _, ...rest } = cart;
      setCart(rest);
    } else {
      setCart({ ...cart, [id]: atual - 1 });
    }
  }

  async function onFinalizar() {
    const cartCountNow = Object.values(cart).reduce((a, b) => a + b, 0);
    if (cartCountNow === 0) {
      toast.warning('Seu carrinho está vazio.');
      return;
    }

    const ok = await confirm({
      title: 'Enviar pedido?',
      description: 'Seu pedido será enviado para aprovação do administrador.',
      confirmText: 'Enviar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;

    const payload = Object.entries(cart).map(([item_id, quantity]) => ({ item_id, quantity }));

    await toast.promise(
      (async () => {
        await requestWithdrawal(payload);
        setCart({});
        const fresh = await fetchItems();
        setItens(fresh);
      })(),
      {
        loading: 'Enviando pedido…',
        success: 'Pedido enviado! Aguarde a aprovação do administrador.',
        error: (e) => e?.message || 'Erro ao enviar pedido',
      }
    );
  }

  return (
    <div className="min-h-dvh px-4 sm:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header modo="retirar" cartCount={cartCount} />

        <SearchBar filtro={filtro} setFiltro={setFiltro} categoria={cat} setCategoria={setCat} />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visiveis.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              inCartQty={cart[item.id] || 0}
              onAdd={() => addToCart(item.id)}
              onRemove={() => removeFromCart(item.id)}
            />
          ))}
        </div>

        {visiveis.length === 0 && (
          <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
            Nenhum item encontrado para sua busca.
          </div>
        )}
      </div>

      {/* Drawer flutuante do carrinho (botão + painel) */}
      <Bag cart={cart} setCart={setCart} onFinalizar={onFinalizar} />
    </div>
  );
}
