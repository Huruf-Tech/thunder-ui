import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function splitCamelCase(text: string | undefined): string {
  return (
    (text ?? "")
      ?.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      // handle multiple uppercase (e.g. "APIResponse" → "API Response")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function resolveUrl(path?: string) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
    .toString().replace(/\/$/, "");

  if (path) {
    return [baseUrl, path.trim().replace(/^\//, "")].join("/");
  }

  return baseUrl;
}
