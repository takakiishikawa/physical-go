"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Video,
  Archive,
  Scale,
  Settings,
  Activity,
  ChevronUp,
  LayoutGrid,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@takaki/go-design-system";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ホーム" },
  { href: "/record", icon: Dumbbell, label: "記録" },
  { href: "/form", icon: Video, label: "フォーム" },
  { href: "/archive", icon: Archive, label: "アーカイブ" },
  { href: "/body", icon: Scale, label: "ボディ" },
  { href: "/settings", icon: Settings, label: "設定" },
];

const goApps = [
  {
    name: "NativeGo",
    url: "https://english-learning-app-black.vercel.app/",
    color: "var(--color-red-9)",
  },
  {
    name: "CareGo",
    url: "https://care-go-mu.vercel.app/dashboard",
    color: "var(--color-green-9)",
  },
  {
    name: "KenyakuGo",
    url: "https://kenyaku-go.vercel.app/",
    color: "var(--color-amber-9)",
  },
  {
    name: "TaskGo",
    url: "https://taskgo-dun.vercel.app/",
    color: "var(--color-indigo-9)",
  },
  {
    name: "CookGo",
    url: "https://cook-go-lovat.vercel.app/dashboard",
    color: "var(--color-teal-9)",
  },
  {
    name: "PhysicalGo",
    url: "https://physical-go.vercel.app/dashboard",
    color: "var(--color-red-9)",
  },
];

const CURRENT_APP = "PhysicalGo";

function AppSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative px-3 pb-2">
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          open
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        <LayoutGrid className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Goシリーズ</span>
        <ChevronUp
          className={cn(
            "w-3.5 h-3.5 transition-transform",
            !open && "rotate-180",
          )}
        />
      </Button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              アプリ切り替え
            </p>
          </div>
          <div className="py-1">
            {goApps.map((app) => {
              const isCurrent = app.name === CURRENT_APP;
              return isCurrent ? (
                <div
                  key={app.name}
                  className="flex items-center gap-2.5 px-3 py-2 bg-muted/60 cursor-default"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: app.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {app.name}
                  </span>
                  <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                    現在
                  </span>
                </div>
              ) : (
                <a
                  key={app.name}
                  href={app.url}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: app.color }}
                  />
                  <span className="text-sm">{app.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
        <AppSwitcher />
        <SidebarLogout />
      </div>
    </aside>
  );
}

function SidebarLogout() {
  const router = useRouter();
  const handleSignOut = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };
  return (
    <div className="px-3">
      <Button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        ログアウト
      </Button>
    </div>
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
