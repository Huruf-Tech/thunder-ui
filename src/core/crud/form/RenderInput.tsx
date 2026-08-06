/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { Controller, useFormContext, type Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { useSearchParams } from "react-router"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Input as NumberInput } from "@/components/ui/number-input"
import { Textarea } from "@/components/ui/textarea"
import { PhoneInput } from "@/components/reui/phone-input"

import type { TField } from "@/core/lib/jsonSchemaToFields"
import { MarkdownEditorField } from "@/core/custom/MarkdownEditor"
import { Autocomplete } from "@/core/custom/Autocomplete"

import { Dropdown } from "../../custom/Dropdown"
import { Multiselect } from "../../custom/Multiselect"
import { Tag, TagInput } from "../../custom/TagInput"
import { AvatarUpload } from "../../custom/AvatarUpload"
import { formatDateForInput, handleUpload } from "../../lib/utils"
import RenderArray from "./RenderArray"
import RenderObject from "./RenderObject"
import {
  filesFromUrls,
  TableUpload,
  urlsFromFiles,
} from "@/core/custom/TableUpload"
import { MongoFilters } from "@/core/custom/MongoFilters"

export type TRenderInputProps = {
  name: string
  field: TField
}

export default function RenderInput({ name, field }: TRenderInputProps) {
  if (field.type === "array") return <RenderArray name={name} field={field} />
  if (field.type === "object") return <RenderObject name={name} field={field} />

  const { t } = useTranslation()
  const id = React.useMemo(() => crypto.randomUUID(), [])
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext()

  const getError = React.useCallback(
    (name?: string) => {
      if (!name) return

      const parts = name.split(".")

      let error: any

      for (const p of parts) {
        error = error?.[p] ?? errors[p]
      }

      return String(error?.message ?? "")
    },
    [errors]
  )

  if (field.requirementKey) {
    const value = watch(field.requirementKey)

    if (value !== name) return
  }

  if (field.type === "hidden" && (field.optional || !!field.const)) return null

  return (
    <Field className={field.className} style={field.style}>
      {field.type === "hidden" ? null : (
        <FieldLabel htmlFor={id}>
          {field.label ?? t(name)}
          {field.optional ? ` (${t("optional")})` : ""}
        </FieldLabel>
      )}
      {renderField({
        id,
        name,
        field,
        control,
        t,
      })}
      {field.type === "hidden" ? null : (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <FieldError>{getError(name)}</FieldError>
    </Field>
  )
}

export const renderField = ({
  id,
  name,
  field,
  control,
  t,
}: {
  id: string
  name: string
  field: TField
  control: Control<any, any, any>
  t: TFunction
}) => {
  const [query] = useSearchParams()

  const defaultValue = !field.ignoreQueryValue
    ? (query.get(field.queryValue ?? name) ?? undefined)
    : undefined
  const pattern = field.pattern ? new RegExp(field.pattern) : undefined

  if (
    field.type === "text" &&
    field.fieldHint === "filters" &&
    field.filterSchema
  ) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
        render={(def) => (
          <MongoFilters
            schema={field.filterSchema!}
            filters={def.field.value}
            onChange={(value) => {
              def.field.onChange(value ?? null)
            }}
          />
        )}
      />
    )
  }

  if (field.type === "text" && field.fieldHint === "markdown") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
        render={(def) => (
          <MarkdownEditorField
            value={def.field.value}
            onChange={def.field.onChange}
          />
        )}
      />
    )
  }

  if (field.type === "url" && !field.multi && field.fieldHint === "avatar") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
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
            onRemove={() => {
              def.field.onChange(null)
            }}
          />
        )}
      />
    )
  }

  if (field.type === "url" && field.fieldHint === "upload") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
        render={(def) => {
          return (
            <TableUpload
              accept={field.fileType}
              maxSize={field.fileSize}
              maxFiles={field.maxItems}
              initialFiles={filesFromUrls(def.field.value)}
              onFilesChange={async (files) => {
                const filesWithUrls = await Promise.all(
                  files.map(async (file) => {
                    if (
                      file.file instanceof File &&
                      file.status === "uploading"
                    ) {
                      const res = await handleUpload(file.file)

                      return {
                        ...file,
                        preview: res.url,
                      }
                    }

                    return file
                  })
                )

                const urls = urlsFromFiles(filesWithUrls)
                def.field.onChange(field.multi ? urls : urls[0])
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
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
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
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
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
    ) : field.fieldHint === "autocomplete" ? (
      <Controller
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
        render={(def) => {
          return (
            <Autocomplete
              id={id}
              items={(field.enum ?? []).map((value) =>
                typeof value === "object" && value
                  ? value
                  : { value, label: value }
              )}
              value={def.field.value ?? ""}
              onValueChange={def.field.onChange}
            />
          )
        }}
      />
    ) : (
      <Controller
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
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

  if (field.type === "phone" && !field.multi) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
        render={(def) => (
          <PhoneInput
            id={id}
            value={def.field.value}
            onChange={def.field.onChange}
          />
        )}
      />
    )
  }

  if (["text", "number", "url", "email", "phone"].includes(field.type)) {
    if (field.multi) {
      return (
        <Controller
          name={name}
          control={control}
          rules={{
            required: !field.optional && t("This field is required!"),
            pattern,
          }}
          defaultValue={defaultValue}
          render={(def) => (
            <Tag
              id={id}
              values={def.field.value}
              onValueChange={def.field.onChange}
              type={field.type}
            >
              <TagInput />
            </Tag>
          )}
        />
      )
    }

    if (field.type === "text" && (!field.maxLength || field.maxLength > 100)) {
      return (
        <Controller
          name={name}
          control={control}
          rules={{
            required: !field.optional && t("This field is required!"),
            pattern,
          }}
          defaultValue={defaultValue}
          render={(def) => (
            <Textarea
              id={id}
              placeholder={field.example ?? field.name}
              minLength={field.minLength}
              maxLength={field.maxLength}
              value={def.field.value ?? ""}
              onChange={(e) => def.field.onChange(e.target.value)}
            />
          )}
        />
      )
    }
  }

  if (field.type === "date") {
    if (field.fieldHint === "datetime-local") {
      return (
        <Controller
          name={name}
          control={control}
          rules={{
            required: !field.optional && t("This field is required!"),
            pattern,
          }}
          defaultValue={defaultValue}
          render={(def) => (
            <Input
              id={id}
              type="datetime-local"
              placeholder={field.example ?? field.name}
              defaultValue={formatDateForInput(def.field.value, true)}
              onChange={(e) => def.field.onChange(new Date(e.target.value))}
            />
          )}
        />
      )
    }

    return (
      <Controller
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
        render={(def) => (
          <Input
            id={id}
            type={field.type}
            placeholder={field.example ?? field.name}
            defaultValue={formatDateForInput(def.field.value)}
            onChange={(e) => def.field.onChange(new Date(e.target.value))}
          />
        )}
      />
    )
  }

  if (field.type === "number" && field.fieldHint === "amount") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          required: !field.optional && t("This field is required!"),
          pattern,
        }}
        defaultValue={defaultValue}
        render={(def) => (
          <NumberInput
            id={id}
            type={field.type}
            placeholder={field.example ?? field.name}
            minLength={field.minLength}
            maxLength={field.maxLength}
            pattern={field.pattern}
            value={def.field.value ?? ""}
            onChange={(e) => def.field.onChange(e.target.valueAsNumber)}
          />
        )}
      />
    )
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: !field.optional && t("This field is required!"),
        pattern,
      }}
      defaultValue={defaultValue}
      render={(def) => (
        <Input
          id={id}
          type={field.type}
          placeholder={field.example ?? field.name}
          minLength={field.minLength}
          maxLength={field.maxLength}
          pattern={field.pattern}
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
