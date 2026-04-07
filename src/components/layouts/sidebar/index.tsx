import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { NavMenu } from "./NavMenu"
import { useLayout } from "@/components/layouts/layout-provider"
import type { TablerIcon } from "@tabler/icons-react"
import type { RouteObject } from "react-router"

export type TRouteObject = {
  name?: string
  icon?: TablerIcon
  display?: boolean | (() => boolean)
  children?: TRouteObject[]
} & RouteObject

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
      <main className="w-full overflow-x-hidden">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
