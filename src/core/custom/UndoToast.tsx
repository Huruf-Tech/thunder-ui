import { toast } from "@/core/lib/toast"

/**
 * A toast that runs an action after a grace period, with a chance to undo.
 *
 * Previously rendered as a fully custom toast with its own markup and a CSS
 * countdown bar. The toast layer no longer has a custom-render escape hatch, so
 * this is built from its own primitives instead: a single `action` button for
 * the undo, and `progress` for the countdown.
 *
 * `message` is a `string` where it used to be a `React.ReactNode` — the toast
 * layer takes a title, not arbitrary markup. A caller that was passing an
 * element has to pass text.
 */

/** How often the countdown bar is redrawn. Each tick patches one toast. */
const TICK_MS = 100

export type TUndoToastOptions = {
  message: string
  duration?: number
  undoLabel?: string
  onComplete: () => void | Promise<void>
  onUndo?: () => void
}

export const undoToast = ({
  message,
  duration = 5000,
  undoLabel = "Undo",
  onComplete,
  onUndo,
}: TUndoToastOptions) => {
  let timeout: ReturnType<typeof setTimeout>
  let interval: ReturnType<typeof setInterval>

  const stopTimers = () => {
    clearTimeout(timeout)
    clearInterval(interval)
  }

  const id = toast.info(message, {
    //! Held open for the whole grace period: the library would otherwise apply
    //! its own default, and the bar has to run out at the same moment the
    //! action fires.
    duration,
    progress: 1,
    action: {
      label: undoLabel,
      onClick: () => {
        stopTimers()
        onUndo?.()
      },
    },
  })

  const startedAt = Date.now()

  interval = setInterval(() => {
    const remaining = 1 - (Date.now() - startedAt) / duration

    if (remaining <= 0) {
      clearInterval(interval)

      return
    }

    toast.update(id, { progress: remaining })
  }, TICK_MS)

  timeout = setTimeout(async () => {
    stopTimers()

    try {
      await onComplete()
    } finally {
      toast.dismiss(id)
    }
  }, duration)

  return {
    id,
    cancel() {
      stopTimers()
      toast.dismiss(id)
    },
  }
}
