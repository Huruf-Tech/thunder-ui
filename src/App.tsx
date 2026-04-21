import { createBrowserRouter, RouterProvider, Outlet } from "react-router"
import { AuthProvider } from "react-oidc-context"

/** You can change the following layout from "sidebar" to some other layout */
import { Layout } from "@/core/layouts/sidebar"
import { LayoutProvider } from "@/core/layouts/layout-provider"

/** Create a router with the core routes as the child routes of the root path */
import { coreRoutes, type TRouteObject } from "@/core/router"
import { Protected } from "@/core/protected"
import { LoadingProvider } from "./core/context/LoaderProvider"
import { ActionSheet } from "./components/ActionSheet";
import { ActionSheetRef } from "@/Registry/ActionSheet";


const router = createBrowserRouter(
  [
    {
      name: "Root",
      path: "/",
      handle: { name: "Root" },
      Component: () => (
        <Protected>
          <LayoutProvider layout={Layout} router={router}>
            <Outlet />
          </LayoutProvider>
        </Protected>
      ),
      children: [
        {
          name: "Main",
          handle: { name: "Main" },
          Component: () => <Outlet />,
          children: coreRoutes
            .filter(route => !["posts"].includes(route.name || ""))
            .map(route => ({
              ...route,
              path: route.path,
              handle: { name: route.name }
            }))
        },
        // You can add your custom routes here
        {
          name: "Custom Routes",
          handle: { name: "Custom Routes" },
          Component: () => <Outlet />,
          children: coreRoutes
            .filter(route => ["posts"].includes(route.name || ""))
            .map(route => ({
              ...route,
              path: route.path,
              handle: { name: route.name }
            }))
        }
      ],
    },

    // You can add your custom routes here, they will not be affected by the core routes
  ] as TRouteObject[],
  {
    basename: import.meta.env.BASE_URL,
  }
)

export function App() {
  const currentUri = new URL(
    import.meta.env.BASE_URL,
    window.location.origin
  ).toString()

  return (
    <LoadingProvider>
      <AuthProvider
        authority={import.meta.env.VITE_OAUTH_SERVER_URL}
        client_id={import.meta.env.VITE_OAUTH_CLIENT_ID}
        redirect_uri={currentUri + window.location.search}
        scope={import.meta.env.VITE_OAUTH_SCOPE}
        post_logout_redirect_uri={currentUri}
        onSigninCallback={() => {
          const url = new URL(window.location.href)

          url.searchParams.delete("code")
          url.searchParams.delete("state")
          url.searchParams.delete("session_state")
          url.searchParams.delete("iss")

          window.history.replaceState(
            {},
            document.title,
            url.pathname + url.search + url.hash
          )
        }}
      >
        <RouterProvider router={router} />
        <ActionSheet ref={ActionSheetRef} />
      </AuthProvider>
    </LoadingProvider>
  )
}

export default App
