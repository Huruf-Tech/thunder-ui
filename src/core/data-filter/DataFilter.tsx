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
          displayName: renderInitial ? undefined : col.displayName,
          enableOperator: renderInitial ? false : advanced,
        }))
        .map((column) => {
          switch (column.type) {
            case "string":
              return (
                <SearchComp
                  key={column.id}
                  {...column}
                  value={filterValue[column.id]?.value as string}
                  onValueChange={(val, operator) =>
                    changeHandler(column, val, operator)
                  }
                />
              )
            case "boolean":
              return (
                <SwitchComp
                  key={column.id}
                  {...column}
                  value={filterValue[column.id]?.value as boolean}
                  onValueChange={(val, operator) =>
                    changeHandler(column, val, operator)
                  }
                />
              )
            case "number":
              return (
                <NumberComp
                  key={column.id}
                  {...column}
                  value={filterValue[column.id]?.value as number[]}
                  onValueChange={(val, operator) =>
                    changeHandler(column, val, operator)
                  }
                />
              )
            case "option":
              return (
                <SelectComp
                  key={column.id}
                  {...column}
                  value={filterValue[column.id]?.value as string}
                  onValueChange={(val, operator) =>
                    changeHandler(column, val, operator)
                  }
                />
              )
            case "multiOption":
              return (
                <MultiSelectComp
                  key={column.id}
                  {...column}
                  value={filterValue[column.id]?.value as string[]}
                  onValueChange={(val, operator) =>
                    changeHandler(column, val, operator)
                  }
                />
              )
            case "date":
              return column.mode === "range" ? (
                <CalendarComp
                  key={column.id}
                  {...column}
                  mode="range"
                  value={filterValue[column.id]?.value as string[]}
                  onValueChange={(val, operator) =>
                    changeHandler(column, val, operator)
                  }
                />
              ) : (
                <CalendarComp
                  key={column.id}
                  {...column}
                  mode="single"
                  value={filterValue[column.id]?.value as string}
                  onValueChange={(val, operator) =>
                    changeHandler(column, val, operator)
                  }
                />
              )
            default:
              return null
          }
        })}
    </FieldGroup>
  )
}
