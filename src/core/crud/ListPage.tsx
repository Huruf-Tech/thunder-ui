/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { hash } from "ohash";
import { ThunderSDK } from "thunder-sdk";
import { DataTable, type DataTableAction } from "../custom/Datatable";
import { cards } from "@/templates/crudCard";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNavigate } from "react-router";
import { use } from "../hooks/use";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  IconAlertCircle,
  IconLayoutGrid,
  IconTable,
} from "@tabler/icons-react";
import { ActionSheetRef } from "@/Registry/ActionSheet";

export interface IListPageProps {
  name: string;
}

const columnsFromModuleMetadata = (metadata: any): ColumnDef<unknown>[] => {
  if (!metadata) return [];

  if (typeof metadata.crud?.schema !== "object") return [];

  // Convert json schema to columns
  return Object.entries<{
    type: string;
    format?: string;
  }>(metadata.crud.schema.properties).map(([key]) => ({
    accessorKey: key,
    header: key,
  }));
};

export function ListPage({ name }: IListPageProps) {
  const navigate = useNavigate();
  const metadata = React.useMemo(() => ThunderSDK.getMetadata(name), [name]);

  const get = React.useCallback(
    (query: Record<string, unknown> = {}) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return ThunderSDK.useCaching(
        [name, query && hash(query)],
        async ({ signal }) =>
          (await ThunderSDK.getModule(name).get({
            signal,
            query,
          })) as { results: unknown[] },
        { cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1") },
      );
    },
    [name],
  );

  const { data, error } = use(get());
  const [view, setView] = React.useState<string>("table");

  const Card = cards[name as keyof typeof cards];

  const handleTableAction = React.useCallback(
    async (action: DataTableAction, selectedRows: unknown[]) => {
      if (action === "update") {
        const row = selectedRows[0] as any;
        if (row?._id) {
          navigate(`form/${row._id}`, { state: { record: row } });
        }
      }

      if (action === "delete") {
        try {
          const ids = selectedRows.map((row: any) => row._id);
          ActionSheetRef?.current?.isOpen("confirmation", true, {
            async onConfirm(dismiss) {
              for (const id of ids) {
                await ThunderSDK.getModule(name).del({ params: { id } });
              }
              // Reload to refresh the data
              get().invalidate();
              dismiss()
            },
          });
        } catch (err) {
          console.error("Failed to delete:", err);
        }
      }
    },
    [name, navigate],
  );

  return (
    <div className="flex w-full flex-col gap-5">
      {error && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>Error Occurred!</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end items-center gap-2">
        <div>
          {ThunderSDK.isPermitted(ThunderSDK.getModule(name).create) && (
            <Button onClick={() => navigate("form")}>Create</Button>
          )}
        </div>
        {!!Card && (
          <ToggleGroup
            value={view}
            onValueChange={(v) => v && setView(v)}
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <IconTable className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="card" aria-label="Card view">
              <IconLayoutGrid className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      <div>
        {view === "card"
          ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(data?.results ?? []).filter((item: any) => item?.card === true)
                  .length > 0
                ? (
                  (data?.results ?? []).filter((item: any) =>
                    item?.card === true
                  ).map((item: any, i: number) => (
                    <Card key={item._id ?? i} data={item} />
                  ))
                )
                : (
                  <div className="col-span-full py-12 text-center text-sm text-muted-foreground border rounded-lg border-dashed">
                    No records with card views enabled.
                  </div>
                )}
            </div>
          )
          : (
            <DataTable
              columns={columnsFromModuleMetadata(metadata)}
              data={data?.results ?? []}
              onAction={handleTableAction}
            />
          )}
      </div>
    </div>
  );
}
