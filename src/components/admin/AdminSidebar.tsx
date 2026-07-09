"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  LogOut,
  ExternalLink,
  X,
  BarChart3,
  Palette,
  PanelLeftClose,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TalentoLinkLogo } from "@/components/brand/TalentoLinkLogo";

const navSuper = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true as const },
  { href: "/admin/candidatos", label: "Candidatos", icon: Users, exact: false as const },
  { href: "/admin/entrevistas", label: "Entrevistas", icon: CalendarDays, exact: false as const },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3, exact: false as const },
  { href: "/admin/empresas", label: "Empresas", icon: Building2, exact: false as const },
];

const navTenant = (slug: string) => [
  { href: `/admin/candidatos?empresa=${slug}`, label: "Mis candidatos", icon: Users, exact: false as const },
  { href: "/admin/entrevistas", label: "Entrevistas", icon: CalendarDays, exact: false as const },
  { href: `/admin/estadisticas?empresa=${slug}`, label: "Estadísticas", icon: BarChart3, exact: false as const },
  { href: "/admin/mi-empresa", label: "Mi empresa", icon: Palette, exact: true as const },
  { href: `/forms/${slug}`, label: "Mi formulario", icon: ExternalLink, exact: true as const, external: true as const },
];

interface Props {
  mobileOpen?: boolean;
  desktopOpen?: boolean;
  onClose?: () => void;
  onCollapseDesktop?: () => void;
  tenantSlug?: string | null;
}

export function AdminSidebar({
  mobileOpen = false,
  desktopOpen = true,
  onClose,
  onCollapseDesktop,
  tenantSlug = null,
}: Props) {
  const pathname = usePathname();
  const nav = tenantSlug ? navTenant(tenantSlug) : navSuper;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-tl-fade-in lg:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={cn(
          "flex flex-col w-64 shrink-0 border-r border-white/[0.06] bg-[var(--tl-surface)]/98 backdrop-blur-xl",
          "fixed inset-y-0 left-0 z-50 min-h-[100dvh] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "lg:relative lg:translate-x-0 lg:min-h-screen",
          mobileOpen ? "translate-x-0 shadow-2xl shadow-black/50" : "-translate-x-full",
          desktopOpen ? "lg:flex" : "lg:hidden",
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <Link href="/admin" className="group min-w-0" onClick={onClose}>
            <TalentoLinkLogo size="md" />
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onCollapseDesktop}
              className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Ocultar menú"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const { href, label, icon: Icon, exact } = item;
            const external = "external" in item && item.external;
            const path = href.split("?")[0];
            const isActive = exact
              ? pathname === path
              : pathname === path || pathname.startsWith(`${path}/`);

            const linkProps = external ? { target: "_blank" as const, rel: "noopener noreferrer" } : {};

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                {...linkProps}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl",
                  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isActive
                    ? "text-white bg-white/[0.08] border border-white/10 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent",
                )}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-teal-400 to-indigo-400"
                    aria-hidden
                  />
                )}
                <Icon
                  className={cn("w-4 h-4 shrink-0 transition-colors duration-300", isActive && "text-teal-400")}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 space-y-1 border-t border-white/[0.06]">
          <Link
            href="/"
            target="_blank"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-500 rounded-xl hover:text-white hover:bg-white/[0.04] transition-all duration-300"
          >
            <ExternalLink className="w-4 h-4" />
            Sitio público
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center w-full gap-3 px-3 py-2.5 text-sm text-slate-500 rounded-xl hover:text-white hover:bg-white/[0.04] transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
