import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { initThunder } from "@/core/lib/thunder.ts"

import "./index.css"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"

import App from "./App.tsx"

initThunder().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </ThemeProvider>
    </StrictMode>
  )
})
