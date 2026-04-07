/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react"
import { ThunderSDK } from "thunder-sdk"
import { Multiselect } from "../custom/Multiselect"
import { Switch } from "../ui/switch"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../ui/field"
import { Input } from "../ui/input"
import { Dropdown } from "../custom/Dropdown"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

export type TFieldDef = {
  name: string
  type: string
  format?: string
  enum?: string[]
  maxLength?: number
}

const fieldsFromModuleMetadata = (metadata: any): TFieldDef[] => {
  console.log(metadata)
  if (!metadata) return []

  if (typeof metadata.crud?.insertSchema !== "object") return []

  // Convert json schema to fields data
  return Object.entries<{
    type: string
    format?: string
  }>(metadata.crud.insertSchema.properties).map(([key]) => ({
    name: key,
    type: metadata.crud.insertSchema.properties[key].type,
    format: metadata.crud.insertSchema.properties[key].format,
    enum: metadata.crud.insertSchema.properties[key].enum,
    maxLength: metadata.crud.insertSchema.properties[key].maxLength,
  }))
}

const renderField = (field: TFieldDef) => {
  switch (field.type) {
    case "number":
      return <Input type="number" placeholder={field.name} />
    case "array":
      return <Multiselect items={[]} defaultValue={[]} />
    case "boolean":
      return <Switch />
    default:
      return field.enum?.length ? (
        <Dropdown
          items={field.enum.map((value) => ({ value, label: value }))}
        />
      ) : !field.maxLength || field.maxLength > 100 ? (
        <Textarea placeholder={field.name} maxLength={field.maxLength} />
      ) : (
        <Input
          type="text"
          placeholder={field.name}
          maxLength={field.maxLength}
        />
      )
  }
}

export interface IFormPageProps {
  name: string
}

export function FormPage({ name }: IFormPageProps) {
  const metadata = React.useMemo(
    () => ThunderSDK.getMetadata(name),
    [name]
  )

  return (
    <form className="mx-auto w-full max-w-md">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Form</FieldLegend>
          <FieldDescription>
            Fill the form below to create a new {name} entry. All fields are
            required
          </FieldDescription>
          <FieldGroup></FieldGroup>
          {fieldsFromModuleMetadata(metadata).map((field) => (
            <Field key={field.name}>
              <FieldLabel htmlFor="checkout-7j9-card-name-43j">
                {field.name}
              </FieldLabel>
              {renderField(field)}
            </Field>
          ))}
        </FieldSet>

        <Button type="submit">Submit</Button>
      </FieldGroup>
    </form>
  )
}
