import { Navigate, Outlet } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import type { TablerIcon } from "@tabler/icons-react"
import type { RouteObject } from "react-router"

import { ListPage } from "@/core/crud/ListPage"
import { FormPage } from "@/core/crud/FormPage"

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

    const hasCreate = "create" in module
    const hasUpdate = "update" in module

    const children: TRouteObject[] = [
      {
        index: true,
        display: false,
        Component: () => <ListPage name={name} />,
      },
    ]

    if (hasCreate || hasUpdate) {
      children.push(
        {
          path: `/${name}/form`,
          display: false,
          Component: () => <FormPage name={name} />,
        },
        {
          path: `/${name}/form/:id`,
          display: false,
          Component: () => <FormPage name={name} />,
        }
      )
    }

    return {
      name: name,
      path: name,
      group: ThunderSDK.getGroup(name),
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
    path: "/",
    Component: () => <Navigate to={routes[0].path ?? "/notFound"} />,
  })

  const children = routes.map((route) => ({
    ...route,
    path: route.path,
    handle: { name: route.name },
  }))

  return {
    path: group,
    name: group,
    handle: { name: group },
    Component: () => <Outlet />,
    children,
  }
})

coreRoutes.push({
  name: "Root",
  handle: { name: "Root" },
  path: "/",
  Component: () => <Navigate to={coreRoutes[0].path ?? "/notFound"} />,
  children: [],
})
