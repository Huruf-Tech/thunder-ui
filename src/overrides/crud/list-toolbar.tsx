import type { TListToolbarOverride } from "@/core/types"

export const listToolbar: TListToolbarOverride = {
  // Replace the entire default toolbar (filters, column toggle, create button,
  // view toggle, and this module's `list-actions.tsx` entry) for one module.
  // Your component gets `name` and `isLoading` as props — use hooks for
  // anything else.
  //
  // Those two props are the whole contract: there is no `setFilters`/`setSort`
  // and no table instance here, so a replacement toolbar can hold buttons that
  // act on their own but cannot drive the list's query or its columns. If you
  // need that, replace the list itself in `lists.tsx`.
  //
  // E.g:
  // orders: ({ isLoading }) => (
  //   <div className="flex w-full items-center justify-end gap-3">
  //     <Button variant="outline" disabled={isLoading}>Import CSV</Button>
  //     <Button variant="outline" disabled={isLoading}>Export</Button>
  //   </div>
  // ),
}
