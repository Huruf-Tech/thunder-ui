import { Link, useLocation } from "react-router"
import {
  Breadcrumb as _Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react"
import { IconBrandGoogleHome } from "@tabler/icons-react"

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
        {crumbs.map((crumb, index) => {
          return (
            <React.Fragment key={crumb + index}>
              {index === 0 ? (
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link to={"/" + crumb} replace viewTransition />}
                  >
                    <IconBrandGoogleHome className="size-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Link
                        to={"/" + crumbs.join("/")}
                        replace
                        viewTransition
                      />
                    }
                  >
                    {crumb}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}

              <BreadcrumbSeparator />
            </React.Fragment>
          )
        })}
        <BreadcrumbItem>
          <BreadcrumbPage>{parts.at(-1)}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </_Breadcrumb>
  ) : null
}
