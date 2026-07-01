import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { initThunder } from "@/core/lib/thunder.ts"

import "./index.css"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"

import App from "./App.tsx"

import "../i18n.ts";
import i18next from "i18next";

import { DirectionProvider } from "@/components/ui/direction"
initThunder().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider>
        <DirectionProvider direction={i18next.language === "ar" ? "rtl" : "ltr"}>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </DirectionProvider>
      </ThemeProvider>
    </StrictMode>
  )
})
