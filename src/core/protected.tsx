/* eslint-disable react-refresh/only-export-components */
import { Button } from "@/components/ui/button"
import React from "react"
import { useAuth } from "react-oidc-context"
import { ThunderSDK } from "thunder-sdk"
import { LoadingScreen } from "./custom/LoadingScreen"
import { IconBug, IconLoader, IconLogin } from "@tabler/icons-react"
import { useParams } from "react-router"

function ProtectedWithOAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const auth = useAuth()

  React.useEffect(() => {
    if (auth.isAuthenticated) {
      ThunderSDK.plugins.essentials.registerAuthInterceptors(
        async () => auth.user?.access_token ?? null,
        async () => {
          await auth.signinSilent()
        }
      )

      ThunderSDK.plugins.essentials
        .registerPermissions()
        .then(() => {
          setReady(true)
        })
        .catch((error) => {
          setError(error)
        })
    }

    return () => {
      ThunderSDK.plugins.essentials.unregisterAuthInterceptors()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated])

  const systemError = auth.error ?? error
  const requireSignIn = !auth.isAuthenticated && !auth.isLoading && !systemError
  const loadingPermissions = !requireSignIn && !ready

  const handleSignIn = () => {
    auth.signinRedirect()
  }

  const handleLogout = () => {
    auth.removeUser()
    auth.revokeTokens(["refresh_token", "access_token"])

    setReady(false)
  }

  const handleSignInAgain = () => {
    handleLogout()
    handleSignIn()
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (requireSignIn) {
    return (
      <LoadingScreen
        title="Sign in to continue"
        icon={IconLogin}
        description="Click the following button to sign into your account"
      >
        <Button onClick={handleSignIn}>Sign In</Button>
      </LoadingScreen>
    )
  }

  if (systemError) {
    return (
      <LoadingScreen
        title="Something went wrong!"
        icon={IconBug}
        description={
          systemError?.message ??
          "An unexpected error has been encountered! Please contact support."
        }
      >
        <Button variant="outline" onClick={handleSignInAgain}>
          Sign in again?
        </Button>
        <Button onClick={handleRefresh}>Retry</Button>
      </LoadingScreen>
    )
  }

  if (loadingPermissions)
    return (
      <LoadingScreen
        title="Getting things ready!"
        icon={IconLoader}
        description="We are loading your permissions..."
      >
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </LoadingScreen>
    )

  return children
}

function ProtectedWithSession({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  const [loggedIn, setLoggedIn] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const sessionIsLoggedIn = React.useCallback(async () => {
    try {
      const res = await fetch(
        new URL(
          "/auth/api/get-session",
          import.meta.env.VITE_API_BASE_URL || window.location.origin
        )
      )

      return (await res.json()) !== null
    } catch {
      // Ignore errors
    }

    return false
  }, [])

  React.useEffect(() => {
    void (async () => {
      if (await sessionIsLoggedIn()) {
        void ThunderSDK.plugins.essentials
          .registerPermissions()
          .then(() => {
            setReady(true)
          })
          .catch((error) => {
            setError(error)
          })
      } else {
        setLoggedIn(false)
      }
    })()
  }, [sessionIsLoggedIn])

  if (!loggedIn) {
    return (
      <LoadingScreen
        title="Sign in to continue"
        icon={IconLogin}
        description="Click the following button to sign into your account"
      >
        <Button
          onClick={() => {
            window.location.href =
              "/auth?redirect=" + (import.meta.env.BASE_URL || "/")
          }}
        >
          Sign In
        </Button>
      </LoadingScreen>
    )
  }

  if (error) {
    return (
      <LoadingScreen
        title="Something went wrong!"
        icon={IconBug}
        description={
          error?.message ??
          "An unexpected error has been encountered! Please contact support."
        }
      ></LoadingScreen>
    )
  }

  if (!ready)
    return (
      <LoadingScreen
        title="Getting things ready!"
        icon={IconLoader}
        description="We are loading your permissions..."
      ></LoadingScreen>
    )

  return children
}

export function Protected({ children }: { children: React.ReactNode }) {
  const { tenant } = useParams<{ tenant: string }>()

  React.useEffect(() => {
    if (tenant) ThunderSDK.plugins.essentials.setTenant(tenant)

    return () => ThunderSDK.plugins.essentials.removeTenant()
  }, [tenant])

  return import.meta.env.VITE_OAUTH_CLIENT_ID ? (
    <ProtectedWithOAuth>{children}</ProtectedWithOAuth>
  ) : (
    <ProtectedWithSession>{children}</ProtectedWithSession>
  )
}

export function useLogout() {
  const auth = useAuth()

  return async () => {
    if (import.meta.env.VITE_OAUTH_CLIENT_ID) {
      auth.removeUser()
      auth.revokeTokens(["refresh_token", "access_token"])
    } else {
      try {
        await fetch(
          new URL(
            "/auth/api/sign-out",
            import.meta.env.VITE_API_BASE_URL || window.location.origin
          ),
          {
            method: "POST",
            body: "{}",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      } catch {
        // Ignore errors
      }
    }

    window.location.href = import.meta.env.BASE_URL || "/"
  }
}
