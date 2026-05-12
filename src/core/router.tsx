import { Navigate, Outlet } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { IconLayoutGrid, type TablerIcon } from "@tabler/icons-react"
import type { RouteObject } from "react-router"

import { icons } from "@/overrides/icons"
import { ListPage } from "@/core/crud/ListPage"
import { FormPage } from "@/core/crud/FormPage"
import { ViewPage } from "@/core/crud/ViewPage"

import Overview from "@/pages/overview"

export type TRouteObject = {
  name?: string
  group?: string
  icon?: TablerIcon
  display?: boolean | (() => boolean)
  children?: TRouteObject[]
} & RouteObject

const rawRoutes = ThunderSDK.getModuleNames()
  .map((name) => {
    if (!ThunderSDK.getMetadata(name)) {
      return
    }

    const module = ThunderSDK.getModule(name)
    const group = ThunderSDK.getGroup(name)

    const hasCreate = "create" in module
    const hasUpdate = "update" in module

    const children: TRouteObject[] = [
      {
        index: true,
        display: false,
        Component: () => <ListPage group={group} name={name} />,
      },
    ]

    if (hasCreate || hasUpdate) {
      children.push(
        {
          path: `form`,
          display: false,
          Component: () => <FormPage group={group} name={name} />,
        },
        {
          path: `form/:id`,
          display: false,
          Component: () => <FormPage group={group} name={name} />,
        },
        {
          path: `:id`,
          display: false,
          Component: () => <ViewPage group={group} name={name} />,
        }
      )
    }

    return {
      name: name,
      path: name,
      icon: icons[name],
      group,
      display: () =>
        ThunderSDK.isPermitted(name, "get") ||
        ThunderSDK.isPermitted(name, "create"),
      Component: () => <Outlet />,
      children,
    }
  })
  .filter(Boolean) as TRouteObject[]

export const coreRoutes = Object.entries(
  Object.groupBy(rawRoutes, (item) => item.group ?? "Other")
).map(([group, routes]) => {
  routes = routes ?? []

  routes.push({
    path: "",
    Component: () => <Navigate to={routes[0].path ?? "notFound"} />,
    display: false,
  })

  const children = routes.map((route) => ({
    ...route,
    path: route.path,
  }))

  return {
    path: group.toLowerCase().replace(" ", "-"),
    name: group,
    icon: icons[group],
    Component: () => <Outlet />,
    children,
  } as TRouteObject
})

coreRoutes.unshift(
  {
    name: "App root",
    path: "/:tenant",
    Component: () => <Navigate to="overview" />,
    display: false,
  },
  {
    name: "Overview",
    path: "overview",
    icon: IconLayoutGrid,
    Component: () => <Overview />,
  }
)
