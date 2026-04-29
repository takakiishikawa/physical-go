"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  Dumbbell,
  Video,
  Archive,
  Scale,
  Settings,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NavAppSwitcher = dynamic(
  () => import("@/components/nav-switcher").then((m) => ({ default: m.NavAppSwitcher })),
  { ssr: false },
);

const NavSidebarLogout = dynamic(
  () => import("@/components/nav-switcher").then((m) => ({ default: m.NavSidebarLogout })),
  { ssr: false },
);

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ホーム" },
  { href: "/record", icon: Dumbbell, label: "記録" },
  { href: "/form", icon: Video, label: "フォーム" },
  { href: "/archive", icon: Archive, label: "アーカイブ" },
  { href: "/body", icon: Scale, label: "ボディ" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card shrink-0 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            PhysicalGo
          </span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border pb-3 pt-2 space-y-0.5">
        <NavAppSwitcher />
        <NavSidebarLogout />
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-12",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
