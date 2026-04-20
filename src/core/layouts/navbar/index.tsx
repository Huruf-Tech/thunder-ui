import { NavMenu } from "./NavMenu"
import { MobileMenu } from "./MobileMenu"
import { PageBreadcrumb } from "@/core/layouts/breadcrumb"
import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"
import { useTheme } from "@/components/theme-provider"
import { IconSun, IconMoon, IconLogout } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "react-oidc-context"
import Logo from "@/assets/Logo.svg"

const allowDisplay = (display: boolean | (() => boolean)) => {
  if (typeof display === "function") {
    return display()
  }

  return display
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()
  const { theme, setTheme } = useTheme()
  const auth = useAuth()

  const navItems = (router.routes as TRouteObject[]).flatMap((route) =>
    (route.children ?? [])
      .filter((child) => allowDisplay(child.display ?? true))
      .map((child) => ({
        title: child.name ?? "Unnamed Route",
        icon: child.icon,
        path: child.path,
        items: child.children
          ?.filter((subChild) => allowDisplay(subChild.display ?? true))
          .map((subChild) => ({
            title: subChild.name ?? "Unnamed Route",
            icon: subChild.icon,
            path: child.path && subChild.path ? `${child.path}/${subChild.path}` : subChild.path,
          })),
      }))
  )

  const handleLogout = () => {
    auth.removeUser()
    auth.revokeTokens(["refresh_token", "access_token"])
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-navbar-border bg-navbar text-navbar-foreground"
        id="main-navbar"
      >
        <div className="mx-auto flex h-13 max-w-5xl items-center gap-7 px-6">
          {/* Logo / Brand */}
          <div className="flex shrink-0 items-center gap-2.5">
            <img src={Logo} alt="Huruf Tech" className="h-7 w-auto shrink-0" />
            {/* <span className="text-[1.0625rem] font-semibold tracking-tight text-navbar-foreground text-opacity-95">
              Huruf Tech
            </span> */}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center gap-0.5 md:flex" id="desktop-nav">
            <NavMenu items={navItems} />
          </nav>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              className="text-navbar-foreground/50 hover:bg-navbar-accent hover:text-navbar-accent-foreground"
              id="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <IconSun className="size-4" />
              ) : (
                <IconMoon className="size-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              className="text-navbar-foreground/50 hover:bg-navbar-accent hover:text-navbar-accent-foreground"
              id="logout-button"
              aria-label="Logout"
            >
              <IconLogout className="size-4" />
            </Button>


            {/* Mobile Menu */}
            <MobileMenu items={navItems} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      {/* You can use Breadcrumb component here */}
      <main className="flex-1 pt-17 pb-8" id="main-content">
        <div className="mx-auto max-w-5xl px-6">
          <PageBreadcrumb />
        </div>
        {children}
      </main>
    </div>
  )
}
