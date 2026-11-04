import React from "react"
import { ThunderSDK } from "thunder-sdk"

import { use } from "@/core/hooks/use"
import { appName as packageAppName } from "@/core/lib/utils"

/**
 * The project's branding, served by the backend at `/auth/branding`.
 *
 * Every brand surface in the UI reads from here: the app name in a layout's
 * header, the logo beside it, the favicon, and the theme tokens. Everything is
 * optional on the wire, so each getter falls back to what the boilerplate ships
 * with -- a UI generated against a backend that serves no branding looks
 * exactly as it did before.
 *
 * Called from wherever a name or a logo is rendered, like `use(ThunderSDK.me)`
 * is. The request carries an explicit `cacheKey`, so the SDK serves every
 * caller after the first from its cache instead of refetching per component.
 */

/** Branding rarely changes within a session, and never mid-navigation. */
const CACHE_TTL_SECONDS = 60 * 60

export function useBranding() {
  const request = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      //! An SDK generated before the branding endpoint existed has no such
      //! method. This hook runs at the app root, so reading straight through
      //! would take the whole app down after a `--forceSync` onto a project
      //! whose SDK has not been regenerated.
      if (!ThunderSDK.auth?.branding) return null

      return await ThunderSDK.auth.branding({
        signal,
        cacheKey: "app-branding",
        cacheTTL: CACHE_TTL_SECONDS,
      })
    },
    []
  )

  const { data, error, isLoading } = use(request)

  //! A response with no name is treated as "no branding configured" rather than
  //! as branding that happens to be blank, so the fallbacks below apply whole
  //! rather than leaving a header with an empty string in it.
  const branding = data?.name ? data : null

  return {
    isLoading,
    error,
    branding,
    /** Falls back to the name in `package.json`, via `appName()`. */
    appName: branding?.name ?? packageAppName(),
    /** Falls back to the logo the boilerplate ships in `public/`. */
    logo: branding?.logo || null,
  }
}
