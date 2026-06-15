import {
  Pagination as _Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "./ui/select"
import React, { useMemo } from "react"

function calculatePaginationRange(
  active: number,
  total: number,
  itemsToDisplay: number,
  startFrom: 0 | 1
): { label: number; value: number }[] {
  if (total <= 0 || itemsToDisplay <= 0) return []
  const maxActive = total - 1

  const safeActive = Math.min(Math.max(active, 0), maxActive)

  const activeValue = safeActive

  const groupIndex = Math.floor(activeValue / itemsToDisplay)

  const startValue = groupIndex * itemsToDisplay
  const endValue = Math.min(startValue + itemsToDisplay - 1, total - 1)

  return Array.from({ length: endValue - startValue + 1 }, (_, i) => {
    const value = startValue + i

    return {
      label: value + startFrom,
      value: value,
    }
  })
}

export function Pagination({
  active,
  total,
  limit = 20,
  paginationItemsToDisplay = 3,
  onChange,
}: {
  active: number
  total: number
  limit?: number
  paginationItemsToDisplay?: number
  onChange: (page: number) => void
}) {
  const startFrom = 1
  const totalPages = React.useMemo(() => {
    return Array.from({ length: Math.ceil(total / limit) }, (_, i) => ({
      label: i + startFrom,
      value: i,
    }))
  }, [total, limit])

  const range = useMemo(
    () =>
      calculatePaginationRange(
        active,
        total,
        paginationItemsToDisplay,
        startFrom
      ),
    [active, total, limit, paginationItemsToDisplay]
  )

  return (
    <_Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onChange(Math.max(active - 1, 0))}
          />
        </PaginationItem>
        {range.map((page) => (
          <PaginationItem key={page.value} value={page.value}>
            <PaginationLink
              className={page.value === active ? "bg-primary text-white" : ""}
              onClick={() => onChange(page.value)}
            >
              {page.label}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <Select items={totalPages}>
            <SelectTrigger className="w-full max-w-48">
              <PaginationEllipsis />
            </SelectTrigger>
            <SelectContent className="max-h-50">
              <SelectGroup>
                <SelectLabel>Pages</SelectLabel>
                {totalPages.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() => onChange(Math.min(active + 1, total))}
          />
        </PaginationItem>
      </PaginationContent>
    </_Pagination>
  )
}
