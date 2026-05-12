import type React from "react"

export const lists: Record<
  string,
  React.ComponentType<{ group?: string; name: string }>
> = {
  // Add your custom list page components here
  // E.g: posts: PostPage
}
