import { PageBreadcrumb } from "@/core/layouts/navbar/breadcrumb"
import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"
import { useTheme } from "@/components/theme-provider"
import { IconLogout, IconMoon, IconSun } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "react-oidc-context"
import Logo from "/logo.png"
import { splitCamelCase } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocation, useNavigate } from "react-router"
import React from "react"

const allowDisplay = (display: boolean | (() => boolean)) => {
  if (typeof display === "function") {
    return display()
  }

  return display
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const auth = useAuth()

  const navItems = React.useMemo(
    () =>
      (router.routes as TRouteObject[]).flatMap((route) =>
        (route.children ?? [])
          .filter((child) => allowDisplay(child.display ?? true))
          .map((child) => ({
            title: splitCamelCase(child.name) || "Unnamed Route",
            icon: child.icon,
            path: child.path ?? "/",
            items: child.children
              ?.filter((subChild) => allowDisplay(subChild.display ?? true))
              .map((subChild) => ({
                title: splitCamelCase(subChild.name) || "Unnamed Route",
                icon: subChild.icon,
                path:
                  child.path && subChild.path
                    ? `${child.path}/${subChild.path}`
                    : subChild.path,
              })),
          }))
      ),
    [router.routes]
  )

  const handleLogout = () => {
    auth.removeUser()
    auth.revokeTokens(["refresh_token", "access_token"])
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="relative h-full min-h-svh w-full px-3">
      <header
        className="sticky top-0 z-50 mx-auto max-w-6xl rounded-b-md bg-muted/50"
        id="main-navbar"
      >
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-transparent via-border to-transparent"></div>
        <div className="mx-auto flex items-center gap-3 p-3">
          {/* Logo / Brand */}
          <div className="flex shrink-0 items-center gap-2.5">
            <img src={Logo} alt="Logo" className="h-5 w-auto shrink-0" />
            <span className="text-base font-semibold">Thunder UI</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-2">
            {navItems.map((nav) => (
              <Button
                key={nav.title}
                size="sm"
                variant={
                  location.pathname.includes(nav.path) ? "default" : "ghost"
                }
                onClick={() => navigate(nav.path, { viewTransition: true })}
              >
                {nav.title}
              </Button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-3">
            <Button
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
          </div>
        </div>

        <Tabs
          value={location.pathname.split("/").at(-1)}
          onValueChange={(path) => navigate(path, { viewTransition: true })}
        >
          <TabsList variant="line">
            {(
              navItems.filter((v) => location.pathname.includes(v.path))?.[0]
                ?.items ?? []
            ).map((nav) => (
              <TabsTrigger key={nav.title} value={nav.path}>
                {nav.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto h-full w-full max-w-6xl py-5">
        {/* You can use Breadcrumb component here */}
        <PageBreadcrumb />

        {children}
      </main>
    </div>
  )
}
