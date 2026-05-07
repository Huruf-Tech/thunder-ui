import type { TablerIcon } from "@tabler/icons-react"

export type TSelectors = {
  string: string
  number: number | number[]
  boolean: boolean
  option: string
  multiOption: string[]
  date: Date[] | Date
}

export const RangeOperator = {
  BETWEEN: "$bt",
  NOT_BETWEEN: "$nbt",
} as const

export const StringOperator = {
  MATCH: "$regex",
  NOT_MATCH: "$nregex",
} as const

export const NumberOperator = {
  EQUAL: "$eq",
  NOT_EQUAL: "$ne",
  GREATER_THAN: "$gte",
  LESS_THAN: "$lte",
} as const

export const BooleanOperator = {
  EQUAL: "$eq",
  NOT_EQUAL: "$ne",
} as const

export const OptionOperator = {
  EQUAL: "$eq",
  NOT_EQUAL: "$ne",
} as const

export const MultiOptionOperator = {
  ALL: "$all",
  INCLUDES: "$in",
  EXCLUDES: "$nin",
} as const

export const DateOperator = {
  EQUAL: "$eq",
  NOT_EQUAL: "$ne",
  GREATER_THAN: "$gte",
  LESS_THAN: "$lte",
} as const

type BaseConfig = {
  id: string
  icon?: TablerIcon
  label?: string
  placeholder?: string
  enableOperator?: boolean
  operator?: string
}

export type TStringColumnConfig = BaseConfig & {
  type: "string"
  value: string
  onValueChange: (value: string, operator: string) => void
}

export type TBooleanColumnConfig = BaseConfig & {
  type: "boolean"
  value: boolean
  onValueChange: (value: boolean, operator: string) => void
}

export type TNumberColumnConfig = BaseConfig & {
  type: "number"
  min: number
  max: number
  value: number[]
  onValueChange: (value: number[], operator: string) => void
}

export type TDateColumnConfig = BaseConfig & {
  type: "date"
} & (
    | {
        mode: "single"
        value: string | null
        onValueChange: (value: Date | null, operator: string) => void
      }
    | {
        mode: "range"
        value: (string | null)[]
        onValueChange: (value: (Date | null)[], operator: string) => void
      }
  )

export type TOptions = {
  label: string
  value: string
}

export type TOptionColumnConfig = BaseConfig & {
  type: "option"
  options: TOptions[] | null
  value: string
  onValueChange: (value: string, operator: string) => void
}

export type TMultiOptionColumnConfig = BaseConfig & {
  type: "multiOption"
  options: TOptions[] | null
  value: string[]
  onValueChange: (value: string[], operator: string) => void
}

export type TColumnConfig =
  | Omit<TStringColumnConfig, "value" | "onValueChange">
  | Omit<TBooleanColumnConfig, "value" | "onValueChange">
  | Omit<TNumberColumnConfig, "value" | "onValueChange">
  | Omit<TDateColumnConfig, "value" | "onValueChange">
  | Omit<TOptionColumnConfig, "value" | "onValueChange">
  | Omit<TMultiOptionColumnConfig, "value" | "onValueChange">
