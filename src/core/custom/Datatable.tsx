/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React from "react"
import {
  type Column,
  type ColumnDef,
  type Table as TTable,
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
  IconPinnedOff,
  IconXMark,
} from "@tabler/icons-react"
import {
  DropdownMenu,
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
  header?: (data: { table: TTable<TData> }) => React.ReactNode
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
  header,
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // Prepend a selection checkbox column to the provided columns
  const allColumns: ColumnDef<TData, any>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected()
                ? true
                : table.getIsSomeRowsSelected()
                  ? true
                  : false
            }
            onCheckedChange={(value) => {
              table.toggleAllRowsSelected(!!value)
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value)
            }}
            onClick={(event) => event.stopPropagation()}
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
    columns: allColumns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  })

  const hasRows = !!table.getRowModel().rows?.length

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      {header?.({ table })}
      {/* Bulk action bar */}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-xl border">
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
                {table.getRowModel().rows.map((row) => (
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
