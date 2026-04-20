import { Link, useMatches } from "react-router"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface RouteHandle {
  name?: string
}


function formatSegment(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function PageBreadcrumb() {
  const matches = useMatches()

  const crumbs = matches
    .filter((_match, index) => {
      // Skip root and layout routes that don't add value
      if (index === 0) return false
      return true
    })
    .map((match) => {
      const handle = match.handle as RouteHandle | undefined
      const rawName =
        handle?.name ||
        match.pathname
          .split("/")
          .filter(Boolean)
          .pop() ||
        ""

      return {
        name: formatSegment(rawName),
        path: match.pathname,
      }
    })
    .filter((crumb, index, arr) => {
      if (!crumb.name) return false
      if (index === 0) return true
      // Prevent duplicate paths and duplicate names (e.g. projects -> projects)
      return (
        crumb.path !== arr[index - 1].path &&
        crumb.name.toLowerCase() !== arr[index - 1].name.toLowerCase()
      )
    })

  if (crumbs.length < 1) return null

  return (
    <Breadcrumb className="mb-4 bg-breadcrumb text-breadcrumb-foreground" id="page-breadcrumb">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1

          return (
            <span key={crumb.path + index} className="contents">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link to={crumb.path} />}
                  >
                    {crumb.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
