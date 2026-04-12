/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react"
import { ThunderSDK } from "thunder-sdk"
import {
  Controller,
  useForm,
  type Control,
  type SubmitHandler,
} from "react-hook-form"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"

import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dropdown } from "../custom/Dropdown"
import { Multiselect } from "../custom/Multiselect"
import { Tag, TagInput, TagInputBadges } from "../custom/TagInput"

import { JSONSchemaToFields, type TField } from "../lib/jsonSchemaToFields"

const fieldsFromModuleMetadata = async (metadata: any) => {
  if (!metadata) return []

  if (typeof metadata.crud?.insertSchema !== "object") return []

  // Convert json schema to fields data
  const results = await JSONSchemaToFields.toFields(
    "data",
    metadata.crud.insertSchema
  )

  console.log(results)

  return results
}

const renderField = (
  id: string,
  field: TField,
  control: Control<any, any, any>
) => {
  if (field.type === "boolean")
    return (
      <Controller
        name={field.name}
        control={control}
        rules={{ required: field.required && "This field is required!" }}
        render={(def) => (
          <Switch
            id={id}
            checked={def.field.value ?? false}
            onCheckedChange={def.field.onChange}
          />
        )}
      />
    )

  if (field.enum) {
    return field.multi ? (
      <Controller
        name={field.name}
        control={control}
        rules={{ required: field.required && "This field is required!" }}
        render={(def) => (
          <Multiselect
            id={id}
            multiple
            autoHighlight
            items={field.enum}
            value={def.field.value}
            onValueChange={def.field.onChange}
          />
        )}
      />
    ) : (
      <Controller
        name={field.name}
        control={control}
        rules={{ required: field.required && "This field is required!" }}
        render={(def) => (
          <Dropdown
            id={id}
            items={(field.enum ?? []).map((value) =>
              typeof value === "object" && value
                ? value
                : { value, label: value }
            )}
            value={def.field.value ?? ""}
            onValueChange={def.field.onChange}
          />
        )}
      />
    )
  }

  if (["text", "number", "url", "email", "phone"].includes(field.type)) {
    if (field.multi) {
      return (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required && "This field is required!" }}
          render={(def) => (
            <Tag
              id={id}
              values={def.field.value}
              onValueChange={def.field.onChange}
              type={field.type}
            >
              <TagInput />
              <TagInputBadges />
            </Tag>
          )}
        />
      )
    }

    if (field.type === "text" && (!field.maxLength || field.maxLength > 100)) {
      return (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required && "This field is required!" }}
          render={(def) => (
            <Textarea
              id={id}
              placeholder={field.example ?? field.name}
              maxLength={field.maxLength}
              value={def.field.value ?? ""}
              onChange={(e) => def.field.onChange(e.target.value)}
            />
          )}
        />
      )
    }
  }

  return (
    <Controller
      name={field.name}
      control={control}
      rules={{ required: field.required && "This field is required!" }}
      render={(def) => (
        <Input
          id={id}
          type={field.type}
          placeholder={field.example ?? field.name}
          maxLength={field.maxLength}
          value={def.field.value ?? ""}
          onChange={(e) => def.field.onChange(e.target.value)}
        />
      )}
    />
  )
}

JSONSchemaToFields.resolveRef = async (ref) => {
  const { results } = (await ThunderSDK.getModule(ref).get({})) as {
    results: any[]
  }

  return results.map((item: any) => ({
    label: item.label ?? item.name ?? item.title,
    value: item._id,
  }))
}

export interface IFormPageProps {
  name: string
}

export function FormPage({ name }: IFormPageProps) {
  const metadata = React.useMemo(() => ThunderSDK.getMetadata(name), [name])
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>()
  const [fields, setFields] = React.useState<TField[]>([])

  React.useEffect(() => {
    ;(async () => {
      setFields(await fieldsFromModuleMetadata(metadata))
    })()
  }, [metadata])

  const onSubmit: SubmitHandler<any> = async (body) => {
    await ThunderSDK.getModule(name).create({
      body,
    })
  }

  return (
    <form className="mx-auto w-full max-w-md" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Form</FieldLegend>
          <FieldDescription>
            Fill the form below to create a new {name} entry. All fields are
            required
          </FieldDescription>
          {/* <FieldGroup></FieldGroup> */}
          {fields.map((field) => {
            const id = crypto.randomUUID()

            if (!field.required && field.type === "hidden") return

            return (
              <Field key={field.name}>
                <FieldLabel htmlFor={id} className="capitalize">
                  {field.name}
                </FieldLabel>
                {renderField(id, field, control)}
                <FieldDescription>{field.description}</FieldDescription>
                <FieldError>
                  {errors[field.name]?.message?.toString()}
                </FieldError>
              </Field>
            )
          })}
        </FieldSet>

        <Button type="submit" disabled={isSubmitting}>
          Submit
        </Button>
      </FieldGroup>
    </form>
  )
}
