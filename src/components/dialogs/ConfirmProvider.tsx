'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
};

type PromptOptions = {
  title?: string;
  description?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
};

type Ctx = {
  confirm: (opts?: ConfirmOptions) => Promise<boolean>;
  prompt: (opts?: PromptOptions) => Promise<string | null>;
};

const ConfirmCtx = createContext<Ctx | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  // ------- confirm -------
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions>({});
  const [resolveConfirm, setResolveConfirm] = useState<(v: boolean) => void>(() => () => {});

  const confirm = useCallback((opts?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmOpts(opts || {});
      setResolveConfirm(() => resolve);
      setConfirmOpen(true);
    });
  }, []);

  const handleConfirm = (ok: boolean) => {
    setConfirmOpen(false);
    resolveConfirm(ok);
  };

  // ------- prompt -------
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptOpts, setPromptOpts] = useState<PromptOptions>({});
  const [promptValue, setPromptValue] = useState('');
  const [resolvePrompt, setResolvePrompt] = useState<(v: string | null) => void>(() => () => {});

  const prompt = useCallback((opts?: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptOpts(opts || {});
      setPromptValue('');
      setResolvePrompt(() => resolve);
      setPromptOpen(true);
    });
  }, []);

  const handlePromptOk = () => {
    if (promptOpts.required && !promptValue.trim()) return;
    setPromptOpen(false);
    resolvePrompt(promptValue.trim());
  };
  const handlePromptCancel = () => {
    setPromptOpen(false);
    resolvePrompt(null);
  };

  const value = useMemo(() => ({ confirm, prompt }), [confirm, prompt]);

  return (
    <ConfirmCtx.Provider value={value}>
      {children}

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmOpts.title ?? 'Confirmar ação'}</AlertDialogTitle>
            {confirmOpts.description && (
              <AlertDialogDescription>{confirmOpts.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirm(false)}>
              {confirmOpts.cancelText ?? 'Cancelar'}
            </AlertDialogCancel>
            <AlertDialogAction
              className={confirmOpts.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => handleConfirm(true)}
            >
              {confirmOpts.confirmText ?? 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Prompt Dialog */}
      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{promptOpts.title ?? 'Digite um texto'}</DialogTitle>
            {promptOpts.description && (
              <DialogDescription>{promptOpts.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="py-2">
            <Input
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={promptOpts.placeholder ?? 'Digite aqui…'}
            />
            {promptOpts.required && !promptValue.trim() && (
              <p className="text-xs text-red-600 mt-1">Campo obrigatório.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePromptCancel}>
              {promptOpts.cancelText ?? 'Cancelar'}
            </Button>
            <Button onClick={handlePromptOk}>
              {promptOpts.confirmText ?? 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de <ConfirmProvider>');
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error('usePrompt deve ser usado dentro de <ConfirmProvider>');
  return ctx.prompt;
}
