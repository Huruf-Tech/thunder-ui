"use client"
import React from "react"
import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { IconEdit, IconTrash, IconX } from "@tabler/icons-react"

export type DataTableAction = "update" | "delete"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAction?: (action: DataTableAction, selectedRows: TData[]) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onAction,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Prepend a selection checkbox column to the provided columns
  const columnsWithSelect: ColumnDef<TData, any>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
    ],
    [columns]
  )

  const table = useReactTable({
    data,
    columns: columnsWithSelect,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const isSingleSelection = selectedCount === 1

  const handleAction = (action: DataTableAction) => {
    if (!onAction) return
    const selectedData = selectedRows.map((row) => row.original)
    onAction(action, selectedData)
  }

  const clearSelection = () => {
    setRowSelection({})
  }

  return (
    <div className="relative flex flex-col gap-3">
      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="sticky top-[70px] z-40 flex items-center justify-between gap-3 rounded-lg border bg-background/95 px-4 py-3 shadow-sm backdrop-blur-sm animate-in fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {selectedCount}
            </span>{" "}
            row{selectedCount > 1 ? "s" : ""} selected
          </div>
          <div className="flex items-center gap-2">
            {isSingleSelection && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("update")}
              >
                <IconEdit className="mr-1.5 size-4" />
                Update
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleAction("delete")}
            >
              <IconTrash className="mr-1.5 size-4" />
              Delete{selectedCount > 1 ? ` (${selectedCount})` : ""}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <IconX className="size-4" />
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnsWithSelect.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

