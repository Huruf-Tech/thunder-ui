import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThunderSDK } from "thunder-sdk"

import "./index.css"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"

import App from "./App.tsx"

ThunderSDK.init({
  axiosConfig: {
    baseURL: import.meta.env.VITE_API_BASE_URL || window.location.origin,
  },
  cache: {
    getter: (key: string) => localStorage.getItem(key) || undefined,
    setter: (key: string, value: string) => {
      localStorage.setItem(key, value)
      return true
    },
    delete: async (key: string) => {
      localStorage.removeItem(key)
      return true
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
