/**
 * JSON schema sample 1
 *
 * {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            "name": { "type": "string", "minLength": 1, "maxLength": 100 },
            "description": { "type": "string", "maxLength": 300 },
            "logo": { "type": "string", "format": "uri" },
            "type": { "type": "string", "enum": ["confidential", "public"] },
            "secret": { "type": "string" },
            "allowedScopes": {
                "default": [],
                "type": "array",
                "items": { "type": "string", "minLength": 1, "maxLength": 255 },
            },
            "redirectUris": {
                "default": [],
                "type": "array",
                "items": { "type": "string", "format": "uri" },
            },
        },
        "required": ["name", "type"],
    };
 */

import z from "zod";

export const FieldTypes = [
    "text",
    "number",
    "boolean",
    "date",
    "email",
    "url",
    "hidden",
] as const;

export type TFieldType = typeof FieldTypes[number];
export type TField = {
    type: TFieldType;
    name?: string;
    defaultValue?: unknown;
    label?: string;
    placeholder?: string;
    description?: string;
    multi?: boolean;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    enum?: string[] | Array<{ label: string; value: unknown }>;
    pattern?: string;
    example?: string;
    ref?: string;
    refLabel?: string | string[];
    refValue?: string;
};

export class JSONSchemaToFields {
    protected static resolveFieldType(
        type: string,
        format?: string,
    ): TFieldType {
        switch (format) {
            case "uri": {
                return "url";
            }

            case "date-time": {
                return "date";
            }

            case "email": {
                return "email";
            }

            default: {
                return FieldTypes.includes(type as TFieldType)
                    ? type as TFieldType
                    : "text";
            }
        }
    }

    protected static jsonFieldSchema = z.object({
        type: z.string().default("string"),
        default: z.unknown().optional(),
        label: z.string().optional(),
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        enum: z.array(z.string()).optional(),
        pattern: z.string().optional(),
        placeholder: z.string().optional(),
        description: z.string().optional(),
        example: z.string().optional(),
        ref: z.string().optional(),
        refLabel: z.union([z.string(), z.string().array()]).optional(),
        refValue: z.string().optional(),
    });

    protected static _toFields(
        name: string | undefined,
        schema: unknown,
        hints?: Partial<TField>,
    ): TField[] {
        if (typeof schema !== "object" || schema === null) return [];

        const type = "type" in schema && typeof schema.type === "string"
            ? schema.type
            : "string";

        if (
            type === "object" && "properties" in schema &&
            typeof schema.properties === "object" && schema.properties !== null
        ) {
            return Object.entries(schema.properties).flatMap(([prop, def]) =>
                this._toFields(prop, def, {
                    name: [name, prop].filter(Boolean).join("."),
                    ...("required" in schema &&
                            schema.required instanceof Array
                        ? { required: schema.required.includes(prop) }
                        : {}),
                })
            );
        }

        if (
            type === "array" && "items" in schema &&
            typeof schema.items === "object" && schema.items !== null
        ) {
            return this._toFields(name, schema.items, { multi: true });
        }

        const { success, data, error } = this.jsonFieldSchema.safeParse(schema);

        if (success) {
            const field = {
                name,
                ...hints,
                ...data,
                type: this.resolveFieldType(
                    type,
                    "format" in schema && typeof schema.format === "string"
                        ? schema.format
                        : undefined,
                ),
                multi: hints?.multi,
            };

            return [field];
        } else console.error(error);

        return [];
    }

    static resolveRef?: (
        ref: string,
        field: TField,
    ) => Promise<Array<{ label: string; value: unknown }>>;

    protected static async resolveField(field: TField): Promise<TField> {
        if (typeof field.ref === "string") {
            if (typeof this.resolveRef !== "function") {
                throw new Error(
                    "Unable to resolve reference! No implementation!",
                );
            }

            field.enum = await this.resolveRef(field.ref, field);
        }

        return field;
    }

    static async toFields(
        name: string | undefined,
        schema: unknown,
    ): Promise<TField[]> {
        const fields = this._toFields(name, schema);

        return await Promise.all(
            fields.map((field) => this.resolveField(field)),
        );
    }
}
