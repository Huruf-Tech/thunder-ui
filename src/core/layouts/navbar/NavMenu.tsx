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
  navigationMenuTriggerStyle,
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
      <NavigationMenuList>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0
          const isActive =
            location.pathname === `/${item.path}` ||
            item.items?.some((sub) => location.pathname === `/${sub.path}`)

          if (hasSubItems) {
            return (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger
                  className={cn(
                    "bg-transparent text-navbar-foreground/70 hover:bg-navbar-accent hover:text-navbar-accent-foreground data-popup-open:bg-navbar-accent/50 data-open:bg-navbar-accent/50",
                    isActive && "font-semibold text-navbar-foreground"
                  )}
                >
                  {item.icon && (
                    <item.icon className="size-4 shrink-0 opacity-70" />
                  )}
                  <span>{item.title}</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-navbar text-navbar-foreground ring-navbar-border">
                  <ul className="flex min-w-48 flex-col gap-0.5">
                    {item.items?.map((subItem) => {
                      const subActive =
                        location.pathname === `/${subItem.path}`
                      return (
                        <li key={subItem.title}>
                          <NavigationMenuLink
                            render={<Link to={subItem.path || "#"} />}
                            className={cn(
                              "text-navbar-foreground/70 hover:bg-navbar-accent hover:text-navbar-accent-foreground",
                              subActive &&
                                "bg-navbar-accent font-semibold text-navbar-foreground"
                            )}
                          >
                            {subItem.icon && (
                              <subItem.icon className="size-4 shrink-0 opacity-55" />
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
                render={<Link to={item.path || "#"} />}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "bg-transparent text-navbar-foreground/70 hover:bg-navbar-accent hover:text-navbar-accent-foreground",
                  isActive && "font-semibold text-navbar-foreground"
                )}
              >
                {item.icon && (
                  <item.icon className="size-4 shrink-0 opacity-70" />
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
