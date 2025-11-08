// src/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/components/dialogs/ConfirmProvider";
import RealtimeNotifications from "@/components/realtime/RealtimeNotifications";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Unidos em Amor",
  description: "Doações e retiradas de alimentos — ação social",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <meta name="color-scheme" content="light dark" />
      </head>
      {/* Gradiente global + tipografia */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased ieg-gradient-bg`}>
        {/* Providers globais */}
        <ConfirmProvider>
          {/* Notificações em tempo real (admin e usuário) */}
          <RealtimeNotifications />

          {/* Container padrão para páginas */}
          <div className="min-h-dvh">
            {children}
          </div>
        </ConfirmProvider>

        {/* Toasts globais */}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
