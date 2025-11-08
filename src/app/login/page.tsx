'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Send, RotateCw } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'enter' | 'sent'>('enter');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = '/';
    });
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function startCountdown() {
    setSeconds(60);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function sendMagicLink(ev?: React.FormEvent) {
    ev?.preventDefault();
    if (!email) {
      toast.warning('Informe seu e-mail');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          // callback do Supabase Auth Route Handler / pages / callback
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message || 'Falha ao enviar link');
        return;
      }

      setStep('sent');
      startCountdown();
      toast.success('Enviamos um link mágico para o seu e-mail ✉️');
    } catch (e: any) {
      toast.error(e?.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh px-4 sm:px-8 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Header modo="retirar" />

        <Card className="rounded-2xl border-0 shadow-sm ring-1 ring-blue-100/60 overflow-hidden">
          {/* Top bar com gradiente */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400" />

          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-blue-950">Entrar</h2>
              <p className="text-sm text-muted-foreground">
                Use seu e-mail para receber um <b>link mágico</b> e acessar.
              </p>
            </div>

            {step === 'enter' ? (
              <form onSubmit={sendMagicLink} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 rounded-xl"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl bg-blue-600 hover:bg-blue-600/90 text-white"
                >
                  {loading ? (
                    <>
                      <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar link de acesso
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl bg-blue-50 text-blue-900 ring-1 ring-blue-100 px-4 py-3">
                  <p className="text-sm">
                    Enviamos um link de acesso para <b>{email}</b>.
                  </p>
                  <p className="text-xs opacity-80">
                    Abra o e-mail e clique no link para entrar. Se não aparecer, verifique a caixa de spam.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Não recebeu?</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={seconds > 0 || loading}
                    onClick={sendMagicLink}
                    className="rounded-full"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Reenviar {seconds > 0 ? `(${seconds}s)` : ''}
                  </Button>

                  <span className="text-muted-foreground">ou</span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('enter')}
                    className="rounded-full"
                  >
                    Usar outro e-mail
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <a
                    className="rounded-xl border bg-white px-3 py-2 text-center hover:bg-slate-50"
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir Gmail
                  </a>
                  <a
                    className="rounded-xl border bg-white px-3 py-2 text-center hover:bg-slate-50"
                    href="https://outlook.live.com/mail/0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir Outlook
                  </a>
                  <a
                    className="rounded-xl border bg-white px-3 py-2 text-center hover:bg-slate-50"
                    href="https://mail.yahoo.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir Yahoo Mail
                  </a>
                </div>

                <p className="text-xs text-muted-foreground">
                  Dica: se o provedor estiver enviando também um código, você pode ignorar — aqui usamos apenas o{' '}
                  <b>link mágico</b>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
