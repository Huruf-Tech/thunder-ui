import React from "react"
import { type TColumnConfig } from ".."
import { type TColumnValue, type TDataFilterRef } from "../DataFilter"

export const useDataFilter = () => {
  const DataFilterRef = React.useRef<TDataFilterRef>(null)
  const [filters, setFilters] = React.useState<
    TColumnValue<TColumnConfig["type"]>
  >({})

  return { filterRef: DataFilterRef, filters, setFilters }
}
