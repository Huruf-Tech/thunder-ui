/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react"
import { useParams, useLocation } from "react-router"
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
import { AvatarUpload } from "../custom/AvatarUpload"
import { ImageUpload } from "../custom/ImageUpload"
import { handleUpload } from "../lib/utils"

import { JSONSchemaToFields, type TField } from "../lib/jsonSchemaToFields"

const fieldsFromModuleMetadata = async (metadata: any) => {
  if (!metadata) return []

  if (typeof metadata.crud?.insertSchema !== "object") return []

  // Convert json schema to fields data
  const results = await JSONSchemaToFields.toFields(
    undefined,
    metadata.crud.insertSchema
  )

  console.log("Fields:", results)

  return results
}

const renderField = (
  id: string,
  field: TField,
  control: Control<any, any, any>
) => {
  
  if (field.type === "url" && field.fieldHint === "avatar") {
    return (
      <Controller
        name={field.name!}
        control={control}
        rules={{ required: field.required && "This field is required!" }}
        render={(def) => (
          <AvatarUpload
            id={id}
            initialFile={
              def.field.value && typeof def.field.value === "string"
                ? {
                    id: def.field.value,
                    type: "avatar",
                    name: def.field.value,
                    url: def.field.value,
                    size: 0,
                  }
                : undefined
            }
            onUpload={async ({ file }, signal) => {
              if (file instanceof File) {
                const res = await handleUpload(file, { signal })
                def.field.onChange(res.url)
              }
            }}
          />
        )}
      />
    )
  }

  if (field.type === "url" && field.fieldHint === "upload") {
    return (
      <Controller
        name={field.name!}
        control={control}
        rules={{ required: field.required && "This field is required!" }}
        render={(def) => {
          const currentValue = def.field.value

          const initialFile =
            !field.multi && typeof currentValue === "string" && currentValue
              ? {
                  id: currentValue,
                  type: "image",
                  name: currentValue,
                  url: currentValue,
                  size: 0,
                }
              : undefined

          const initialFiles =
            field.multi && Array.isArray(currentValue)
              ? currentValue
                  .filter((v: any) => typeof v === "string" && v)
                  .map((v: string) => ({
                    id: v,
                    type: "image",
                    name: v,
                    url: v,
                    size: 0,
                  }))
              : undefined

          return (
            <ImageUpload
              id={id}
              multi={field.multi}
              initialFile={initialFile}
              initialFiles={initialFiles}
              onUpload={async ({ file }, signal) => {
                if (file instanceof File) {
                  const res = await handleUpload(file, { signal })
                  if (field.multi) {
                    const prev = Array.isArray(def.field.value)
                      ? def.field.value
                      : []
                    def.field.onChange([...prev, res.url])
                  } else {
                    def.field.onChange(res.url)
                  }
                }
              }}
            />
          )
        }}
      />
    )
  }

  if (field.type === "boolean")
    return (
      <Controller
        name={field.name!}
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
        name={field.name!}
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
        name={field.name!}
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
          name={field.name!}
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
          name={field.name!}
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
      name={field.name!}
      control={control}
      rules={{ required: field.required && "This field is required!" }}
      render={(def) => (
        <Input
          id={id}
          type={field.type}
          placeholder={field.example ?? field.name}
          maxLength={field.maxLength}
          value={def.field.value ?? ""}
          onChange={(e) =>
            def.field.onChange(
              field.type === "number" ? e.target.valueAsNumber : e.target.value
            )
          }
        />
      )}
    />
  )
}

JSONSchemaToFields.resolveRef = async (ref, field) => {
  const { results } = (await ThunderSDK.getModule(ref).get({})) as {
    results: any[]
  }

  const resolveLabel = (item: any) => {
    if (field.refLabel instanceof Array) {
      return field.refLabel
        .map((prop) => item[prop])
        .filter(Boolean)
        .join(" ")
    }

    return (
      (field.refLabel && item[field.refLabel]) ||
      item.label ||
      item.name ||
      item.title
    )
  }

  const resolveValue = (item: any) => {
    if (field.refValue) {
      return item[field.refValue]
    }

    return item._id
  }

  return results.map((item: any) => ({
    label: resolveLabel(item),
    value: resolveValue(item),
  }))
}

export interface IFormPageProps {
  name: string
}

export function FormPage({ name }: IFormPageProps) {
  const { id } = useParams<{ id?: string }>()
  const location = useLocation()
  const isEditMode = !!id
  const metadata = React.useMemo(() => ThunderSDK.getMetadata(name), [name])
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    defaultValues: isEditMode ? location.state?.record : undefined,
  })
  const [fields, setFields] = React.useState<TField[]>([])

  React.useEffect(() => {
    ;(async () => {
      setFields(await fieldsFromModuleMetadata(metadata))
    })()
  }, [metadata])

  const onSubmit: SubmitHandler<any> = async (body) => {
    if (isEditMode) {
      await ThunderSDK.getModule(name).update({
        params: { id },
        body,
      })
    } else {
      await ThunderSDK.getModule(name).create({
        body,
      })
    }
  }

  return (
    <form className="mx-auto w-full max-w-md" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>{isEditMode ? "Update" : "Create"}</FieldLegend>
          <FieldDescription>
            {isEditMode
              ? `Update the ${name} entry below.`
              : `Fill the form below to create a new ${name} entry. All fields are required`}
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
                  {errors[field.name!]?.message?.toString()}
                </FieldError>
              </Field>
            )
          })}
        </FieldSet>

        <Button type="submit" disabled={isSubmitting || !fields.length}>
          Submit
        </Button>
      </FieldGroup>
    </form>
  )
}
