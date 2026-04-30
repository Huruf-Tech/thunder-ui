import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import Package from "../../package.json"

export function appName() {
  return Package.name
    .replace("-", " ")
    .split(" ")
    .map((v) => ([2, 3].includes(v.length) ? v.toUpperCase() : v))
    .join(" ")
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveUrl(path?: string) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
    .toString()
    .replace(/\/$/, "")

  if (path) {
    return [baseUrl, path.trim().replace(/^\//, "")].join("/")
  }

  return baseUrl
}
