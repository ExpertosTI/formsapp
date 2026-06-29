"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

const TITLES: Record<string, string> = {
  "/admin": "Inicio",
  "/admin/candidatos": "Candidatos",
  "/admin/empresas": "Empresas",
};

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/admin/candidatos/")) return "Perfil";
  for (const [path, title] of Object.entries(TITLES)) {
    if (pathname === path || (path !== "/admin" && pathname.startsWith(path))) return title;
  }
  return "Admin";
}

export function AdminShell({ children, tenantSlug = null }: { children: React.ReactNode; tenantSlug?: string | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-[var(--tl-bg)]">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} tenantSlug={tenantSlug} />

      <div className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06] bg-[var(--tl-surface)]/80 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex flex-col justify-center gap-1.5 w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            aria-label="Abrir menú"
          >
            <span className="block w-5 h-0.5 mx-auto bg-slate-300 rounded-full transition-transform" />
            <span className="block w-5 h-0.5 mx-auto bg-slate-300 rounded-full" />
            <span className="block w-5 h-0.5 mx-auto bg-slate-300 rounded-full transition-transform" />
          </button>
          <p className="text-sm font-semibold text-white truncate">{pageTitle(pathname)}</p>
          <div className="w-10" aria-hidden />
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div
            key={pathname}
            className="p-4 sm:p-6 lg:p-10 tl-page-enter max-w-full"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
