/* eslint-disable @typescript-eslint/no-explicit-any */
import { Checkbox } from "@/components/ui/checkbox"
import type { ColumnDef } from "@tanstack/react-table"
import { ThunderSDK } from "thunder-sdk"

const columnsFromModuleMetadata = (metadata: any): ColumnDef<unknown>[] => {
  if (!metadata) return []

  if (typeof metadata.crud?.schema !== "object") return []

  // Convert json schema to columns
  return Object.entries<{
    type: string
    format?: string
    label?: string
  }>(metadata.crud.schema.properties).map(([key, { label }]) => ({
    accessorKey: key,
    header: label ?? key,
  }))
}

const metadata = (name: string) => ThunderSDK.getMetadata(name)

export default function columns(name: string): ColumnDef<unknown, any>[] {
  const _columns = columnsFromModuleMetadata(metadata(name))

  return [
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
    ..._columns.map((v) => ({
      ...v,
      size: 220,
      minSize: 120,
    })),
  ]
}
