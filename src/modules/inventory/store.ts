'use client';
import { create } from 'zustand';
import { ITENS_INICIAIS, type Item } from '@/modules/inventory/types';

export type InventoryState = {
  itens: Item[];
  addItem: (novo: Omit<Item, 'id'>) => Item; // retorna o item criado
  increaseQuantity: (id: string, q: number) => void;
  decreaseQuantity: (id: string, q: number) => void;
  finalizeWithdrawal: (cart: Record<string, number>) => void;
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  itens: ITENS_INICIAIS,
  addItem: (novo) => {
    const state = get();
    // se já existe (nome+categoria+unidade), soma
    const idx = state.itens.findIndex(
      (i) => i.nome.toLowerCase() === novo.nome.toLowerCase() && i.categoria === novo.categoria && i.unidade === novo.unidade
    );
    if (idx >= 0) {
      const clone = [...state.itens];
      clone[idx] = { ...clone[idx], quantidade: clone[idx].quantidade + novo.quantidade, prioridade: novo.prioridade || clone[idx].prioridade };
      set({ itens: clone });
      return clone[idx];
    }
    const created: Item = { id: String(Date.now()), ...novo };
    set({ itens: [created, ...state.itens] });
    return created;
  },
  increaseQuantity: (id, q) => set(({ itens }) => ({ itens: itens.map((i) => (i.id === id ? { ...i, quantidade: i.quantidade + q } : i)) })),
  decreaseQuantity: (id, q) => set(({ itens }) => ({ itens: itens.map((i) => (i.id === id ? { ...i, quantidade: Math.max(0, i.quantidade - q) } : i)) })),
  finalizeWithdrawal: (cart) => set(({ itens }) => ({
    itens: itens.map((it) => {
      const q = cart[it.id] || 0;
      return q ? { ...it, quantidade: Math.max(0, it.quantidade - q) } : it;
    }),
  })),
}));
