/* eslint-disable react-hooks/exhaustive-deps */
import { createBrowserRouter, RouterProvider, Outlet } from "react-router"
import { TooltipProvider } from "./components/ui/tooltip"
import { LayoutProvider } from "./components/layouts/layout-provider"
import { Layout, type TRouteObject } from "./components/layouts/sidebar"
import { ThunderSDK } from "thunder-sdk"
import { useAuth } from "react-oidc-context"

import { ListPage } from "./components/crud/ListPage"
import { FormPage } from "./components/crud/FormPage"
import React from "react"

ThunderSDK.init({
  axiosConfig: {
    baseURL: import.meta.env.VITE_API_BASE_URL,
  },
})

const router = createBrowserRouter([
  {
    name: "Main",
    path: "/",
    Component: () => (
      <LayoutProvider layout={Layout} router={router}>
        <Outlet />
      </LayoutProvider>
    ),
    children: ThunderSDK.getModuleNames()
      .map((name) => {
        if (!ThunderSDK.getMetadata(name)) {
          return
        }

        const module = ThunderSDK.getModule(name)

        const hasCreate = "create" in module
        const hasUpdate = "update" in module

        const children: TRouteObject[] = []

        if (hasCreate || hasUpdate) {
          children.push(
            {
              index: true,
              display: false,
              Component: () => <ListPage name={name} />,
            },
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
          display: () =>
            ThunderSDK.isPermitted(name, "get") ||
            ThunderSDK.isPermitted(name, "create"),
          Component: () => <Outlet />,
          children,
        }
      })
      .filter(Boolean),
  },
] as TRouteObject[])

export function App() {
  const auth = useAuth()
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    if (auth.isAuthenticated) {
      ThunderSDK.plugins.essentials.registerAuthInterceptors(
        async () => auth.user?.access_token ?? null,
        async () => {
          await auth.signinSilent()
        }
      )

      ThunderSDK.plugins.essentials.registerPermissions().then(() => {
        setReady(true)
      })
    }

    return () => {
      ThunderSDK.plugins.essentials.unregisterAuthInterceptors()
    }
  }, [auth.isAuthenticated])

  if (auth.isLoading) {
    return <div>Loading...</div>
  }

  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>
  }

  if (!auth.isAuthenticated && !auth.isLoading) {
    return <button onClick={() => auth.signinRedirect()}>Sign In</button>
  }

  if (!ready) {
    return <div>Loading permissions...</div>
  }

  return (
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  )
}

export default App
