import { Link, useLocation } from "react-router"
import type { TablerIcon } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

export interface INavMenuItem {
  title: string
  path?: string
  icon?: TablerIcon
  items?: {
    title: string
    path?: string
    icon?: TablerIcon
  }[]
}

export interface INavMenuProps {
  items: Array<INavMenuItem>
}

export function NavMenu({ items }: INavMenuProps) {
  const location = useLocation()

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-2">
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0
          const isActive =
            location.pathname === `/${item.path}` ||
            item.items?.some((sub) => location.pathname === `/${sub.path}`)

          if (hasSubItems) {
            return (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger
                  className={cn(isActive && "text-sidebar-primary")}
                >
                  {item.icon && (
                    <item.icon className="size-5 shrink-0 opacity-70" />
                  )}
                  <span>{item.title}</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex min-w-48 flex-col gap-0.5">
                    {item.items?.map((subItem) => {
                      const subActive = location.pathname === `/${subItem.path}`
                      return (
                        <li key={subItem.title}>
                          <NavigationMenuLink
                            render={<Link to={subItem.path || "#"} />}
                            className={cn(subActive && "text-sidebar-primary")}
                          >
                            {subItem.icon && (
                              <subItem.icon className="size-5 shrink-0 opacity-55" />
                            )}
                            <span>{subItem.title}</span>
                          </NavigationMenuLink>
                        </li>
                      )
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )
          }

          return (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuLink
                render={<Link to={item.path || "/"} />}
                className={cn(isActive && "text-sidebar-primary")}
              >
                {item.icon && (
                  <item.icon className="size-5 shrink-0 opacity-70" />
                )}
                <span>{item.title}</span>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
