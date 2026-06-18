import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router"

import { LayoutProvider } from "@/core/layouts/layout-provider"

/** Create a router with the core routes as the child routes of the root path */
import { coreRoutes, type TRouteObject } from "@/core/router"
import { Protected } from "@/core/protected"
import { SelectTenant } from "@/core/pages/tenant/select-tenant"
import { NotFound } from "./core/layouts/shared/not-found"
import AppWrapper from "./core/AppWrapper"
import { Onboarding } from "./components/onboarding"

const router = createBrowserRouter(
  [
    {
      name: "Root",
      path: "/",
      display: false,
      Component: () => (
        <Protected>
          <Outlet />
        </Protected>
      ),
      errorElement: <NotFound />,
      children: [
        {
          index: true,
          Component: () => <Navigate to="/select-tenant" />,
        },
        {
          path: "select-tenant",
          Component: () => <SelectTenant />,
        },
      ],
    },
    {
      name: "App",
      path: "/:tenant",
      Component: () => (
        <Protected>
          <LayoutProvider router={router}>
            <Outlet />
          </LayoutProvider>
        </Protected>
      ),
      children: coreRoutes,
    },

    // You can add your custom routes here, they will not be affected by the core routes
  ] as TRouteObject[],
  {
    basename: import.meta.env.BASE_URL,
  }
)

export function App() {
  return (
    <AppWrapper>
      <Onboarding />
      <RouterProvider router={router} />
    </AppWrapper>
  )
}

export default App
