import { ThunderSDK } from "thunder-sdk"
import { upload } from "@imagekit/react"
import Package from "../../../package.json"
import type { TRouteObject } from "../router"
import type { TNav } from "../layouts/shared/sub-nav"

import { converter, formatHex } from "culori"
import axios from "axios"
import { toast } from "sonner"
import { Capacitor } from "@capacitor/core"
import { format, formatDistanceToNow, isSameDay, subDays } from "date-fns"

export function appName() {
  return Package.name
    .replace("-", " ")
    .split(" ")
    .map((v) => ([2, 3].includes(v.length) ? v.toUpperCase() : v))
    .join(" ")
}

export const handleUpload = async (
  file: File,
  opts?: {
    folder?: string
    path?: string | string[]
    filename?: string
    signal?: AbortSignal
    onProgress?: (percentage: number) => void
  }
) => {
  const path = opts?.path instanceof Array ? opts.path.join("/") : opts?.path
  // Authenticate imagekit token
  const { signature, expire, token, publicKey } =
    await ThunderSDK.imageKit.auth()
  // Call the ImageKit SDK upload function with the required parameters and callbacks.
  return await upload({
    // Authentication parameters
    expire,
    token,
    signature,
    publicKey,
    file,
    fileName: [path?.replace(/^\/|\/$/g, ""), opts?.filename ?? file.name]
      .filter(Boolean)
      .join("/"), // Optionally set a custom file name
    // Progress callback to update upload progress state
    onProgress: (event) =>
      opts?.onProgress?.((event.loaded / event.total) * 100),
    // Abort signal to allow cancellation of the upload if needed.
    abortSignal: opts?.signal,
    folder: opts?.folder ?? (import.meta.env.VITE_UPLOAD_FOLDER || undefined),
  })
}

export function transformImage(
  src?: string | null,
  opts?: { width: number; height: number }
) {
  if (src) {
    const tr = `w-${opts?.width ?? 100},h-${opts?.height ?? 100}`

    try {
      const url = new URL(src)

      url.searchParams.set(
        "tr",
        `w-${opts?.width ?? 100},h-${opts?.height ?? 100}`
      )

      return url.toString()
    } catch {
      return [src, "?tr=", tr].join("")
    }
  }
}

export function getInitials(name?: string) {
  const [first, ...last] = name || "unamed"
  return !last
    ? first.substring(0, 2).toUpperCase()
    : `${first[0].toUpperCase()}${last[0].toUpperCase()}`
}

