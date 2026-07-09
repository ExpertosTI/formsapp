"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

const STORAGE_KEY = "tl-admin-nav";

const TITLES: Record<string, string> = {
  "/admin": "Inicio",
  "/admin/candidatos": "Candidatos",
  "/admin/empresas": "Empresas",
  "/admin/mi-empresa": "Mi empresa",
  "/admin/estadisticas": "Estadísticas",
  "/admin/entrevistas": "Entrevistas",
};

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/admin/candidatos/")) return "Perfil";
  if (pathname.startsWith("/admin/empresas/") && pathname !== "/admin/empresas") return "Personalizar";
  for (const [path, title] of Object.entries(TITLES)) {
    if (pathname === path || (path !== "/admin" && pathname.startsWith(path))) return title;
  }
  return "Admin";
}

export function AdminShell({ children, tenantSlug = null }: { children: React.ReactNode; tenantSlug?: string | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "closed") setDesktopOpen(false);
    setHydrated(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleDesktop = useCallback(() => {
    setDesktopOpen((open) => {
      const next = !open;
      localStorage.setItem(STORAGE_KEY, next ? "open" : "closed");
      return next;
    });
  }, []);

  const openMenu = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setDesktopOpen(true);
      localStorage.setItem(STORAGE_KEY, "open");
    } else {
      setMobileOpen(true);
    }
  }, []);

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-[var(--tl-bg)]">
      <AdminSidebar
        mobileOpen={mobileOpen}
        desktopOpen={hydrated ? desktopOpen : true}
        onClose={() => setMobileOpen(false)}
        onCollapseDesktop={toggleDesktop}
        tenantSlug={tenantSlug}
      />

      <div className="flex flex-col flex-1 min-w-0 w-full">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[var(--tl-surface)]/90 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={openMenu}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
            aria-label="Abrir menú"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <p className="text-sm font-semibold text-white truncate">{pageTitle(pathname)}</p>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div key={pathname} className="p-4 sm:p-6 lg:p-8 xl:p-10 tl-page-enter w-full max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
