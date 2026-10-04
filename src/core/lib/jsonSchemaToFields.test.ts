/**
 * Coverage for the JSON Schema -> form fields converter.
 *
 * Run with `npm test`. Uses the Node test runner and native type stripping, so
 * it needs no test framework and no build step.
 *
 * Each `G-xx` tag refers to a finding in docs/AUDIT.md section 9.
 */
import test from "node:test"
import assert from "node:assert/strict"

import { JSONSchemaToFields, type TField } from "./jsonSchemaToFields.ts"

JSONSchemaToFields.silent = true

/** Flattens the field tree to the dotted paths the renderers register. */
function flatten(fields: TField[], prefix = ""): Record<string, TField> {
  const out: Record<string, TField> = {}

  for (const field of fields ?? []) {
    const name = [prefix, field.name]
      .filter((part) => part !== undefined && part !== "")
      .join(".")

    out[name] = field

    if (field.fields?.length) {
      Object.assign(
        out,
        flatten(field.fields, field.type === "array" ? `${name}.0` : name)
      )
    }
  }

  return out
}

/** Builds a form the way FormPage does: the root object's own fields. */
async function build(schema: unknown) {
  const [root] = await JSONSchemaToFields.toFields(undefined, schema)

  return flatten(root?.fields ?? [])
}

const object = (properties: object, required?: string[]) => ({
  type: "object",
  properties,
  ...(required ? { required } : {}),
})

test("G-02: a property is optional unless its parent requires it", async () => {
  const open = await build(object({ a: { type: "string" }, b: { type: "string" } }))
  assert.equal(open.a.optional, true)
  assert.equal(open.b.optional, true)

  const strict = await build(
    object({ a: { type: "string" }, b: { type: "string" } }, ["a"])
  )
  assert.equal(strict.a.optional, false)
  assert.equal(strict.b.optional, true)

  // An optional nested object must not force its children.
  const nested = await build(
    object({ bank: object({ iban: { type: "string" } }) }, [])
  )
  assert.equal(nested["bank.iban"].optional, true)
})

test("G-03: a nullable union keeps its real type", async () => {
  const fields = await build(
    object({
      s: { type: ["string", "null"] },
      n: { type: ["number", "null"] },
      b: { type: ["boolean", "null"] },
    })
  )

  assert.equal(fields.s.type, "text")
  assert.equal(fields.n.type, "number")
  assert.equal(fields.b.type, "boolean")
})

test("G-04: a schema default reaches defaultValue", async () => {
  const fields = await build(
    object({
      role: { type: "string", default: "member" },
      on: { type: "boolean", default: true },
      none: { type: "string" },
    })
  )

  assert.equal(fields.role.defaultValue, "member")
  assert.equal(fields.on.defaultValue, true)
  assert.equal(fields.none.defaultValue, undefined)
})

test("G-05: const survives onto the field so it can be submitted", async () => {
  const fields = await build(object({ v: { const: "v1" } }))

  assert.equal(fields.v.const, "v1")
})

test("G-06: both date formats map to the date control", async () => {
  const fields = await build(
    object({
      d: { type: "string", format: "date" },
      dt: { type: "string", format: "date-time" },
    })
  )

  assert.equal(fields.d.type, "date")
  assert.equal(fields.dt.type, "date")
})

test("G-07: a record becomes the JSON editor, not a text box", async () => {
  const fields = await build(
    object({ meta: { type: "object", additionalProperties: { type: "string" } } })
  )

  assert.equal(fields.meta.type, "text")
  assert.equal(fields.meta.fieldHint, "json")
})

test("G-01: $ref resolves against $defs", async () => {
  const fields = await build({
    ...object({ home: { $ref: "#/$defs/Addr" } }),
    $defs: { Addr: object({ city: { type: "string" } }) },
  })

  assert.equal(fields.home.type, "object")
  assert.ok(fields["home.city"])
})

test("G-01: a recursive $ref terminates", async () => {
  const fields = await build({
    ...object({ tree: { $ref: "#/$defs/Node" } }),
    $defs: {
      Node: object({ v: { type: "string" }, next: { $ref: "#/$defs/Node" } }),
    },
  })

  assert.ok(fields["tree.v"])
})

test("G-01: allOf merges every member", async () => {
  const fields = await build(
    object({
      x: {
        allOf: [
          object({ a: { type: "string" } }),
          object({ b: { type: "number" } }),
        ],
      },
    })
  )

  assert.ok(fields["x.a"])
  assert.equal(fields["x.b"].type, "number")
})

test("G-01: a discriminated oneOf yields an enum plus every variant", async () => {
  const fields = await build(
    object({
      pay: {
        oneOf: [
          object({ kind: { const: "card" }, pan: { type: "string" } }, [
            "kind",
            "pan",
          ]),
          object({ kind: { const: "cash" }, got: { type: "number" } }, [
            "kind",
            "got",
          ]),
        ],
      },
    })
  )

  assert.deepEqual(fields["pay.kind"].enum, ["card", "cash"])
  assert.ok(fields["pay.pan"])
  assert.ok(fields["pay.got"])

  // Required only where every branch agrees, or one variant would block another.
  assert.equal(fields["pay.kind"].optional, false)
  assert.equal(fields["pay.pan"].optional, true)
  assert.equal(fields["pay.got"].optional, true)
})

test("G-01: anyOf drops its null branch", async () => {
  const fields = await build(
    object({ v: { anyOf: [{ type: "number" }, { type: "null" }] } })
  )

  assert.equal(fields.v.type, "number")
})

test("nesting: array > object > array > object keeps correct paths", async () => {
  const fields = await build(
    object({
      orders: {
        type: "array",
        items: object({
          ref: { type: "string" },
          lines: { type: "array", items: object({ sku: { type: "string" } }) },
        }),
      },
    })
  )

  assert.ok(fields["orders.0.ref"])
  assert.ok(fields["orders.0.lines.0.sku"])
})

test("nesting: an array of scalars becomes a multi field", async () => {
  const fields = await build(
    object({ tags: { type: "array", items: { type: "string" } } })
  )

  assert.equal(fields.tags.type, "text")
  assert.equal(fields.tags.multi, true)
})

test("required propagates into array item objects", async () => {
  const fields = await build(
    object({
      items: {
        type: "array",
        items: object({ sku: { type: "string" }, qty: { type: "number" } }, [
          "sku",
        ]),
      },
    })
  )

  assert.equal(fields["items.0.sku"].optional, false)
  assert.equal(fields["items.0.qty"].optional, true)
})

test("a schema with no usable shape yields no fields rather than throwing", async () => {
  assert.deepEqual(await build({ type: "object" }), {})
})
