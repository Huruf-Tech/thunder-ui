import { Link, useLocation } from "react-router"
import {
  Breadcrumb as _Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { splitCamelCase } from "@/lib/utils"
import React from "react"
import { IconHome } from "@tabler/icons-react"

export function Breadcrumb() {
  const location = useLocation()

  const parts = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const crumbs = parts.slice(0, parts.length - 1)

  return parts.length > 1 ? (
    <_Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to={"/"} viewTransition />}>
            <IconHome className="size-5" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {crumbs.map((crumb, index) => {
          const name = splitCamelCase(crumb)
          return (
            <>
              <BreadcrumbItem key={index}>
                <BreadcrumbLink
                  render={<Link to={crumbs.join("/")} viewTransition />}
                >
                  {name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )
        })}
        <BreadcrumbItem>
          <BreadcrumbPage>{splitCamelCase(parts.at(-1))}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </_Breadcrumb>
  ) : null
}
