import React from "react"
import { App } from "@capacitor/app"
import { Browser } from "@capacitor/browser"
import { Capacitor } from "@capacitor/core"
import { Preferences } from "@capacitor/preferences"
import {
  User,
  UserManager,
  type INavigator,
  type NavigateParams,
  type NavigateResponse,
  type StateStore,
} from "oidc-client-ts"
import config from "../../../capacitor.config"
import { resolveUrl } from "../lib/utils"

export class CapacitorStateStore implements StateStore {
  public async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value })
  }

  public async get(key: string): Promise<string | null> {
    const result = await Preferences.get({ key })
    return result.value
  }

  public async remove(key: string): Promise<string | null> {
    const existing = await this.get(key)
    await Preferences.remove({ key })
    return existing
  }

  public async getAllKeys(): Promise<string[]> {
    const result = await Preferences.keys()
    return result.keys
  }
}

export class CapacitorRedirectNavigator implements INavigator {
  public async prepare(_: NavigateParams) {
    return {
      navigate: async ({ url }: { url: string }): Promise<NavigateResponse> => {
        await Browser.open({ url, windowName: "_self" })

        return { url }
      },
      close: async () => {
        await Browser.close()
      },
    }
  }

  public async callback(_url: string): Promise<void> {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const callbackUri = React.useMemo(() => {
    const isNative = Capacitor.isNativePlatform()

    if (isNative) {
      return `${config.appId}://auth/callback`
    }

    return resolveUrl().toString()
  }, [])

  const [userManager] = React.useState(
    () =>
      new UserManager(
        {
          authority:
            import.meta.env.VITE_OAUTH_SERVER_URL || window.location.origin,
          client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
          scope: import.meta.env.VITE_OAUTH_SCOPE,
          redirect_uri: callbackUri + window.location.search,
          userStore: new CapacitorStateStore(),
        },
        new CapacitorRedirectNavigator()
      )
  )

  const [loading, setLoading] = React.useState(false)
  const [user, setUser] = React.useState<User | null>(null)
  const [error, setError] = React.useState<Error | null>(null)

  const handleLogin = React.useCallback(
    async (url: string) => {
      setLoading(true)

      try {
        const parsedUrl = new URL(url)

        if (parsedUrl.searchParams.has("error")) {
          throw parsedUrl.searchParams.get("error")
        }

        setUser(await userManager.signinRedirectCallback(url))
      } catch (error) {
        if (error instanceof Error && error.message === "No state in response")
          return

        console.error("Login error:", error)
        setError(error instanceof Error ? error : new Error(String(error)))
      } finally {
        setLoading(false)
      }
    },
    [userManager]
  )

  React.useEffect(() => {
    setLoading(true)

    userManager
      .getUser()
      .then((user) => {
        if (!user || user.expired) {
          throw new Error("User not authenticated or session expired")
        }

        setUser(user)
        setLoading(false)
        setError(null)
      })
      .catch(() => {
        if (Capacitor.isNativePlatform()) {
          App.addListener("appUrlOpen", async ({ url }) => {
            if (!url.startsWith(callbackUri)) return

            await Browser.close()

            await handleLogin(url)
          })
        } else {
          handleLogin(window.location.href)
        }
      })
  }, [])

  return (
    <authContext.Provider
      value={{
        userManager,
        isLoading: loading,
        isAuthenticated: !!user,
        user,
        error,
      }}
    >
      {children}
    </authContext.Provider>
  )
}

export type TAuthContext = {
  userManager: UserManager
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  error: Error | null
}

const authContext = React.createContext<TAuthContext | null>(null)

export const useAuth = () => {
  const context = React.useContext(authContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}

export const useOptionalAuth = () => {
  return React.useContext(authContext)
}
