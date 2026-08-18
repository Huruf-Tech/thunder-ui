import type { TCardsOverride } from "@/core/types"
import { AttendanceCard } from "@/components/AttendanceCard"
import UserCardView  from "@/core/pages/users/userCardView"

export const cards: TCardsOverride = {
  // Add your custom cards components here
  // E.g: posts: PostCards
  attendances: AttendanceCard,
  users: UserCardView

}
