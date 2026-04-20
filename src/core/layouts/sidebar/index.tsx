import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { NavMenu } from "./NavMenu"
import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"
import { PageBreadcrumb } from "@/core/layouts/breadcrumb"

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
        <SidebarHeader />
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
      <main className="relative w-full overflow-x-hidden px-2 py-15">
        <div className="fixed top-0 w-full py-2 shadow bg-background">
          <SidebarTrigger className="border-foreground" />
        </div>
        <div className="mb-4">
          <PageBreadcrumb />
        </div>
        {children}
      </main>
    </SidebarProvider>
  )
}
