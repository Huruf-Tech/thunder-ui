/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React from "react"
import {
  type Column,
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
import {
  IconArrowBarToLeft,
  IconArrowBarToRight,
  IconDots,
  IconEdit,
  IconPinnedOff,
  IconTrash,
  IconX,
  IconXMark,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

export type DataTableAction = "update" | "delete"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAction?: (action: DataTableAction, selectedRows: TData[]) => void
}

const getPinningStyles = (column: Column<any>): React.CSSProperties => {
  const isPinned = column.getIsPinned()
  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
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
        enablePinning: false,
      },
      ...columns.map((v) => ({
        ...v,
        size: 220,
        minSize: 120,
      })),
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

  const hasRows = !!table.getRowModel().rows?.length

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="max-w-fit">
              Visibility
            </Button>
          }
        ></DropdownMenuTrigger>

        <DropdownMenuContent className="max-h-100 overflow-auto">
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
        <div className="flex animate-in items-center justify-between gap-3 rounded-lg border bg-background/95 px-4 py-3 shadow-sm backdrop-blur-sm fade-in">
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

      <div className="flex-1 flex flex-col gap-3 min-h-0 rounded-xl border overflow-hidden">
        <div
          className={cn(
            "relative w-full",
            hasRows && "min-h-0 flex-1 [&>div]:h-full [&>div]:overflow-y-auto"
          )}
        >
          <Table className="table-fixed border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-9 bg-background/90 [&_tr]:border-b-0! *:[tr]:first:*:[th]:first:rounded-ss-xl *:[tr]:last:*:[th]:last:rounded-se-xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const { column } = header
                    const isPinned = column.getIsPinned()
                    const isLastLeftPinned =
                      isPinned === "left" && column.getIsLastColumn("left")
                    const isFirstRightPinned =
                      isPinned === "right" && column.getIsFirstColumn("right")

                    return (
                      <TableHead
                        key={header.id}
                        className="relative truncate py-4 data-pinned:bg-background/90 data-pinned:backdrop-blur-xs"
                        data-last-col={
                          isLastLeftPinned
                            ? "left"
                            : isFirstRightPinned
                              ? "right"
                              : undefined
                        }
                        data-pinned={isPinned || undefined}
                        {...{
                          colSpan: header.colSpan,
                          style: {
                            width: header.getSize(),
                            ...getPinningStyles(column),
                          },
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </span>

                          {!header.isPlaceholder &&
                            header.column.getCanPin() &&
                            (header.column.getIsPinned() ? (
                              <Button
                                aria-label={`Unpin ${header.column.columnDef.header as string} column`}
                                onClick={() => {
                                  header.column.pin(false)

                                  table.setColumnPinning((old) => {
                                    return {
                                      ...old,
                                      left: old.left?.filter(
                                        (v) =>
                                          v !== "select" &&
                                          v !== header.column.id
                                      ),
                                    }
                                  })
                                }}
                                size="icon"
                                title={`Unpin ${header.column.columnDef.header as string} column`}
                                variant="ghost"
                              >
                                <IconPinnedOff
                                  aria-hidden="true"
                                  className="text-sidebar-primary"
                                  size={16}
                                />
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      aria-label={`Pin options for ${header.column.columnDef.header as string} column`}
                                      className="size-7 shadow-none"
                                      size="icon"
                                      title={`Pin options for ${header.column.columnDef.header as string} column`}
                                      variant="ghost"
                                    >
                                      <IconDots
                                        aria-hidden="true"
                                        className="opacity-60"
                                        size={16}
                                      />
                                    </Button>
                                  }
                                ></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      table.setColumnPinning((old) => {
                                        const left = old.left ?? []

                                        return {
                                          ...old,
                                          left: [
                                            "select",
                                            ...left.filter(
                                              (id) =>
                                                id !== "select" &&
                                                id !== header.column.id
                                            ),
                                            header.column.id,
                                          ],
                                        }
                                      })
                                    }
                                  >
                                    <IconArrowBarToLeft
                                      aria-hidden="true"
                                      className="opacity-60"
                                      size={16}
                                    />
                                    Stick to left
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => header.column.pin("right")}
                                  >
                                    <IconArrowBarToRight
                                      aria-hidden="true"
                                      className="opacity-60"
                                      size={16}
                                    />
                                    Stick to right
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ))}
                        </div>

                        {header.column.getCanResize() && (
                          <div
                            {...{
                              className:
                                "group absolute top-0 h-full cursor-col-resize select-none touch-none -right-0 z-10 flex items-center justify-center before:absolute before:w-px before:inset-y-0 before:translate-x-px transition ease-in-out duration-300",
                              onDoubleClick: () => header.column.resetSize(),
                              onMouseDown: header.getResizeHandler(),
                              onTouchStart: header.getResizeHandler(),
                            }}
                          >
                            <div className="h-6 w-1 rounded-md bg-border group-hover:bg-muted-foreground/70"></div>
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            {hasRows ? (
              <TableBody className="border-0! [&_tr]:hover:bg-transparent!">
                {[
                  ...table.getRowModel().rows,
                  ...table.getRowModel().rows,
                  ...table.getRowModel().rows,
                  ...table.getRowModel().rows,
                  ...table.getRowModel().rows,
                  ...table.getRowModel().rows,
                  ...table.getRowModel().rows,
                  ...table.getRowModel().rows,
                  ...table.getRowModel().rows,
                ].map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b-0"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const { column } = cell
                      const isPinned = column.getIsPinned()
                      const isLastLeftPinned =
                        isPinned === "left" && column.getIsLastColumn("left")
                      const isFirstRightPinned =
                        isPinned === "right" && column.getIsFirstColumn("right")

                      return (
                        <TableCell
                          key={cell.id}
                          className="group relative truncate py-4 data-pinned:bg-background/90 data-pinned:backdrop-blur-xs"
                          data-last-col={
                            isLastLeftPinned
                              ? "left"
                              : isFirstRightPinned
                                ? "right"
                                : undefined
                          }
                          data-pinned={isPinned || undefined}
                          style={{
                            width: cell.column.getSize(),
                            ...getPinningStyles(column),
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            ) : null}
          </Table>
        </div>

        {!hasRows ? (
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
        ) : null}
      </div>
    </div>
  )
}
