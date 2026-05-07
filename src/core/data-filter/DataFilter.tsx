/* eslint-disable react-refresh/only-export-components */
import React from "react"
import type { TColumnConfig, TSelectors } from "."
import { debounce } from "./debounce"
import { SwitchComp } from "./selectors/Boolean"
import { MultiSelectComp } from "./selectors/MultiOptions"
import { NumberComp } from "./selectors/Number"
import { SelectComp } from "./selectors/Option"
import { SearchComp } from "./selectors/String"
import { CalendarComp } from "./selectors/Date"
import { FieldGroup } from "@/components/ui/field"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconFilter } from "@tabler/icons-react"

export type TColumnValue<T extends keyof TSelectors> = Record<
  string,
  {
    type: T
    value: TSelectors[T]
    operator: string
  }
>

export type TDataFilterRef = {
  updateColumn: (update: (prev: TColumnConfig[]) => TColumnConfig[]) => void
  resetFilters: () => void
}

export type TDataFilter<C extends TColumnConfig> = {
  ref?: React.Ref<TDataFilterRef>
  columnsConfig: C[]
  value: TColumnValue<TColumnConfig["type"]>
  onValueChange: (value: TColumnValue<TColumnConfig["type"]>) => void
  debounceMs: number
  advanced: boolean
}

export const DataFilterContext =
  React.createContext<TDataFilter<TColumnConfig> | null>(null)

export function useDataFilter<C extends TColumnConfig>() {
  const ctx = React.useContext(DataFilterContext) as TDataFilter<C> | null
  if (!ctx) throw new Error("Must be used inside DataFilterProvider")
  return ctx
}

export const DataFilter = <T extends TColumnConfig>({
  columnsConfig,
  value = {},
  onValueChange,
  debounceMs = 500,
  ref,
}: Omit<Partial<TDataFilter<T>>, "columnsConfig" | "onValueChange"> &
  Pick<TDataFilter<T>, "columnsConfig" | "onValueChange"> &
  React.HTMLAttributes<HTMLDivElement>) => {
  const [advanced, setAdvanced] = React.useState(false)
  const [columns, setColumns] = React.useState<TColumnConfig[]>(columnsConfig)

  const debouncedOnChange = React.useCallback(
    () =>
      debounce((nextState: typeof value) => {
        onValueChange(nextState!)
      }, debounceMs),
    [debounceMs, onValueChange]
  )

  React.useEffect(() => {
    debouncedOnChange()
    return () => debouncedOnChange().cancel()
  }, [debouncedOnChange])

  const handleReset = () => onValueChange({})

  React.useImperativeHandle(ref, () => ({
    resetFilters: handleReset,
    updateColumn: (update) => {
      setColumns((prev) => update(prev))
    },
  }))

  return (
    <DataFilterContext.Provider
      value={{
        columnsConfig: columns,
        value,
        onValueChange,
        debounceMs,
        advanced,
      }}
    >
      {columns.length ? (
        <Dialog>
          <DialogTrigger
            render={(props) => (
              <div className="flex items-center gap-3">
                <DataFilterSelectors renderInitial />

                <Button variant="outline" {...props}>
                  <IconFilter />
                  <span className="hidden md:block">Filters</span>
                </Button>
              </div>
            )}
          ></DialogTrigger>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
              <DialogDescription>
                Use below fields to apply the filters
              </DialogDescription>
            </DialogHeader>
            <DialogPanel>
              <DataFilterSelectors />
            </DialogPanel>
            <DialogFooter variant="bare">
              <Button
                variant="ghost"
                onClick={() => setAdvanced(!advanced)}
                className="mr-auto"
              >
                {advanced ? "Hide" : "Show"} Advanced
              </Button>

              <Button variant="destructive" onClick={handleReset}>
                Reset
              </Button>
              <DialogClose
                render={<Button variant="secondary">Dismiss</Button>}
              ></DialogClose>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      ) : null}
    </DataFilterContext.Provider>
  )
}

function DataFilterSelectors({ renderInitial }: { renderInitial?: boolean }) {
  const { columnsConfig, value, onValueChange, advanced } = useDataFilter()
  const filterValue = React.useMemo(() => value ?? {}, [value])

  const changeHandler = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (column: TColumnConfig, value: any, operator: string) =>
      onValueChange({
        ...filterValue,
        [column.id]: {
          ...filterValue[column.id],
          value,
          operator,
        },
      }),
    [filterValue, onValueChange]
  )

  return (
    <FieldGroup>
      {(renderInitial ? [columnsConfig[0]] : columnsConfig)
        .map((col) => ({
          ...col,
          key: col.id,
          displayName: renderInitial ? undefined : col.label,
          enableOperator: renderInitial ? false : advanced,
          value: filterValue[col.id]?.value,
          onValueChange: (val: unknown, operator: string) =>
            changeHandler(col, val, operator),
        }))
        .map((column) => {
          switch (column.type) {
            case "string":
              return (
                <SearchComp
                  {...column}
                  value={filterValue[column.id]?.value as string}
                />
              )
            case "boolean":
              return (
                <SwitchComp
                  {...column}
                  value={filterValue[column.id]?.value as boolean}
                />
              )
            case "number":
              return (
                <NumberComp
                  {...column}
                  value={filterValue[column.id]?.value as number[]}
                />
              )
            case "option":
              return (
                <SelectComp
                  {...column}
                  value={filterValue[column.id]?.value as string}
                />
              )
            case "multiOption":
              return (
                <MultiSelectComp
                  {...column}
                  value={filterValue[column.id]?.value as string[]}
                />
              )
            case "date":
              return column.mode === "range" ? (
                <CalendarComp
                  {...column}
                  mode="range"
                  value={filterValue[column.id]?.value as string[]}
                />
              ) : (
                <CalendarComp
                  {...column}
                  mode="single"
                  value={filterValue[column.id]?.value as string}
                />
              )
            default:
              return null
          }
        })}
    </FieldGroup>
  )
}
