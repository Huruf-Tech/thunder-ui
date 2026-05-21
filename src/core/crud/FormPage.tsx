/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useNavigate, useParams } from "react-router";
import { ThunderSDK } from "thunder-sdk";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JSONSchemaToFields, type TField } from "../lib/jsonSchemaToFields";
import RenderInput from "./form/RenderInput";
import { use } from "../hooks/use";

export const fieldsFromModuleMetadata = async (
  metadata: any,
  opts: {
    type: "insert" | "update" | "output";
    resolveRef?: boolean;
  },
) => {
  if (!metadata) return [];

  if (typeof metadata.crud !== "object") return [];

  const schema = (() => {
    switch (opts.type) {
      case "insert":
        return metadata.crud.insertSchema ?? metadata.crud.schema;

      case "update":
        return metadata.crud.updateSchema ?? metadata.crud.insertSchema;

      default:
        return metadata.crud.schema;
    }
  })();

  // Convert json schema to fields data
  const results = await JSONSchemaToFields.toFields(undefined, schema, {
    resolveRef: opts.resolveRef,
  });

  console.log("Fields:", results);

  return results;
};

JSONSchemaToFields.resolveRef = async (ref, field) => {
  const createProjection = () => {
    const fields = field.refLabel instanceof Array
      ? field.refLabel
      : [field.refLabel, "label", "name", "title"].filter(Boolean);

    return Object.fromEntries(fields.map((field) => [field, 1]));
  };

  const { results } = (await ThunderSDK.getModule(ref).get({
    query: {
      project: createProjection(),
    },
  })) as {
    results: any[];
  };

  const resolveLabel = (item: any) => {
    if (field.refLabel instanceof Array) {
      return field.refLabel
        .map((prop) => item[prop])
        .filter(Boolean)
        .join(" ");
    }

    return (
      (field.refLabel && item[field.refLabel]) ||
      item.label ||
      item.name ||
      item.title
    );
  };

  const resolveValue = (item: any) => {
    if (field.refValue) {
      return item[field.refValue];
    }

    return item._id;
  };

  return results.map((item: any) => {
    const value = resolveValue(item)

    return {
      label: resolveLabel(item) || value,
      value,
    }
  })
}

export interface IFormPageProps {
  group?: string;
  name: string;
}

export function FormPage({ name }: IFormPageProps) {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const metadata = React.useMemo(() => ThunderSDK.getMetadata(name), [name]);
  const methods = useForm<any>();
  const [fields, setFields] = React.useState<TField[]>([]);
  const [isFieldsLoading, setIsFieldsLoading] = React.useState(true);
  const getRecord = React.useMemo(() => {
    if (!isEditMode) return undefined;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return ThunderSDK.useCaching(
      [name, "record", id],
      async ({ signal }) =>
        (await ThunderSDK.getModule(name).get({
          signal,
          params: { id },
        })) as { results: any[] },
      { cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1") },
    );
  }, [isEditMode, name, id]);

  const { data, isLoading } = use(getRecord);

  React.useEffect(() => {
    (async () => {
      setIsFieldsLoading(true);

      if (!isEditMode) {
        methods.reset({});
      } else {
        const record = data?.results?.[0];
        methods.reset(record);
      }
      const fields = await fieldsFromModuleMetadata(metadata, {
        type: isEditMode ? "update" : "insert",
        resolveRef: true,
      });
      setFields(fields);
      setIsFieldsLoading(false);
    })();
  }, [metadata, isEditMode, data, methods]);

  const isFormLoading = isFieldsLoading || (isEditMode && isLoading);
  const onSubmit: SubmitHandler<any> = async (body) => {
    if (isEditMode) {
      await ThunderSDK.getModule(name).update({
        params: { id },
        body,
      });
    } else {
      await ThunderSDK.getModule(name).create({
        body,
      });
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <FormProvider {...methods}>
        <form
          className="mx-auto w-full max-w-md pb-24"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <FieldSet>
              <FieldLegend>{isEditMode ? "Update" : "Create"}</FieldLegend>
              <FieldDescription>
                {isEditMode
                  ? `Update the ${name} entry below.`
                  : `Fill the form below to create a new ${name} entry. All fields are required`}
              </FieldDescription>
            </FieldSet>

            {isFormLoading
              ? (
                <Skeleton className="py-8 text-center text-sm text-muted-foreground">
                  {isEditMode ? "Loading record..." : "Loading form..."}
                </Skeleton>
              )
              : (
                fields.map((field, index) => (
                  <RenderInput
                    key={`${field.name}_${index}`}
                    name={field.name!}
                    field={field}
                  />
                ))
              )}

            <FieldSet>
              <FieldGroup>
                <Field orientation="horizontal">
                  <Button
                    type="submit"
                    disabled={methods.formState.isSubmitting ||
                      isFormLoading}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </FormProvider>
    </div>
  );
}
