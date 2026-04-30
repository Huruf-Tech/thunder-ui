import { Breadcrumb } from "@/core/layouts/shared/breadcrumb"
import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"
import { useTheme } from "@/components/theme-provider"
import {
  IconAlertCircle,
  IconArrowsExchange,
  IconDotsVertical,
  IconLogout,
  IconMenu2,
  IconMoon,
  IconNotification,
  IconSun,
  IconUserCircle,
  type TablerIcon,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "react-oidc-context"
import Logo from "/logo.png"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link, useLocation, useNavigate } from "react-router"
import React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavMenu } from "./NavMenu"
import { appName } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"
import { getMe } from "@/core/lib/api"
import { use } from "@/core/hooks/use"
import { getInitials, transformImage } from "@/core/lib/utils"

function allowDisplay(display?: boolean | (() => boolean)) {
  if (typeof display === "function") return display()
  return display ?? true
}

function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label="Toggle menu"
      onClick={toggleSidebar}
    >
      <IconMenu2 className="size-5" />
    </Button>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const auth = useAuth()
  const isMobile = useIsMobile()

  const _me = React.useMemo(() => getMe(), [])
  const { data: me } = use(_me)

  const { routes, subRoutes } = React.useMemo(() => {
    const routes: {
      title: string
      icon?: TablerIcon
      path: string
    }[] = []

    const subRoutes: {
      title: string
      icon?: TablerIcon
      path?: string
      parent?: string
    }[] = []

    for (const route of router.routes as TRouteObject[]) {
      if (!allowDisplay(route.display)) continue

      for (const child of route.children ?? []) {
        if (!allowDisplay(child.display)) continue

        const parentPath = child.path ?? "/"

        routes.push({
          title: child.name || "Unnamed Route",
          icon: child.icon || IconAlertCircle,
          path: parentPath,
        })

        for (const subChild of child.children ?? []) {
          if (!allowDisplay(subChild.display)) continue

          subRoutes.push({
            title: subChild.name || "Unnamed Route",
            icon: subChild.icon || IconAlertCircle,
            path: subChild.path,
            parent: parentPath,
          })
        }
      }
    }

    return { routes, subRoutes: Object.groupBy(subRoutes, (i) => i.parent!) }
  }, [router.routes])

  const [, activeParent, activeChild] = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const subNavItems = React.useMemo(
    () => subRoutes[activeParent],
    [activeParent, subRoutes]
  )

  const handleLogout = () => {
    auth.removeUser()
    auth.revokeTokens(["refresh_token", "access_token"])
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="ring-transparent hover:bg-transparent! data-[slot=sidebar-menu-button]:p-1.5!">
                <span className="text-base font-semibold">Main Menu</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMenu items={routes} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg grayscale">
                        <AvatarImage
                          src={transformImage(me?.image)}
                          alt={me?.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          {getInitials(me?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{me?.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {me?.email}
                        </span>
                      </div>
                      <IconDotsVertical className="ml-auto size-4" />
                    </SidebarMenuButton>
                  }
                ></DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src={transformImage(me?.image)}
                            alt={me?.name}
                          />
                          <AvatarFallback className="rounded-lg">
                            {getInitials(me?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-medium">
                            {me?.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {me?.email}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <IconUserCircle className="size-5" />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/" />}>
                      <IconArrowsExchange className="size-5" />
                      Change tenant
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <IconNotification className="size-5" />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <IconLogout className="size-5" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full w-full flex-1 flex-col">
          <div className="@container/main relative flex h-full min-h-[calc(100vh-1rem)] w-full flex-1 flex-col gap-2 rounded-xl px-3">
            <header className="mx-auto w-full max-w-6xl" id="main-navbar">
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-transparent via-border to-transparent"></div>
              <div className="mx-auto flex items-center gap-3 py-2">
                {/* Logo / Brand */}
                <div className="flex shrink-0 items-center gap-3">
                  <img src={Logo} alt="Logo" className="h-5 w-auto shrink-0" />
                  <span className="text-base font-semibold capitalize">
                    {appName()}
                  </span>
                </div>

                {/* Right Actions */}
                <div className="ml-auto flex items-center gap-3">
                  <Button
                    className="hidden sm:block"
                    onClick={toggleTheme}
                    variant="outline"
                    size="sm"
                    aria-label="Toggle theme"
                  >
                    {theme === "dark" ? (
                      <IconSun className="size-5" />
                    ) : (
                      <IconMoon className="size-5" />
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    id="logout-button"
                    aria-label="Logout"
                  >
                    <IconLogout className="size-5" /> Logout
                  </Button>

                  <SidebarTrigger />
                </div>
              </div>

              {subNavItems?.length ? (
                <Tabs
                  value={activeChild}
                  onValueChange={(path) => {
                    navigate([activeParent, path].join("/"), {
                      viewTransition: true,
                    })
                  }}
                  className="no-scrollbar overflow-x-auto mask-r-from-98%"
                >
                  <TabsList variant="line">
                    {subNavItems.map((nav) => (
                      <TabsTrigger key={nav.title} value={nav.path}>
                        {nav.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              ) : null}
            </header>

            {/* Main Content */}
            <main className="relative mx-auto flex h-full w-full max-w-6xl flex-col gap-3 py-5">
              {/* You can use Breadcrumb component here */}
              <Breadcrumb />

              {children}
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
