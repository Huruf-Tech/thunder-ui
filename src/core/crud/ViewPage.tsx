import { views } from "@/overrides/crud/views"
import { Navigate, useParams } from "react-router"
import { getLocalPath, groupPath } from "../lib/utils"

export interface IViewPageProps {
  group?: string
  name: string
}

export function ViewPage({ group, name }: IViewPageProps) {
  const { id } = useParams<{ id?: string }>()

  const View = views[name as keyof typeof views]

  if (View) return <View />

  /*
    A module with no registered detail view falls through to its edit form.

    This used `getLocalUrl(...).pathname`, which already carries the router's
    basename (`BASE_URL`, `/app` in a generated project). React Router resolves
    a root-relative `to` against the basename and prepends it a second time, so
    the redirect landed on `/app/app/<tenant>/...` and 404'd.

    `getLocalPath` is the basename-free form of the same path -- what the navbar
    already passes to `<Link to>`. Only `getLocalUrl(...).toString()` is safe to
    hand the router, because an absolute URL makes it strip origin and basename
    first; the `.pathname` of one never is.

    `replace` because this is a redirect: without it the view URL stays in
    history, and Back from the form returns here only to be bounced forward
    again.
  */
  return (
    <Navigate
      replace
      to={getLocalPath(
        [groupPath(group), name, "form", id].filter(Boolean).join("/")
      )}
    />
  )
}
