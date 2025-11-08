export const dynamic = 'force-dynamic';

export default function AguardandoAprovacaoPage() {
  return (
    <div className="min-h-dvh px-4 sm:px-8 py-16">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold">Conta em análise 🕓</h1>
        <p className="text-muted-foreground">
          Após concluir seu cadastro em <strong>“Meu Cadastro”</strong>, suas informações serão enviadas para análise.
  Assim que for <strong>aprovado por um administrador</strong>, você poderá <strong>realizar doações e retiradas</strong> normalmente.
        </p>
        <p className="text-sm text-muted-foreground">
          Se você <strong>acabou de atualizar seus dados</strong>, tente <strong>sair e entrar novamente</strong> no sistema.
Caso <strong>ainda não tenha feito isso</strong>, acesse <strong>“Meu Cadastro”</strong> para atualizar suas informações.
        </p>
      </div>
    </div>
  );
}
