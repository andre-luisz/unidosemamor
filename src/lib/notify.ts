import { toast } from 'sonner';

/**
 * Wrapper simples para centralizar mensagens toast.
 * Use `notify.success()`, `notify.error()` e `notify.info()`
 * em vez de `alert()` ou `toast.*` diretos.
 */
export const notify = {
  success: (msg: string) => toast.success(msg),

  error: (err: unknown) => {
    const message =
      typeof err === 'string'
        ? err
        : (err as any)?.message || 'Ocorreu um erro inesperado.';
    toast.error(message);
  },

  info: (msg: string) => toast(msg),
};
