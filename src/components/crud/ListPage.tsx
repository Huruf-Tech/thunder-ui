/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { ThunderSDK } from "thunder-sdk"
import { DataTable } from "../custom/Datatable"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { useNavigate } from "react-router"

export interface IListPageProps {
  name: string
}

const columnsFromModuleMetadata = (metadata: any): ColumnDef<unknown>[] => {
  if (!metadata) return []

  if (typeof metadata.crud?.schema !== "object") return []

  // Convert json schema to columns
  return Object.entries<{
    type: string
    format?: string
  }>(metadata.crud.schema.properties).map(([key]) => ({
    accessorKey: key,
    header: key,
  }))
}

export function ListPage({ name }: IListPageProps) {
  const navigate = useNavigate()
  const metadata = React.useMemo(() => ThunderSDK.getMetadata(name), [name])
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<unknown[]>([])

  React.useEffect(() => {
    setLoading(true)
    ;(async () => {
      const { results } = (await ThunderSDK.getModule(name).get({})) as {
        results: unknown[]
      }

      setData(results)
      setLoading(false)
    })()
  }, [name])

  if (loading) return <div>Loading...</div>

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5">
      <Button onClick={() => navigate("form")}>Create</Button>
      {data ? (
        <DataTable columns={columnsFromModuleMetadata(metadata)} data={data} />
      ) : null}
    </div>
  )
}
