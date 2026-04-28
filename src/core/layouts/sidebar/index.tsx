import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { NavMenu } from "./NavMenu"
import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"
import { PageBreadcrumb } from "@/core/layouts/sidebar/breadcrumb"
import Logo from "/logo.png"
import { Link } from "react-router"

const allowDisplay = (display: boolean | (() => boolean)) => {
  if (typeof display === "function") {
    return display()
  }

  return display
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="data-[slot=sidebar-menu-button]:p-1.5!"
                render={<Link to="/" />}
              >
                <img src={Logo} alt="Logo" className="h-5 w-auto shrink-0" />
                <span className="text-base font-semibold">Thunder UI</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {(router.routes as TRouteObject[]).map((route) => (
            <NavMenu
              key={route.name}
              name={route.name ?? "Unnamed Route"}
              items={route.children
                ?.filter((route) => allowDisplay(route.display ?? true))
                .map((child) => ({
                  title: child.name ?? "Unnamed Route",
                  icon: child.icon,
                  path: child.path,
                  items: child.children
                    ?.filter((subChild) =>
                      allowDisplay(subChild.display ?? true)
                    )
                    .map((subChild) => ({
                      title: subChild.name ?? "Unnamed Route",
                      icon: subChild.icon,
                      path: subChild.path,
                    })),
                }))}
            />
          ))}
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <main className="relative h-full w-full">
        <div className="container mx-auto flex max-w-6xl flex-col gap-4 p-3">
          <SidebarTrigger
            variant="secondary"
            size="icon-lg"
            className="border border-border [&_svg]:size-5!"
          />
          <PageBreadcrumb />
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
