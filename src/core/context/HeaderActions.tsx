// HeaderActions.tsx
import React from "react"
import { createPortal } from "react-dom"

const HeaderActionsContext = React.createContext<HTMLElement | null>(null)

export function HeaderActionsProvider({
  children,
}: {
  children: (element: React.JSX.Element) => React.ReactNode
}) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null)

  return (
    <HeaderActionsContext.Provider value={target}>
      {children?.(
        <div ref={setTarget} className="absolute z-20 h-full w-full" />
      )}
    </HeaderActionsContext.Provider>
  )
}

export function HeaderActions({ children }: { children: React.ReactNode }) {
  const target = React.useContext(HeaderActionsContext)
  return target ? createPortal(children, target) : null
}
