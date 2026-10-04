import type { TFilters } from "thunder-sdk/types"

export const FieldTypes = [
  "text",
  "number",
  "boolean",
  "date",
  "email",
  "url",
  "hidden",
  "phone",
] as const

export type TFieldType = (typeof FieldTypes)[number]
export type TField = {
  type: TFieldType | "integer" | "array" | "object"
  group?: string
  groupClassName?: string
  className?: string
  groupStyle?: React.CSSProperties
  style?: React.CSSProperties
  fields?: Array<TField>
  name?: string
  parentName?: string
  defaultValue?: unknown
  label?: string
  placeholder?: string
  description?: string
  multi?: boolean
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  minimum?: number
  maximum?: number
  required?: string[]
  optional?: boolean
  enum?: string[] | Array<{ label: string; value: unknown }>
  pattern?: string
  example?: string
  ref?: string
  refFilters?: TFilters;
  refLabel?: string | string[]
  refValue?: string
  fieldHint?: string
  const?: unknown
  canFilter?: boolean
  requirementKey?: string
  fileType?: string
  fileSize?: number
  filterSchema?: string
  ignoreQueryValue?: boolean
  queryValue?: string
}

export class JSONSchemaToFields {
  protected static resolveFieldType(type: string, format?: string): TFieldType {
    switch (format) {
      case "uri": {
        return "url"
      }

      case "date-time": {
        return "date"
      }

      case "email": {
        return "email"
      }

      case "e164": {
        return "phone"
      }

      default: {
        return FieldTypes.includes(type as TFieldType)
          ? (type as TFieldType)
          : type === "integer"
            ? "number"
            : "text"
      }
    }
  }

  protected static _toFields(
    name: string | undefined,
    schema: unknown,
    hints?: Partial<TField>
  ): TField[] {
    if (typeof schema !== "object" || schema === null) {
      throw new Error("Cannot construct form fields from an invalid schema!")
    }

    const type =
      "type" in schema && typeof schema.type === "string"
        ? schema.type
        : "string"

    if (
      type === "object" &&
      "properties" in schema &&
      typeof schema.properties === "object" &&
      schema.properties !== null
    ) {
      return [
        {
          ...hints,
          ...schema,
          name,
          type: "object",
          fields: Object.entries(schema.properties).flatMap(([prop, def]) =>
            this._toFields(prop, def, {
              parentName: name,
              ...("required" in schema && schema.required instanceof Array
                ? { optional: !schema.required.includes(prop) }
                : {}),
            })
          ),
        },
      ]
    }

    if (type === "array") {
      if (
        "items" in schema &&
        typeof schema.items === "object" &&
        schema.items !== null
      ) {
        if (
          "type" in schema.items &&
          ["object", "array"].includes(schema.items.type as string)
        ) {
          return [
            {
              ...hints,
              ...schema,
              name,
              type: "array",
              fields: this._toFields(undefined, schema.items, {
                parentName: name,
              }),
            },
          ]
        }

        return this._toFields(name, schema.items, {
          ...hints,
          ...schema,
          multi: true,
        })
      }

      if (
        "prefixItems" in schema &&
        typeof schema.prefixItems === "object" &&
        schema.prefixItems !== null &&
        schema.prefixItems instanceof Array
      ) {
        return schema.prefixItems.flatMap((items, index) =>
          this._toFields(`${name}.${index}`, items, {
            parentName: name,
          })
        )
      }
    }

    const field = {
      ...hints,
      ...schema,
      name,
      type: this.resolveFieldType(
        type,
        "format" in schema && typeof schema.format === "string"
          ? schema.format
          : undefined
      ),
    }

    return [field]
  }

  static resolveRef?: (
    ref: string,
    field: TField
  ) => Promise<Array<{ label: string; value: unknown }>>

  protected static async resolveField(field: TField): Promise<TField> {
    if (typeof field.ref === "string") {
      if (typeof this.resolveRef !== "function") {
        throw new Error("Unable to resolve reference! No implementation!")
      }

      field.enum = await this.resolveRef(field.ref, field)
    }

    return field
  }

  protected static async resolveDeepFields(
    fields: TField[]
  ): Promise<TField[]> {
    return await Promise.all(
      fields.map(async (field) => {
        if (["array", "object"].includes(field.type)) {
          field.fields = await this.resolveDeepFields(field.fields ?? [])
        }

        return await this.resolveField(field)
      })
    )
  }

  static async toFields(
    name: string | undefined,
    schema: unknown,
    opts?: {
      resolveRef?: boolean
    }
  ): Promise<TField[]> {
    const fields = this._toFields(name, schema)

    if (!opts?.resolveRef) return fields

    return await this.resolveDeepFields(fields)
  }

  static flatten(
    fields: TField[],
    opts?: {
      parentName?: string
      excludeArray?: boolean
    }
  ): TField[] {
    return fields.flatMap((field) => {
      if (opts?.excludeArray && field.type === "array") return []

      if (field.fields instanceof Array && field.fields.length) {
        return this.flatten(field.fields, {
          ...opts,
          parentName: [
            opts?.parentName,
            field.name,
            field.type === "array" ? "0" : undefined,
          ]
            .filter(Boolean)
            .join("."),
        })
      }

      delete field.parentName

      field.name = [opts?.parentName, field.name].filter(Boolean).join(".")

      return field
    })
  }
}
