"use client";

import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/**
 * Pergunta ao banco (RPC) se o usuário está "approved".
 * Usa a função SQL: public.is_current_user_approved()
 */
export async function isUserApproved(): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("is_current_user_approved");

  if (error) {
    console.error("Erro ao checar aprovação:", error);
    // por segurança, considere não aprovado se deu erro
    return false;
  }
  return Boolean(data);
}

/**
 * Guard que bloqueia a retirada caso o status do perfil
 * não seja "approved". Se aprovado, executa a ação passada.
 *
 * Exemplo de uso:
 * await finalizarRetiradaComGuard(() => doFinalize());
 */
export async function finalizarRetiradaComGuard(
  onApproved: () => Promise<void> | void,
  opts?: {
    onBlockedNavigateTo?: string; // rota para redirecionar quando bloqueado
    messageBlocked?: string;      // mensagem quando bloqueado
  }
) {
  const redirect = opts?.onBlockedNavigateTo ?? "/cadastro";
  const message =
    opts?.messageBlocked ??
    "Seu cadastro ainda não foi aprovado. Complete/atualize os dados para continuar.";

  const approved = await isUserApproved();
  if (!approved) {
    toast.warning(message);
    // redireciona para a tela de cadastro
    // como não temos o router aqui, usamos um push "manual"
    window.location.href = redirect;
    return;
  }

  // ok, pode finalizar
  await onApproved();
}
