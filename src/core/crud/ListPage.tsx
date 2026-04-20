/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { hash } from "ohash"
import { ThunderSDK } from "thunder-sdk"
import { DataTable } from "../custom/Datatable"
import { cards } from "@/templates/crudCard"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useNavigate } from "react-router"
import { use } from "../hooks/use"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { IconAlertCircle, IconTable, IconLayoutGrid } from "@tabler/icons-react"

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

  const get = React.useCallback(
    (query: Record<string, unknown> = {}) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return ThunderSDK.useCaching(
        [name, query && hash(query)],
        async ({ signal }) =>
          (await ThunderSDK.getModule(name).get({
            signal,
            query,
          })) as { results: unknown[] },
        { cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1") }
      )
    },
    [name]
  )

  const { data, error } = use(get())
  const [view, setView] = React.useState<string>("table")
  const Card = cards[name as keyof typeof cards];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5">
      {error && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>Error Occurred!</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between items-center">
        <div>
          {ThunderSDK.isPermitted(ThunderSDK.getModule(name).create) && (
            <Button onClick={() => navigate("form")}>Create</Button>
          )}
        </div>
        {!!Card && (
          <ToggleGroup value={view} onValueChange={(v) => v && setView(v)}>
            <ToggleGroupItem value="table" aria-label="Table view">
              <IconTable className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="card" aria-label="Card view">
              <IconLayoutGrid className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      <div>
        {view === "card" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(data?.results ?? []).filter((item: any) => item?.card === true).length > 0 ? (
              (data?.results ?? []).filter((item: any) => item?.card === true).map((item: any, i: number) => (
                <Card key={item._id ?? i} data={item} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-sm text-muted-foreground border rounded-lg border-dashed">
                No records with card views enabled.
              </div>
            )}
          </div>
        ) : (
          <DataTable
            columns={columnsFromModuleMetadata(metadata)}
            data={data?.results ?? []}
          />
        )}
      </div>
    </div>
  )
}
