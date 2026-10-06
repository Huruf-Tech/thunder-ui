import type { TCardsOverride } from "@/core/types"
import { features } from "@/core/lib/features"

import UserCardView from "@/core/pages/users/userCardView"

/**
 * Card views that ship with the boilerplate, each behind its own feature flag.
 *
 * These used to be written straight into `src/overrides/crud/cards.tsx`, which
 * is the developer's file — so every generated app inherited them and could not
 * tell framework defaults from its own registrations. `ListPage` merges this map
 * under the overrides, so a developer registering the same key still wins.
 * See C-01 / F-13.
 */
export const builtinCards: TCardsOverride = {
  ...(features.users ? { users: UserCardView } : {}),
}
