"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
} from "@takaki/go-design-system"
import {
  Archive,
  Dumbbell,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Scale,
  Settings,
  Video,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ホーム" },
  { href: "/record",    icon: Dumbbell,        label: "記録" },
  { href: "/form",      icon: Video,           label: "フォームチェック" },
  { href: "/archive",   icon: Archive,         label: "アーカイブ" },
  { href: "/body",      icon: Scale,           label: "ボディ" },
  { href: "/concept",   icon: Lightbulb,       label: "コンセプト" },
  { href: "/settings",  icon: Settings,        label: "設定" },
]

const GO_APPS: AppInfo[] = [
  { name: "NativeGo",      url: "https://english-learning-app-black.vercel.app/", color: "#E5484D" },
  { name: "CareGo",        url: "https://care-go-mu.vercel.app/dashboard",        color: "#30A46C" },
  { name: "KenyakuGo",     url: "https://kenyaku-go.vercel.app/",                 color: "#F5A623" },
  { name: "TaskGo",        url: "https://taskgo-dun.vercel.app/",                 color: "#5E6AD2" },
  { name: "CookGo",        url: "https://cook-go-lovat.vercel.app/dashboard",     color: "#1AD1A5" },
  { name: "PhysicalGo",    url: "https://physical-go.vercel.app/dashboard",       color: "#DC2626" },
  { name: "Design System", url: "https://go-design-system.vercel.app",            color: "#6B7280" },
]

export function PhysicalGoSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <Sidebar>
      {/* App switcher at the TOP of the sidebar */}
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
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
