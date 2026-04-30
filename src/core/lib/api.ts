import { ThunderSDK } from "thunder-sdk"

export const getMe = () =>
  // eslint-disable-next-line react-hooks/rules-of-hooks
  ThunderSDK.useCaching(
    ["me.get"],
    async ({ signal }) =>
      await ThunderSDK.me.get({
        signal,
      }),
    { cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1") }
  )

export const getTenants = () =>
  // eslint-disable-next-line react-hooks/rules-of-hooks
  ThunderSDK.useCaching(
    ["tenantMembers.get"],
    async ({ signal }) =>
      await ThunderSDK.tenantMemberships.get({
        signal,
        query: {},
        params: {},
      }),
    { cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1") }
  )
