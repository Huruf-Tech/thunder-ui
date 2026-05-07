/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { hash } from "ohash"
import { ThunderSDK } from "thunder-sdk"
import { DataTable } from "../custom/Datatable"
import { cards } from "@/overrides/crud/cards"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useNavigate } from "react-router"
import { use } from "../hooks/use"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  IconAlertCircle,
  IconEdit,
  IconLayoutGrid,
  IconTable,
  IconTrash,
  IconX,
  IconXMark,
} from "@tabler/icons-react"
import { TableSkeleton } from "../custom/TableSkeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ActionBar } from "../custom/ActionBar"
import { ConfirmationDialog } from "../custom/ConfirmationDialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import columns from "./Columns"
import { DataFilter } from "../data-filter/DataFilter"

export interface IListPageProps {
  name: string
}

export function ListPage({ name }: IListPageProps) {
  const navigate = useNavigate()

  const _get = React.useCallback(
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

  const get = React.useMemo(() => _get(), [_get])
  const { data, error, isLoading } = use(get)

  const [view, setView] = React.useState<string>("table")
  const Card = cards[name as keyof typeof cards]

  const table = useReactTable({
    data: data?.results ?? [],
    columns: columns(name),
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col gap-5">
      {error && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>Error Occurred!</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="max-w-xl grow">
            <DataFilter
              columnsConfig={[
                {
                  id: "search",
                  type: "string",
                },
                {
                  id: "options",
                  type: "option",
                  placeholder: "Options",
                  options: [
                    { label: "hello", value: "hello" },
                    { label: "world", value: "world" },
                    { label: "cool", value: "cool" },
                  ],
                },
                {
                  id: "dateRange",
                  type: "date",
                  mode: "range",
                },
                {
                  id: "numberRange",
                  type: "number",
                  displayName: "Number Range",
                  min: 10,
                  max: 100,
                },
                {
                  id: "multiOption",
                  type: "multiOption",
                  displayName: "Multi Options",
                  options: [
                    { label: "hello", value: "hello" },
                    { label: "world", value: "world" },
                    { label: "cool", value: "cool" },
                  ],
                },
              ]}
              onValueChange={(value) => {
                console.log(value)
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            {data?.results.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="max-w-fit">
                      Visibility
                    </Button>
                  }
                ></DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="no-scrollbar max-h-100 overflow-auto"
                >
                  <DropdownMenuCheckboxItem
                    checked={table.getIsAllColumnsVisible()}
                    onCheckedChange={(value) =>
                      table.toggleAllColumnsVisible(!!value)
                    }
                  >
                    Select all
                  </DropdownMenuCheckboxItem>
                  {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          <span className="line-clamp-1 truncate">
                            {column.columnDef.header as string}
                          </span>
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {ThunderSDK.isPermitted(ThunderSDK.getModule(name).create) && (
              <Button onClick={() => navigate("form")}>Create</Button>
            )}
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
        </div>

        <ActionBar
          containerClassName="absolute bottom-10 left-3 right-3 max-w-md mx-auto z-20 shadow-sm"
          data-open={!!selectedCount}
        >
          <div className="flex w-full items-center justify-between gap-2 rounded-full border bg-background p-3 dark:bg-black">
            <p className="text-sm md:ltr:ml-3 md:rtl:mr-3">
              {selectedCount} <span className="font-medium">selected</span>
            </p>

            <div className="flex items-center gap-2">
              {selectedCount === 1 && (
                <Button
                  size="icon-sm"
                  variant="outline"
                  onClick={() => {
                    const row = selectedRows.map(
                      (row) => row.original
                    )[0] as any

                    navigate(`form/${row._id}`, {
                      state: { record: row },
                    })
                  }}
                >
                  <IconEdit />
                </Button>
              )}

              <ConfirmationDialog
                type="strict"
                hint="Super"
                trigger={
                  <Button size="sm" variant="destructive">
                    <IconTrash />
                    Delete {selectedCount > 1 ? ` (${selectedCount})` : ""}
                  </Button>
                }
                onConfirm={async (dismiss) => {
                  const ids = selectedRows.map((row: any) => row._id)
                  for (const id of ids) {
                    await ThunderSDK.getModule(name).del({
                      params: { id },
                    })
                  }

                  dismiss()
                }}
              />

              <Button
                size="icon-sm"
                variant="secondary"
                onClick={() => table.resetRowSelection()}
                aria-label="Clear selection"
              >
                <IconX />
              </Button>
            </div>
          </div>
        </ActionBar>

        {isLoading ? (
          <TableSkeleton />
        ) : data?.results.length === 0 && !isLoading ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-destructive/10">
                <IconXMark className="text-destructive" />
              </EmptyMedia>
              <EmptyTitle>No results!</EmptyTitle>
              <EmptyDescription>
                adjust or clear filters to reveal issues.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <DataTable table={table} />
        )}
      </div>
    </div>
  )
}
