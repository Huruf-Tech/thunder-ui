//! The container and the imperative API share a file on purpose: they are the
//! two halves of one swappable dependency, and splitting them would mean two
//! places to edit for every change. Same trade-off `layout-provider` makes.
/* eslint-disable react-refresh/only-export-components */
import {
  Toaster as DingToaster,
  toast as ding,
} from "@yusufceng1z/ding-react"

/**
 * The app's toast layer, and the only file that knows which library provides it.
 *
 * Everything else imports `toast` and `Toaster` from here, so swapping the
 * implementation is a change to this file rather than to the ~12 call sites
 * spread across core. The container lives here too, because its configuration
 * is library-specific and has no business leaking into `layout-provider`.
 *
 * The surface is deliberately the smallest thing the app actually uses. Resist
 * widening it to mirror whatever library is underneath: every method added here
 * is one more thing the next library has to be able to do.
 *
 * ## One toast at a time
 *
 * The current implementation shows a single toast and *morphs* it when a new
 * one arrives, rather than stacking. That is deliberate upstream, not a gap —
 * so **never emit two toasts for one outcome**: the second replaces the first
 * and the user only ever reads the second. Put the detail in `description`
 * instead, the way the error interceptor in `lib/thunder.ts` and the bulk
 * delete in `crud/ListPage.tsx` do.
 *
 * ## Restyling
 *
 * The library injects its own stylesheet. Override it with CSS against `.tst`
 * (the toast) and the `--tst-*` custom properties — `--tst-stack-offset`,
 * `--tst-stack-scale` and friends — not with Tailwind classes on this
 * component, which it does not read.
 */

export type TToastId = string

export type TToastPatch = {
  title?: string
  description?: string
  /** 0–1, or null to remove the bar. */
  progress?: number | null
}

export type TToastAction = {
  label: string
  /** Return a patch to morph the toast in place, or nothing to dismiss it. */
  onClick: () => void | TToastPatch
}

export type TToastOptions = {
  /** Secondary line under the message. Newlines are preserved. */
  description?: string
  /** Milliseconds on screen. `0` keeps it open until dismissed. */
  duration?: number
  /** Supply one to update or dismiss this toast later. */
  id?: TToastId
  /** A single button on the toast. */
  action?: TToastAction
  /** 0–1. Draws a thin progress bar inside the toast. */
  progress?: number
}

/**
 * Matches what the previous implementation did on its own.
 *
 * The library keeps errors — and anything with an action — open until they are
 * dismissed by hand. That would have quietly turned all sixteen `toast.error`
 * call sites sticky as a side effect of swapping libraries, so the timeout is
 * pinned here instead. Pass `duration: 0` at a call site that genuinely needs
 * the user to acknowledge it.
 */
const DEFAULT_DURATION = 5000

const withDefaults = (options?: TToastOptions) => ({
  duration: DEFAULT_DURATION,
  ...options,
})

export const toast = {
  success(message: string, options?: TToastOptions): TToastId {
    return ding.success(message, withDefaults(options))
  },

  error(message: string, options?: TToastOptions): TToastId {
    return ding.error(message, withDefaults(options))
  },

  info(message: string, options?: TToastOptions): TToastId {
    return ding.info(message, withDefaults(options))
  },

  /** Closes one toast, or every toast when called with nothing. */
  dismiss(id?: TToastId) {
    //! Passing an explicit `undefined` is not the same call as passing nothing
    //! in every implementation, so the no-argument form is kept distinct.
    if (id === undefined) {
      ding.dismiss()

      return
    }

    ding.dismiss(id)
  },

  /** Changes a toast that is already on screen. */
  update(id: TToastId, patch: TToastPatch) {
    ding.update(id, patch)
  },
}

/**
 * The toast container. Rendered once, by `LayoutProvider`.
 *
 * `theme` is passed in rather than read from `useTheme()` here so this file
 * stays free of app context and can be swapped without re-wiring providers.
 */
export function Toaster({ theme }: { theme?: "light" | "dark" | "system" }) {
  return <DingToaster position="bottom-center" theme={theme} />
}
