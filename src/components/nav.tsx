"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Video,
  Archive,
  Scale,
  Settings,
  Activity,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GO_APPS = [
  { name: "MetaGo", url: "https://metago.vercel.app/" },
  { name: "NativeGo", url: "https://english-learning-app-black.vercel.app/" },
  { name: "CareGo", url: "https://care-go-mu.vercel.app/dashboard" },
  { name: "KenyakuGo", url: "https://kenyaku-go.vercel.app/" },
  { name: "CookGo", url: "https://cook-go-lovat.vercel.app/dashboard" },
  { name: "PhysicalGo", url: "https://physical-go.vercel.app/dashboard" },
  { name: "TaskGo", url: "https://taskgo-dun.vercel.app/" },
];

function NavAppSwitcher() {
  return (
    <div className="px-3 py-1.5">
      <p className="text-xs font-medium text-muted-foreground mb-1">Apps</p>
      <div className="flex flex-wrap gap-1">
        {GO_APPS.map((app) => (
          <a
            key={app.name}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {app.name}
          </a>
        ))}
      </div>
    </div>
  );
}

function NavSidebarLogout() {
  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <LogOut className="w-4 h-4 shrink-0" />
      ログアウト
    </button>
  );
}

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