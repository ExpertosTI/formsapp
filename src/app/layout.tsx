import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RENACE Forms — Plataforma de Formularios",
  description: "Soluciones tecnológicas para la gestión empresarial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#0f172a] text-slate-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}