export function resolveUrl(path?: string) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
    .toString()
    .replace(/\/$/, "")

  if (path) {
    return new URL([baseUrl, path.trim().replace(/^\//, "")].join("/"))
  }

  return new URL(baseUrl)
}

export function getLocalUrl(path?: string) {
  return resolveUrl(getLocalPath(path))
}

export function getLocalPath(path?: string) {
  return [
    "",
    ThunderSDK.plugins.essentials.getTenant(),
    path?.trim().replace(/^\//, ""),
  ]
    .filter((path) => typeof path === "string")
    .join("/")
}

export function getAuthUrl(search: string = "") {
  const url = new URL(
    "/auth" + search,
    import.meta.env.VITE_API_BASE_URL || window.location.origin
  )

  url.searchParams.set("returnUri", `${window.location.href}`)

  return url
}

export function formatDateForInput(
  value: Date | string | null | undefined,
  time = false
) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  if (time) {
    const hour = String(date.getHours()).padStart(2, "0")
    const minute = String(date.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  return `${year}-${month}-${day}`
}

export function allowDisplayRoute(display?: boolean | (() => boolean)) {
  if (typeof display === "function") return display()
  return display ?? true
}

export function getRouteSortIndex(
  route?: Pick<TRouteObject, "priority">
): number {
  const priority = route?.priority

  if (typeof priority === "number") {
    return Number.isFinite(priority) ? priority : 0
  }

  if (typeof priority === "function") {
    const result = priority()
    return typeof result === "number" && Number.isFinite(result) ? result : 0
  }

  return 0
}

export function sortRoutes<T extends TRouteObject>(routes: T[]): T[] {
  return routes
    .map((route, originalIndex) => ({
      route,
      originalIndex,
      sortIndex: getRouteSortIndex(route),
    }))
    .sort((a, b) => {
      if (a.sortIndex !== b.sortIndex) {
        return a.sortIndex - b.sortIndex
      }

      return a.originalIndex - b.originalIndex
    })
    .map(({ route }) => route)
}

export function getNavRoutes(router: TRouteObject[]) {
  const routes: TNav[] = []
  const subRoutes: TNav[] = []

  for (const route of sortRoutes(router)) {
    if (!allowDisplayRoute(route.display)) continue

    const children = sortRoutes((route.children ?? []) as TRouteObject[])

    for (const child of children) {
      if (!allowDisplayRoute(child.display)) continue

      const parentPath = child.path ?? "/"

      routes.push({
        title: child.name || "Unnamed Route",
        icon: child.icon,
        path: parentPath,
      })

      const childRoutes = sortRoutes((child.children ?? []) as TRouteObject[])

      for (const subChild of childRoutes) {
        if (!allowDisplayRoute(subChild.display)) continue

        subRoutes.push({
          title: subChild.name || "Unnamed Route",
          icon: subChild.icon,
          path: subChild.path,
          parent: parentPath,
        })
      }
    }
  }

  const subRoutesByParent = Object.groupBy(subRoutes, (item) => item.parent!)

  return {
    routes,
    subRoutes: subRoutesByParent,
  }
}

const toRgb = converter("rgb")

export function rgbToHex(oklch: string) {
  const rgb = toRgb(oklch)

  if (!rgb) {
    throw new Error("Invalid OKLCH color")
  }

  return formatHex(rgb)
}

export function isMobileLayout() {
  return ["mobile"].includes(import.meta.env.VITE_APP_LAYOUT)
}

export const loadTailwindCSS = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ""

    const url = baseUrl ? `${baseUrl}app/tailwind.min.css` : "/tailwind.min.css"

    return (await axios.get(url)).data
  } catch (error) {
    console.error("Error fetching Tailwind CSS:", error)
  }
}

export const loadFontsCSS = async () => {
  try {
    // Fetch the latest Fonts
    return (
      await axios.get(
        "https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap"
      )
    ).data
  } catch (error) {
    console.error("Error fetching Font CSS:", error)
  }
}

export const printWindow = (content: string) => {
  const blob = new Blob([content], {
    type: "text/html",
  })

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob)

  // Open the URL in a new window
  window.open(url, "_blank", "popup=yes")
}

type HTMLBuilder<T> = (data: T & { content: string }) => Promise<string>

export const printDocument = async <T>(
  reference: React.RefObject<HTMLDivElement | null>,
  builder: HTMLBuilder<T>,
  data: T
) => {
  if (!reference.current) {
    toast.error("Nothing is available to print!")
    return
  }

  try {
    const content = reference.current.innerHTML

    const fullData = { ...data, content }

    const fullHTML = await builder(fullData)

    if (Capacitor.getPlatform() === "web") {
      printWindow(fullHTML)
    } else {
      const printer = cordova?.plugins?.printer
      if (!printer?.print) {
        toast.error("Printing is not available on this device.")
        return
      }
      // Cordova printer is callback-based (returns void) — not a Promise, so
      // never chain .then/.catch on it. The callback gets a boolean result.
      printer.print(fullHTML, {}, (ok: boolean) => {
        if (ok === false) console.info("Print dialog dismissed")
      })
    }
  } catch (err) {
    console.error("Print error:", err)
    toast.error("Failed to open the print dialog.")
  }
}

export const timeAgo = (dateStr: string | number | Date) =>
  formatDistanceToNow(new Date(dateStr), { addSuffix: true })

export const getDateGroup = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  if (isSameDay(date, now)) return "Today"
  if (isSameDay(date, subDays(now, 1))) return "Yesterday"
  return format(date, "MMM d, yyyy")
}

export const triggersTenantId = import.meta.env.VITE_TRIGGERS_TENANT_ID
export const triggersBaseUrl = import.meta.env.VITE_TRIGGERS_BASE_URL
export const unreadCountInterval = import.meta.env.VITE_UNREAD_COUNT_INTERVAL
