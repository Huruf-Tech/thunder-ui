/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { FilterSelector } from "./components/filter-selector"
import { ActiveFilters } from "./components/active-filters"
import { FilterActions } from "./components/filter-actions"
import { CardSelectAll } from "./components/card-select-all"
import {
  IconCalendar,
  IconCircleDashed,
  IconH1,
  IconLink,
  IconMail,
  IconNumber,
  IconSquareCheck,
  type TablerIcon,
} from "@tabler/icons-react"

export type TValue = { value: any ; operator: string }
export type TFilterValue = Record<string, TValue>

export type TFilter = {
  filters?: TFilterValue
  fields: TField[]
  onChange: (value?: TFilterValue) => void
  children?: React.ReactNode

  // Card View Selection Props
  isCardView?: boolean
  selectAllChecked?: boolean | "indeterminate"
  selectedCount?: number
  totalCount?: number
  onSelectAllChange?: (checked: boolean) => void
}

export function filterIcon(field: TField): TablerIcon {
  if (field.enum) return IconCircleDashed

  switch (field.type) {
    case "text":
    default:
      return IconH1
    case "url":
      return IconLink
    case "date":
      return IconCalendar
    case "email":
      return IconMail
    case "boolean":
      return IconSquareCheck
    case "number":
      return IconNumber
  }
}

const FiltersContext = React.createContext<
  {
    filters?: TFilterValue
    fields: TField[]
    onChange: (value?: TFilterValue) => void
  } | null
>(null)

export function useFilters() {
  const context = React.useContext(FiltersContext)

  if (!context) {
    throw new Error("useFilters must be used within FiltersProvider")
  }

  return context
}

export function Filters({
  filters,
  fields,
  onChange,
  isCardView,
  selectAllChecked,
  selectedCount,
  totalCount,
  onSelectAllChange,
}: TFilter) {
  return (
    <FiltersContext.Provider value={{ filters, fields, onChange }}>
      <div className="flex min-w-0 grow items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Render Card Select All Badge only when in Card View */}
          {isCardView && (
            <CardSelectAll
              checked={selectAllChecked}
              selectedCount={selectedCount}
              totalCount={totalCount}
              onChange={onSelectAllChange}
            />
          )}

          <FilterSelector />
          <FilterActions
            hasFilters={!!filters}
            onClick={() => onChange(undefined)}
          />
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scroll-mask-x">
            <ActiveFilters fields={fields} />
          </div>
        </div>
      </div>
    </FiltersContext.Provider>
  )
}
