// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // client SSR que lê/escreve cookies no middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const protectedPaths = ["/retirada", "/doacao", "/carrinho"];
  const { pathname } = req.nextUrl;

  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    // precisa estar logado
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // precisa estar aprovado
    const { data, error } = await supabase.rpc("get_my_profile_secure");
    // get_my_profile_secure() retorna TABELA => array (0 ou 1 linha)
    const profile = Array.isArray(data) ? data[0] : data;

    if (error || !profile || profile.status !== "approved") {
      const url = req.nextUrl.clone();
      url.pathname = "/aguardando-aprovacao";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/retirada/:path*", "/doacao/:path*", "/carrinho/:path*"],
};
