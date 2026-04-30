"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  AppSwitcher,
  type AppInfo,
} from "@takaki/go-design-system";
import {
  LayoutDashboard,
  Lightbulb,
  Scale,
  Settings,
  Video,
} from "lucide-react";

const UserMenu = dynamic(
  () =>
    import("@takaki/go-design-system").then((m) => ({ default: m.UserMenu })),
  { ssr: false },
);

const MAIN_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ダッシュボード" },
  { href: "/form", icon: Video, label: "フォーム" },
  { href: "/body", icon: Scale, label: "ボディ" },
];

const GO_APPS: AppInfo[] = [
  {
    name: "NativeGo",
    url: "https://english-learning-app-black.vercel.app/",
    color: "#E5484D",
  },
  {
    name: "CareGo",
    url: "https://care-go-mu.vercel.app/dashboard",
    color: "#30A46C",
  },
  {
    name: "KenyakuGo",
    url: "https://kenyaku-go.vercel.app/",
    color: "#F5A623",
  },
  { name: "TaskGo", url: "https://taskgo-dun.vercel.app/", color: "#5E6AD2" },
  {
    name: "CookGo",
    url: "https://cook-go-lovat.vercel.app/dashboard",
    color: "#1AD1A5",
  },
  {
    name: "PhysicalGo",
    url: "https://physical-go.vercel.app/dashboard",
    color: "#0891b2",
  },
  {
    name: "Design System",
    url: "https://go-design-system.vercel.app",
    color: "#6B7280",
  },
];

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export function PhysicalGoSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserProfile({
            name:
              user.user_metadata?.full_name ??
              user.email?.split("@")[0] ??
              "User",
            email: user.email ?? "",
            avatar: user.user_metadata?.avatar_url,
          });
        }
      });
    });
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-2 border-b border-sidebar-border">
        <AppSwitcher
          currentApp="PhysicalGo"
          apps={GO_APPS}
          placement="bottom"
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map(({ href, icon: Icon, label }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={isActive(href)}>
                    <Link href={href}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu
          displayName={userProfile?.name ?? "—"}
          email={userProfile?.email}
          avatarUrl={userProfile?.avatar}
          items={[
            {
              title: "コンセプト",
              icon: Lightbulb,
              onSelect: () => router.push("/concept"),
              isActive: isActive("/concept"),
            },
            {
              title: "設定",
              icon: Settings,
              onSelect: () => router.push("/settings"),
              isActive: isActive("/settings"),
            },
          ]}
          signOut={{ onSelect: handleSignOut }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
