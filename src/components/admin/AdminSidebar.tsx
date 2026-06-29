"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  LogOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/admin/candidatos", label: "Candidatos", icon: Users },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen border-r border-white/[0.06] bg-[var(--tl-surface)]/60 backdrop-blur-xl">
      <div className="p-5 border-b border-white/[0.06]">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-500 shadow-glow">
            <Sparkles className="w-5 h-5 text-[var(--tl-bg)]" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white group-hover:text-teal-300 transition-colors">
              TalentoLink
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              forms.renace.tech
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all",
                active
                  ? "bg-white/[0.08] text-white border border-white/10 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Icon className={cn("w-4 h-4", active && "text-teal-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-1 border-t border-white/[0.06]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-500 rounded-xl hover:text-white hover:bg-white/[0.04]"
        >
          <ExternalLink className="w-4 h-4" />
          Sitio público
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex items-center w-full gap-3 px-3 py-2.5 text-sm text-slate-500 rounded-xl hover:text-white hover:bg-white/[0.04]"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}
