import {
  IconChevronRight as ChevronRight,
  IconAlertCircle,
  type TablerIcon,
} from "@tabler/icons-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export interface INavMenuItem {
  title: string
  path?: string
  icon?: TablerIcon
  isActive?: boolean
  items?: {
    title: string
    path?: string
  }[]
}

export interface INavMenuProps {
  name?: string
  items?: Array<INavMenuItem>
  onChange?: (path: string) => void
}

export function NavMenu({ name, items, onChange }: INavMenuProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {name && <SidebarGroupLabel>{name}</SidebarGroupLabel>}
        <SidebarMenu>
          {items?.map((item, idx) =>
            item.items?.length ? (
              <Collapsible
                key={item.title + idx}
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        is="div"
                        tooltip={item.title}
                        size="lg"
                      >
                        {item.icon ? <item.icon /> : <IconAlertCircle />}
                        <span>{item.title}</span>
                        <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    }
                  />
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem, subIdx) => (
                        <SidebarMenuSubItem key={subItem.title + subIdx}>
                          <SidebarMenuSubButton
                            render={
                              <Button
                                variant="ghost"
                                className="justify-start"
                                onClick={() => {
                                  if (isMobile) setOpenMobile(false)
                                  onChange?.(subItem.path || "#")
                                }}
                              >
                                <span>{subItem.title}</span>
                              </Button>
                            }
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title + idx}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={item.isActive}
                  render={
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        if (isMobile) setOpenMobile(false)
                        onChange?.(item.path || "#")
                      }}
                    >
                      {item.icon ? <item.icon /> : <IconAlertCircle />}
                      <span>{item.title}</span>
                    </Button>
                  }
                ></SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
