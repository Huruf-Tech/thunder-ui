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

export const projectSchema = z.object({
  title: z.string().min(5).max(100),
  excerpt: z.string().max(200),
  slug: z.string().min(3).max(100),
  image: z.url(),
  thumbnail: z.url(),
  category: z.string().max(100),
  content: z.string().max(5000),
  card: z.boolean().optional(),
})

export type ProjectData = z.infer<typeof projectSchema>

export function ProjectCard({ data }: { data: ProjectData }) {
  const result = projectSchema.safeParse(data)

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Invalid project data
        </CardContent>
      </Card>
    )
  }

  const project = result.data

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-shadow hover:shadow-lg rounded-xl border-border/20">
      {(project.image || project.thumbnail) && (
        <img
          src={project.image || project.thumbnail}
          alt={project.title}
          className="h-40 w-full object-cover saturate-110"
        />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="truncate text-base font-medium">{project.title}</CardTitle>
          <Badge className="rounded-full bg-violet-200 text-violet-900 border-none text-[11px]">
            {project.category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 text-[13px] leading-relaxed">
          {project.excerpt}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground/70 line-clamp-3 leading-relaxed">
          {project.content}
        </p>
      </CardContent>

      <CardFooter className="border-t border-border/20 py-3">
        <span className="text-xs font-mono text-muted-foreground/60 truncate">
          /{project.slug}
        </span>
      </CardFooter>
    </Card>
  )
}
