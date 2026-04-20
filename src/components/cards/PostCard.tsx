import z from "zod"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const postSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(300),
  content: z.string().max(5000),
  cover: z.url().optional(),
  thumbnail: z.url().optional(),
  published: z.boolean(),
  tags: z.array(z.string().max(100)).optional(),
  card: z.boolean().optional().default(false),
})

export type PostData = z.infer<typeof postSchema>

export function PostCard({ data }: { data: PostData }) {
  console.log(data)
  const result = postSchema.safeParse(data)

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Invalid post data
        </CardContent>
      </Card>
    )
  }

  const post = result.data

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-shadow hover:shadow-lg">
      {(post.cover || post.thumbnail) && (
        <img
          src={post.cover || post.thumbnail}
          alt={post.title}
          className="h-40 w-full object-cover"
        />
      )}

      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="truncate">{post.title}</CardTitle>
          <Badge variant={post.published ? "default" : "secondary"}>
            {post.published ? "Published" : "Draft"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {post.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {post.content}
        </p>
      </CardContent>

      {post.tags && post.tags.length > 0 && (
        <CardFooter className="flex flex-wrap gap-1.5">
          {post.tags.map((tag, i) => (
            <Badge key={i} variant="outline">
              {tag}
            </Badge>
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
