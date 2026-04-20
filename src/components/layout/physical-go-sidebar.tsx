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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@takaki/go-design-system"
import {
  Activity,
  Archive,
  Check,
  ChevronsUpDown,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Scale,
  Settings,
  Video,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ホーム" },
  { href: "/record",    icon: Dumbbell,        label: "記録" },
  { href: "/form",      icon: Video,           label: "フォーム" },
  { href: "/archive",   icon: Archive,         label: "アーカイブ" },
  { href: "/body",      icon: Scale,           label: "ボディ" },
  { href: "/settings",  icon: Settings,        label: "設定" },
]

const GO_APPS = [
  { name: "NativeGo",      url: "https://english-learning-app-black.vercel.app/", color: "#E5484D" },
  { name: "CareGo",        url: "https://care-go-mu.vercel.app/dashboard",        color: "#30A46C" },
  { name: "KenyakuGo",     url: "https://kenyaku-go.vercel.app/",                 color: "#F5A623" },
  { name: "TaskGo",        url: "https://taskgo-dun.vercel.app/",                 color: "#5E6AD2" },
  { name: "CookGo",        url: "https://cook-go-lovat.vercel.app/dashboard",     color: "#1AD1A5" },
  { name: "PhysicalGo",    url: "https://physical-go.vercel.app/dashboard",       color: "#DC2626" },
  { name: "Design System", url: "https://go-design-system.vercel.app",            color: "#6B7280" },
]

const CURRENT_APP = "PhysicalGo"

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
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-primary shrink-0" />
          <span className="font-semibold text-sm tracking-tight">PhysicalGo</span>
        </Link>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <span
                    className="shrink-0 rounded-full"
                    style={{ width: 10, height: 10, backgroundColor: "#DC2626" }}
                    aria-hidden
                  />
                  <div className="flex flex-col gap-0.5 leading-none min-w-0">
                    <span className="text-[10px] text-muted-foreground">App</span>
                    <span className="font-semibold truncate">PhysicalGo</span>
                  </div>
                  <ChevronsUpDown className="ml-auto shrink-0 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-52"
                align="start"
                side="top"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Goシリーズ
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {GO_APPS.map((app) => (
                  <DropdownMenuItem
                    key={app.name}
                    onSelect={() => { window.location.href = app.url }}
                    className="gap-2"
                  >
                    <span
                      className="shrink-0 rounded-full"
                      style={{ width: 8, height: 8, backgroundColor: app.color }}
                      aria-hidden
                    />
                    <span className="flex-1">{app.name}</span>
                    {app.name === CURRENT_APP && (
                      <Check className="size-4 shrink-0 opacity-70" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

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
