'use client';
import { create } from 'zustand';
import { isCurrentUserApproved } from '@/modules/auth/profileApi.secure';


export type CartState = {
cart: Record<string, number>;
add: (id: string) => void;
remove: (id: string) => void;
clear: () => void;
count: () => number;
};

export async function finalizarRetiradaComGuard(doFinalize: () => Promise<void> | void) {
try {
const ok = await isCurrentUserApproved();
if (!ok) {
alert('Seu cadastro ainda não foi aprovado. Complete/atualize seus dados e aguarde um administrador aprovar.');
window.location.href = '/cadastro';
return;
}
// usuário aprovado — siga com a finalização original
await doFinalize();
} catch (e: any) {
alert(e?.message || 'Erro ao validar seu cadastro.');
}
}
export const useCartStore = create<CartState>((set, get) => ({
cart: {},
add: (id: string) => set(({ cart }) => ({ cart: { ...cart, [id]: (cart[id] || 0) + 1 } })),
remove: (id: string) => set(({ cart }) => {
const atual = cart[id] || 0;
if (atual <= 1) {
const { [id]: _, ...rest } = cart;
return { cart: rest } as any;
}
return { cart: { ...cart, [id]: atual - 1 } } as any;
}),
clear: () => set({ cart: {} }),
count: () => Object.values(get().cart).reduce((a, b) => a + b, 0),
}));