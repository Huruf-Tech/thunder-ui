import React from "react"
import { Link, useLocation } from "react-router"
import { IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { IconMenu2 } from "@tabler/icons-react"
import type { INavMenuItem } from "./NavMenu"

export interface IMobileMenuProps {
  items: Array<INavMenuItem>
}

export function MobileMenu({ items }: IMobileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null)
  const location = useLocation()

  // Close menu on route change
  React.useEffect(() => {
    setIsOpen(false)
    setExpandedItem(null)
  }, [location.pathname])

  const toggleExpanded = (title: string) => {
    setExpandedItem((prev) => (prev === title ? null : title))
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative z-60 text-navbar-foreground/70 hover:bg-navbar-accent hover:text-navbar-accent-foreground md:hidden"
            id="mobile-menu-trigger"
            aria-label="Toggle menu"
          />
        }
      >
        <IconMenu2 className="size-5" />
      </SheetTrigger>

      <SheetContent
        side="right"
        className="border-navbar-border bg-navbar text-navbar-foreground"
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <nav className="flex flex-col gap-1 pt-4">
          {items.map((item) => {
            const hasSubItems = item.items && item.items.length > 0
            const isExpanded = expandedItem === item.title
            const isActive = location.pathname === `/${item.path}`

            return (
              <div key={item.title} className="flex flex-col">
                {hasSubItems ? (
                  <>
                    <button
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3.5 py-3 text-left text-[0.9375rem] font-medium text-navbar-foreground/70 transition-colors hover:bg-navbar-accent hover:text-navbar-accent-foreground",
                        isActive && "bg-navbar-accent/50 font-semibold text-navbar-foreground"
                      )}
                      onClick={() => toggleExpanded(item.title)}
                    >
                      {item.icon && (
                        <item.icon className="size-4.5 shrink-0 opacity-60" />
                      )}
                      <span>{item.title}</span>
                      <IconChevronRight
                        className={cn(
                          "ml-auto size-4 opacity-40 transition-transform duration-200",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </button>

                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-200",
                        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="flex flex-col overflow-hidden pl-4">
                        <Link
                          to={item.path || "#"}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-[0.8125rem] text-navbar-foreground/60 transition-colors hover:bg-navbar-accent hover:text-navbar-accent-foreground",
                            isActive && "font-semibold text-navbar-foreground"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>All {item.title}</span>
                        </Link>
                        {item.items?.map((subItem) => {
                          const subActive =
                            location.pathname === `/${subItem.path}`
                          return (
                            <Link
                              key={subItem.title}
                              to={subItem.path || "#"}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-[0.8125rem] text-navbar-foreground/60 transition-colors hover:bg-navbar-accent hover:text-navbar-accent-foreground",
                                subActive && "font-semibold text-navbar-foreground"
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              {subItem.icon && (
                                <subItem.icon className="size-3.5 shrink-0 opacity-45" />
                              )}
                              <span>{subItem.title}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    to={item.path || "#"}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-[0.9375rem] font-medium text-navbar-foreground/70 transition-colors hover:bg-navbar-accent hover:text-navbar-accent-foreground",
                      isActive && "bg-navbar-accent/50 font-semibold text-navbar-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon && (
                      <item.icon className="size-[1.125rem] shrink-0 opacity-60" />
                    )}
                    <span>{item.title}</span>
                  </Link>
                )}
              </div>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
