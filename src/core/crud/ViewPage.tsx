import { views } from "@/overrides/crud/views"
import { Navigate, useParams } from "react-router"
import { getLocalUrl } from "../lib/utils"

export interface IViewPageProps {
  group?: string
  name: string
}

export function ViewPage({ group, name }: IViewPageProps) {
  const { id } = useParams<{ id?: string }>()

  const View = views[name as keyof typeof views]

  if (View) return <View data={{}} />

  return (
    <Navigate
      to={
        getLocalUrl(
          [group?.toLowerCase().replace(" ", "-"), name, "form", id]
            .filter(Boolean)
            .join("/")
        ).pathname
      }
    />
  )
}
