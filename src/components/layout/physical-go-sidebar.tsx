"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
  Dumbbell,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Scale,
  Settings,
  Video,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const MAIN_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ダッシュボード" },
  { href: "/record",    icon: Dumbbell,        label: "記録" },
  { href: "/form",      icon: Video,           label: "フォーム" },
  { href: "/body",      icon: Scale,           label: "ボディ" },
]

const FOOTER_NAV = [
  { href: "/concept",   icon: Lightbulb,       label: "コンセプト" },
  { href: "/settings",  icon: Settings,        label: "設定" },
]

const GO_APPS: AppInfo[] = [
  { name: "NativeGo",      url: "https://english-learning-app-black.vercel.app/", color: "#E5484D" },
  { name: "CareGo",        url: "https://care-go-mu.vercel.app/dashboard",        color: "#30A46C" },
  { name: "KenyakuGo",     url: "https://kenyaku-go.vercel.app/",                 color: "#F5A623" },
  { name: "TaskGo",        url: "https://taskgo-dun.vercel.app/",                 color: "#5E6AD2" },
  { name: "CookGo",        url: "https://cook-go-lovat.vercel.app/dashboard",     color: "#1AD1A5" },
  { name: "PhysicalGo",    url: "https://physical-go.vercel.app/dashboard",       color: "#0052CC" },
  { name: "Design System", url: "https://go-design-system.vercel.app",            color: "#6B7280" },
]

interface UserProfile {
  name: string
  email: string
  avatar?: string
}

export function PhysicalGoSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserProfile({
          name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
          email: user.email ?? '',
          avatar: user.user_metadata?.avatar_url,
        })
      }
    })
  }, [])

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
        <SidebarMenu>
          {FOOTER_NAV.map(({ href, icon: Icon, label }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton asChild isActive={isActive(href)}>
                <Link href={href}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {userProfile && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/settings" className="flex items-center gap-2.5">
                  {userProfile.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary">
                        {userProfile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{userProfile.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{userProfile.email}</p>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
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
