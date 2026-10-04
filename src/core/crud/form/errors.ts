/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FieldErrors } from "react-hook-form"

/**
 * Walks a dotted field path (`contract.wage.amount`) through react-hook-form's
 * nested error tree and returns the error node, if any.
 *
 * Callers read `.message` for a plain field, or `.root?.message` for the
 * field-array-level error produced by `useFieldArray({ rules })`.
 *
 * !! Known defect, tracked as B-08 in docs/AUDIT.md: the `?? errors[p]` fallback
 * !! re-applies on every segment, so a miss part-way down a nested path resolves
 * !! to the top-level key of that name instead of to nothing. Behaviour is
 * !! preserved here verbatim from the three copies this replaced; fixing it is a
 * !! one-line change in this function.
 */
export function findFieldError(
  errors: FieldErrors,
  name?: string
): any | undefined {
  if (!name) return

  let error: any

  for (const part of name.split(".")) {
    error = error?.[part] ?? errors[part]
  }

  return error
}
