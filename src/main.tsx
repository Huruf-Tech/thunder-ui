import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { initThunder } from "@/core/lib/thunder.ts"
import i18next from "i18next"

import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip.tsx"
import { DirectionProvider } from "@/components/ui/direction.tsx"

import "./index.css"
import "./i18n.ts"

initThunder().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider>
        <DirectionProvider
          direction={i18next.language === "ar" ? "rtl" : "ltr"}
        >
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </DirectionProvider>
      </ThemeProvider>
    </StrictMode>
  )
})
