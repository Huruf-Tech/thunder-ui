/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import {
  Controller,
  useFormContext,
  type Control,
  type RegisterOptions,
} from "react-hook-form"
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
import { findFieldError } from "./errors"
import { MarkdownEditorField } from "@/core/custom/MarkdownEditor"
import { Autocomplete } from "@/core/custom/Autocomplete"

import { Dropdown } from "../../custom/Dropdown"
import { Multiselect } from "../../custom/Multiselect"
import { Tag, TagInput } from "../../custom/TagInput"
import { AvatarUpload } from "../../custom/AvatarUpload"
import {
  formatDateForInput,
  handleUpload,
  parseDateInput,
} from "../../lib/utils"
import RenderArray from "./RenderArray"
import RenderObject from "./RenderObject"
import {
  filesFromUrls,
  TableUpload,
  urlsFromFiles,
} from "@/core/custom/TableUpload"
import { MongoFilters } from "@/core/custom/MongoFilters"
import { RefSelect } from "@/core/custom/RefSelect"

export type TRenderInputProps = {
  name: string
  field: TField
}

export default function RenderInput({ name, field }: TRenderInputProps) {
  if (!field.fieldHint) {
    if (field.type === "array") return <RenderArray name={name} field={field} />
    if (field.type === "object")
      return <RenderObject name={name} field={field} />
  }

  const { t } = useTranslation()
  const id = React.useMemo(() => crypto.randomUUID(), [])
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext()

  const getError = React.useCallback(
    (name?: string) => String(findFieldError(errors, name)?.message ?? ""),
    [errors]
  )

  if (field.requirementKey) {
    const value = watch(field.requirementKey)

    if (value !== name) return
  }

  //! A `const` property has exactly one legal value. It used to render as an
  //! editable, empty text box whose value was never submitted. Register it so it
  //! is sent, and show nothing. See G-05.
  if (field.const !== undefined) {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue={field.const}
        render={() => <input type="hidden" />}
      />
    )
  }

  if (field.type === "hidden" && field.optional) return null

  return (
    <Field className={field.className} style={field.style}>
      {field.type === "hidden" ? null : (
        <FieldLabel htmlFor={id}>
          {/* `field.label ?? t(name)` translated the raw field name but left a
              schema-supplied label untranslated. See B-37. */}
          {t(field.label ?? name)}
          {field.optional ? ` (${t("optional")})` : ""}
        </FieldLabel>
      )}
      <RenderField id={id} name={name} field={field} control={control} t={t} />
      {field.type === "hidden" ? null : (
        <FieldDescription>
          {field.description ? t(field.description) : null}
        </FieldDescription>
      )}
      <FieldError>{getError(name)}</FieldError>
    </Field>
  )
}

function resolveValueType(field: TField, value: any) {
  if (field.type === "number" && typeof value === "string") {
    return Number(value)
  }

  if (field.type === "boolean" && typeof value === "string") {
    return value === "true"
  }

  return value
}

/**
 * Builds the react-hook-form rules for a field from its schema constraints.
 *
 * Previously only `required` and `pattern` were applied, and they were spelled
 * out at all fifteen Controller call sites. The length/range limits reached the
 * DOM as attributes but were never validated, so they did nothing for any
 * non-native control (dropdown, tag input, upload). See F-07.
 */
export function buildRules(field: TField, t: TFunction) {
  const rules: RegisterOptions = {
    required: !field.optional && t("This field is required!"),
  }

  if (field.pattern) rules.pattern = new RegExp(field.pattern)

  const isText = !["number", "boolean", "date"].includes(field.type)

  if (field.multi || field.type === "array") {
    if (typeof field.minItems === "number") {
      rules.validate = {
        ...(rules.validate as object),
        minItems: (value: unknown) =>
          !Array.isArray(value) ||
          value.length >= field.minItems! ||
          t("Select at least {{count}} item(s).", { count: field.minItems }),
      }
    }

    if (typeof field.maxItems === "number") {
      rules.validate = {
        ...(rules.validate as object),
        maxItems: (value: unknown) =>
          !Array.isArray(value) ||
          value.length <= field.maxItems! ||
          t("Select at most {{count}} item(s).", { count: field.maxItems }),
      }
    }

    return rules
  }

  if (isText) {
    if (typeof field.minLength === "number") {
      rules.minLength = {
        value: field.minLength,
        message: t("Must be at least {{count}} character(s).", {
          count: field.minLength,
        }),
      }
    }

    if (typeof field.maxLength === "number") {
      rules.maxLength = {
        value: field.maxLength,
        message: t("Must be at most {{count}} character(s).", {
          count: field.maxLength,
        }),
      }
    }
  }

  if (field.type === "number") {
    if (typeof field.minimum === "number") {
      rules.min = {
        value: field.minimum,
        message: t("Must be {{min}} or more.", { min: field.minimum }),
      }
    }

    if (typeof field.maximum === "number") {
      rules.max = {
        value: field.maximum,
        message: t("Must be {{max}} or less.", { max: field.maximum }),
      }
    }
  }

  return rules
}

