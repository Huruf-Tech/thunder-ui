import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AuthProvider } from "react-oidc-context"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider
        authority={import.meta.env.VITE_API_BASE_URL}
        client_id={import.meta.env.VITE_OAUTH_CLIENT_ID}
        redirect_uri={window.location.origin}
        scope="full_access offline_access"
      >
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
