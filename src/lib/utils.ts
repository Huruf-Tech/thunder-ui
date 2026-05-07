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