export type TRenderFieldProps = {
  id: string
  name: string
  field: TField
  control: Control<any, any, any>
  t: TFunction
}

export const RenderField = ({
  id,
  name,
  field,
  control,
  t,
}: TRenderFieldProps) => {
  const [query] = useSearchParams()

  const queryValue = !field.ignoreQueryValue
    ? query.get(field.queryValue ?? name)
    : null

  //! A query parameter wins so a link can prefill the form; otherwise fall back
  //! to the schema's own `default`, which used to be dropped entirely. See G-04.
  const defaultValue =
    queryValue !== null
      ? resolveValueType(field, queryValue)
      : field.defaultValue

  const rules = buildRules(field, t)

  if (field.type === "object" && field.fieldHint === "filters") {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        render={(def) => (
          <MongoFilters
            schema={field.filterSchema ?? name}
            filters={def.field.value}
            onChange={(value) => {
              def.field.onChange(value ?? null)
            }}
          />
        )}
      />
    )
  }

  //! A record/dictionary (`additionalProperties`, i.e. zod's `z.record()`) has no
  //! fixed keys, so there is no field list to render. Edit it as JSON rather than
  //! silently degrading to a one-line text box. See G-07.
  if (field.type === "text" && field.fieldHint === "json") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          ...rules,
          validate: {
            ...(rules.validate as object),
            json: (value: unknown) => {
              if (value === undefined || value === null || value === "")
                return true

              if (typeof value === "object") return true

              try {
                JSON.parse(String(value))
                return true
              } catch {
                return t("Enter valid JSON.")
              }
            },
          },
        }}
        defaultValue={defaultValue}
        render={(def) => (
          <Textarea
            id={id}
            className="font-mono text-xs"
            rows={6}
            placeholder={field.example ?? "{}"}
            defaultValue={
              typeof def.field.value === "object" && def.field.value !== null
                ? JSON.stringify(def.field.value, null, 2)
                : (def.field.value ?? "")
            }
            onChange={(e) => {
              const raw = e.target.value

              try {
                def.field.onChange(raw === "" ? undefined : JSON.parse(raw))
              } catch {
                // Keep the raw text so the user can finish typing; the `json`
                // rule above is what blocks an invalid submit.
                def.field.onChange(raw)
              }
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
        rules={rules}
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
        rules={rules}
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
        rules={rules}
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
        rules={rules}
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

  //! A `ref` field is backed by another module, which may hold more records than
  //! can sensibly be downloaded. It gets a searchable, server-paginated picker
  //! rather than an enum materialised up-front. See B-31 / F-04.
  if (field.ref) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        render={(def) => (
          <RefSelect
            id={id}
            field={field}
            multiple={field.multi}
            value={def.field.value}
            onValueChange={def.field.onChange}
          />
        )}
      />
    )
  }

  if (field.enum) {
    return field.multi ? (
      <Controller
        name={name}
        control={control}
        rules={rules}
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
        rules={rules}
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
        rules={rules}
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
        rules={rules}
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

  if (field.type === "number" && field.fieldHint === "amount") {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
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

  if (["text", "number", "url", "email", "phone"].includes(field.type)) {
    if (field.multi) {
      return (
        <Controller
          name={name}
          control={control}
          rules={rules}
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
          rules={rules}
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
          rules={rules}
          defaultValue={defaultValue}
          render={(def) => (
            <Input
              id={id}
              type="datetime-local"
              placeholder={field.example ?? field.name}
              //! `defaultValue` made this uncontrolled, so a value arriving from
              //! `methods.reset()` after first paint never appeared. See B-07.
              value={formatDateForInput(def.field.value, true)}
              onChange={(e) =>
                def.field.onChange(parseDateInput(e.target.value))
              }
            />
          )}
        />
      )
    }

    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        render={(def) => (
          <Input
            id={id}
            type={field.type}
            placeholder={field.example ?? field.name}
            value={formatDateForInput(def.field.value)}
            onChange={(e) => def.field.onChange(parseDateInput(e.target.value))}
          />
        )}
      />
    )
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
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
