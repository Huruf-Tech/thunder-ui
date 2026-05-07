/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BooleanOperator,
  DateOperator,
  MultiOptionOperator,
  NumberOperator,
  OptionOperator,
  RangeOperator,
  StringOperator,
  type TColumnConfig,
} from "."
import type { TColumnValue } from "./DataFilter"

export const Operators = {
  ...RangeOperator,
  ...StringOperator,
  ...NumberOperator,
  ...BooleanOperator,
  ...OptionOperator,
  ...MultiOptionOperator,
  ...DateOperator,
} as const

export type TServerValueTypes =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "regex"
  | "objectId"

export const valueWithType = (
  type: TServerValueTypes,
  value: any,
  options?: {
    regexFlags?: string
  }
) => {
  return {
    type,
    value: `${value}`,
    options,
  }
}

export const filterToMongo = (filter: TColumnValue<TColumnConfig["type"]>) => {
  const mongoFilter: Record<string, any> = {}

  for (const key in filter) {
    const condition = filter[key]

    if (condition.type === "multiOption") {
      mongoFilter[key] = {
        [condition.operator]: (
          condition.value as string[] | Date[] | number[]
        ).map((val) => valueWithType("string", val)),
      }
    } else if (
      ["number", "date"].includes(condition.type) &&
      Array.isArray(condition.value)
    ) {
      const type = condition.type === "number" ? "number" : "date"

      const query = {
        $gte: valueWithType(type, (condition.value as any[])[0]),
        $lte: valueWithType(type, (condition.value as any[])[1]),
      }
      mongoFilter[key] =
        condition.operator === Operators.BETWEEN ? query : { $not: query }
    } else {
      const queryValue = valueWithType(
        condition.type === "string"
          ? "regex"
          : (condition.type as "string" | "number" | "boolean" | "date"),
        condition.value,
        condition.type === "string" ? { regexFlags: "i" } : undefined
      )

      mongoFilter[key] =
        condition.operator === Operators.NOT_MATCH
          ? { $not: { $regex: queryValue } }
          : { [condition.operator]: queryValue }
    }
  }

  return mongoFilter
}
