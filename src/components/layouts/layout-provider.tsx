/* eslint-disable react-refresh/only-export-components */
import React from "react"
import { createBrowserRouter } from "react-router"

export interface ILayoutContext {
  router: ReturnType<typeof createBrowserRouter>
}

const LayoutContext = React.createContext<ILayoutContext | null>(null)

export interface ILayoutProps {
  layout: React.ComponentType<{
    children: React.ReactNode
  }>
  router: ReturnType<typeof createBrowserRouter>
  children: React.ReactNode
}

export function LayoutProvider({
  children,
  layout: Layout,
  router,
}: ILayoutProps) {
  return (
    <LayoutContext.Provider value={{ router }}>
      <Layout>{children}</Layout>
    </LayoutContext.Provider>
  )
}

export const useLayout = () => {
  const context = React.useContext(LayoutContext)

  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider")
  }

  return context
}
