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
import { IconEdit, IconTrash, IconX, IconXMark } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

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
        size: 30,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
      ...columns.map((v, idx) => ({ ...v, size: 220, minSize: idx === 1 ? 220 : 120 })),
    ],
    [columns]
  )

  const table = useReactTable({
    data,
    columns: columnsWithSelect,
    state: {
      rowSelection,
    },
    columnResizeMode: "onChange",
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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="max-w-fit">
              Visibility
            </Button>
          }
        ></DropdownMenuTrigger>

        <DropdownMenuContent>
          {table
            .getAllColumns()
            .filter((col) => col.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.columnDef.header as string}
                </DropdownMenuCheckboxItem>
              )
            })}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="sticky top-17.5 z-40 flex animate-in items-center justify-between gap-3 rounded-lg border bg-background/95 px-4 py-3 shadow-sm backdrop-blur-sm fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedCount}</span>{" "}
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
      <div>
        <Table
          className="table-fixed"
          style={{
            width: table.getCenterTotalSize(),
          }}
        >
          <TableHeader className="[&_tr]:border-b-0! [&_tr]:hover:bg-transparent!">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="relative first:px-0!"
                      {...{
                        colSpan: header.colSpan,
                        style: {
                          width: header.getSize(),
                        },
                      }}
                    >
                      <span className="truncate">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </span>

                      {header.column.getCanResize() && (
                        <div
                          {...{
                            className:
                              "group absolute top-0 h-full w-4 cursor-col-resize select-none touch-none right-0 z-10 flex items-center justify-center before:absolute before:w-px before:inset-y-0 before:translate-x-px transition ease-in-out duration-300",
                            onDoubleClick: () => header.column.resetSize(),
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                          }}
                        >
                          <div className="h-6 w-0.5 rounded-md bg-border group-hover:bg-muted-foreground/70"></div>
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          {table.getRowModel().rows?.length ? (
            <TableBody className="border-0! [&_tr]:hover:bg-transparent!">
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="truncate first:px-0!"
                      style={{
                        width: cell.column.getSize(),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          ) : null}
        </Table>

        {!table.getRowModel().rows?.length ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconXMark />
              </EmptyMedia>
              <EmptyTitle>No results!</EmptyTitle>
              <EmptyDescription>
                adjust or clear filters to reveal issues.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </div>
    </div>
  )
}
