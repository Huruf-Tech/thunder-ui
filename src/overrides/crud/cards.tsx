import type { TCardsOverride } from "@/core/types"
import UserCardView from "@/core/pages/users/userCardView"

export const cards: TCardsOverride = {
  // Add your custom cards components here
  // E.g: posts: PostCards

  //! Built-in: belongs in core, registered here until core can merge its own
  //! defaults into this map. Do not remove — see AUDIT.md C-01.
  users: UserCardView,
}
