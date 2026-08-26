import * as React from "react"
import { Container } from "../custom/Container"

const PortalContainerContext = React.createContext<HTMLElement | null>(null)

export function usePortalContainer() {
  const context = React.useContext(PortalContainerContext)
  if (!context) return document.body

  return context
}

export function FullScreenArea({
  children,
  className,
}: {
  children: (
    toggleFullscreen: () => Promise<void>,
    isFullscreen: boolean
  ) => React.ReactNode
  className?: string
}) {
  const fullscreenRef = React.useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  const [portalContainer, setPortalContainer] =
    React.useState<HTMLDivElement | null>(null)

  const toggleFullscreen = async () => {
    try {
      const element = fullscreenRef.current

      if (!element) return

      if (document.fullscreenElement === element) {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } else {
        await element.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error)
    }
  }

  return (
    <PortalContainerContext.Provider value={portalContainer}>
      <Container ref={fullscreenRef} className={className}>
        {children?.(toggleFullscreen, isFullscreen)}
        <div ref={setPortalContainer} />
      </Container>
    </PortalContainerContext.Provider>
  )
}
