# Thunder UI — Pre-Documentation Audit

Status: **living document**. Produced by a full read of `src/` (168 files, ~21.6k LOC) before
documentation work starts. Every item is a checkbox so we can work through it step by step.

Verification baseline at time of writing:

- `npx tsc --noEmit` → **clean**
- `npm run lint` → **fails, no eslint config exists** (see B-01)
- `t()` key scan → **178 literal keys in code, 118 missing from `en`, 114 missing from `ar`**
- `vite build` → **one 8.0 MB JS chunk (1.66 MB gzip); 3.98 MB / 1.17 MB with minify on** (see P-01, P-02)

Legend: **B** = bug · **F** = missing feature · **R** = refactor · **C** = cleanup / chore ·
**S** = sync-boundary · **P** = performance · **D** = dead code · **G** = form generator

Checkbox states: `[ ]` open · `[x]` done · `[~]` considered and deliberately **not** actioned.

## 0. Decisions taken

Recorded so they do not get re-litigated.

| # | Decision |
| --- | --- |
| D7 | **`www/` and the committed `.env` files are tracked deliberately.** `AttendanceCard` stays deleted — it is not part of Thunder UI. Capacitor identity (`com.huruf.thunderui`) stays as-is. |
| D8 | **Built-in feature pages are opt-in and off by default**, flag names at my discretion: `VITE_ENABLE_WALLET`, `VITE_ENABLE_USERS`, `VITE_ENABLE_NOTIFICATIONS`. |
| D6 | **"Unused in this repo" does not mean dead.** Thunder UI is a boilerplate: utilities, hooks, components, design tokens and types exported from `src/core/` are API for the apps built on it, and must be kept even with no in-repo caller. Only remove something that is (a) internal plumbing with no coherent standalone use, (b) broken or incoherent as an API, or (c) one project's domain code that leaked in. Removing or renaming a public export is a breaking change — keep a deprecated alias. |
| D0 | **Only `src/core/` is read-only.** Everything outside it is the developer's to customise. Note the consequence: core imports `@/components` 168×, `@/lib` 26×, `@/hooks` 3× and `@/pages/overview` once — so core depends on mutable app files. S-04 is a confirmed bug, not an open question. |
| D1 | **`wallet`, `users` and `notifications` stay** in `src/core/pages/` as framework features, **gated behind env flags**. Only `VITE_DISABLE_WALLET` exists today — `users` and `notifications` need equivalents. See F-13. |
| D2 | **Restore `eslint.config.js`.** Its deletion in `e867b3a` was a mistake. |
| D3 | **The framework escapes regex filter values server-side.** B-19 is downgraded to a documentation note, no client fix. |
| D4 | **`VITE_DEFAULT_CACHE_TTL` is in seconds**, consumed by `thunder-sdk` as cache stale time. Needs to be added to the env files with a documented default. |
| D5 | **`src/core/` and "core related files" are replaced wholesale** by `deno task generate:app --forceSync`. Nothing a developer is expected to edit may live inside that boundary. This is now a hard architectural constraint — see §8. |

---

## 1. What this project is (as built)

Thunder UI is a Vite + React 19 + TypeScript SPA, cloned into a Thunder Framework project's
`public/` directory. It consumes a generated `thunder-sdk` package and derives its entire
navigation and CRUD surface from that SDK's module metadata at runtime.

### 1.1 Core mechanism — schema-driven CRUD

| Piece | File | What it does |
| --- | --- | --- |
| Route generation | [router.tsx](../src/core/router.tsx) | Reads `ThunderSDK.getModuleNames()`, builds a route per module, groups them by `ThunderSDK.getGroup()`, filters by `ThunderSDK.isPermitted()` |
| Schema → fields | [jsonSchemaToFields.ts](../src/core/lib/jsonSchemaToFields.ts) | Converts a module's JSON Schema into a `TField[]` tree (objects, arrays, refs, enums, groups, hints) |
| List | [ListPage.tsx](../src/core/crud/ListPage.tsx) | TanStack Table + card view, column visibility, row selection, bulk delete, filters |
| Form | [FormPage.tsx](../src/core/crud/FormPage.tsx) | React Hook Form; picks `insertSchema` / `updateSchema` / `schema` by mode |
| Field rendering | [RenderInput.tsx](../src/core/crud/form/RenderInput.tsx) | Maps field type + `fieldHint` to a control |
| Nested data | [RenderArray.tsx](../src/core/crud/form/RenderArray.tsx), [RenderObject.tsx](../src/core/crud/form/RenderObject.tsx) | Recursive array/object field groups |
| View | [ViewPage.tsx](../src/core/crud/ViewPage.tsx) | Override lookup, else redirect to the form |

Supported field types: `text`, `number`, `boolean`, `date`, `email`, `url`, `phone`, `hidden`,
`array`, `object`. Supported `fieldHint` values: `avatar`, `upload`, `markdown`, `autocomplete`,
`amount`, `filters`, `datetime-local`.

### 1.2 Override / extension points

All under [src/overrides/](../src/overrides/) — this is the documented-by-convention customisation layer:

- `crud/lists.tsx` — replace a whole list page
- `crud/cards.tsx` — add a card view alongside the table
- `crud/forms.tsx` — replace a form
- `crud/views.tsx` — supply a detail page
- `icons.tsx` — per-module nav icons
- `routes.tsx` — add/replace/merge routes (`merge: true` keeps the generated children)
- `src/locals/{en,ar}/translation.json` — app-level translations merged over core

### 1.3 Layouts

Selected by `VITE_APP_LAYOUT` in [layout-provider.tsx](../src/core/layouts/layout-provider.tsx):
`navbar` (default), `sidebar`, `mobile`. `LayoutProvider` also accepts a `layout` prop for a
fully custom shell.

### 1.4 Other features

- **Auth**: two modes — OIDC (`VITE_OAUTH_CLIENT_ID` set, [AuthProvider.tsx](../src/core/context/AuthProvider.tsx)) or
  cookie session (`/auth/api/get-session`). Both in [protected.tsx](../src/core/protected.tsx).
- **Multi-tenancy**: `/:tenant` route segment, tenant picker, `ThunderSDK.plugins.essentials.setTenant()`.
- **Filters**: MongoDB-style filter builder, [crud/filters/](../src/core/crud/filters/), with
  natural-language dates via `chrono-node`.
- **i18n**: `en` / `ar` with RTL, `DirectionProvider`, view transitions on language change.
- **Theming**: light/dark/system, OKLCH tokens, native status/navigation bar sync on Capacitor.
- **Mobile**: Capacitor 8 (android + ios committed), push notifications, camera, share, clipboard, printer.
- **Uploads**: ImageKit, signed via `ThunderSDK.imageKit.auth()`.
- **Built-in pages**: wallet (balance, transfer, receive, swap, ledger, PDF export), notifications
  (popover / sidebar / full page), users (card view, detail, ban, overdraft limit), tenant select/create.

---

## 2. Bugs

### 2.1 Blocking / correctness

- [x] **B-01** **Fixed.** `eslint.config.js` restored from `e867b3a^` rather than rewritten, then two
      corrections: `globalIgnores` listed only `dist`, but vite builds to `www`, so the **committed
      build output was being linted as source**; and `react-hooks/rules-of-hooks` is disabled for
      `src/core/endpoints/**`, where it only fires because `ThunderSDK.useCaching` starts with `use`.
      `npm run lint` now reports **0 errors, 71 warnings**. Three noisy rules
      (`no-explicit-any`, `only-export-components`, `set-state-in-effect`) are demoted to warnings
      rather than silenced — the existing code leans on all three, and a permanently red lint is one
      nobody runs. They remain visible as a backlog. **Restoring lint immediately found real bugs —
      see B-40 to B-44.** Original report: — `npm run lint` is dead.** `eslint.config.js` was deleted in commit `e867b3a`, but the
      script, all eslint devDependencies, and ~35 `eslint-disable` comments across 24 files remain.
      No lint runs in CI or locally. *Decide: restore the config or drop the tooling.*
- [x] **B-02 — `FormPage` breaks on a module with no usable schema.** **Fixed.** Investigation found
      **three** entry points, not one. (1) `crud` not an object → `[]` → `fields[0].fields` threw
      `Cannot read properties of undefined`. (2) `crud` present but the chosen schema missing →
      `toFields` threw → the effect rejected → `isFieldsLoading` never cleared → skeleton forever.
      (3) edit mode resolved `updateSchema ?? insertSchema` and never fell back to `crud.schema`.
      Fix: `fieldsFromModuleMetadata` is now **total** (always returns `TField[]`, never rejects),
      which also protects `ListPage` via `columnFromModuleMetadata`; the fields effect got a
      try/finally plus a cancellation guard; the render path shows a translated empty state and
      disables submit. Verified against all three modes. Original report:
      [FormPage.tsx:254](../src/core/crud/FormPage.tsx#L254) does `fields[0].fields ?? []`, but
      `fieldsFromModuleMetadata` returns `[]` when `typeof metadata.crud !== "object"`
      ([FormPage.tsx:33](../src/core/crud/FormPage.tsx#L33)) → `Cannot read properties of undefined`.
- [x] **B-03 — Server error messages never reached the user.** **Fixed.** Worse than first reported:
      the interceptor lived in `refreshThunder()`, whose only caller is `useLogout()`
      ([protected.tsx:273](../src/core/protected.tsx#L273)) — which then sets
      `window.location.href`, so it was torn down by the page reload a moment later. The toast-on-
      server-error path had **never run in a live session**. Fix: registration moved into
      `initThunder()` so every SDK instance gets it, made idempotent via an eject handle so repeated
      init cannot duplicate toasts, and cancellation now checks `code === "ERR_CANCELED"` as well as
      the message (every list page aborts in flight, and a regression here would toast on every
      navigation). Verified against real axios: abort → silent, server `messages` → one toast each,
      plain error → its message, re-registration → no duplicates. Also switched SDK `logs: true` to
      `import.meta.env.DEV`. Original report: The axios response interceptor that
      surfaces server messages is only installed in `refreshThunder()`
      ([thunder.ts:33](../src/core/lib/thunder.ts#L33)), never in `initThunder()` — which is what
      `main.tsx` calls. Users see no server error detail until after a logout/refresh cycle.
      Compounded by [FormPage.tsx:217](../src/core/crud/FormPage.tsx#L217) swallowing the caught error.
- [x] **B-39** **Fixed.** The generic toast is suppressed when the response already carried `messages`, so a validation failure shows the server's reasons only. Original report: — A failed form submit now raises up to three toasts.** With B-03 fixed, a validation
      failure shows each server message *plus* `FormPage`'s generic "Failed to create {{name}}."
      ([FormPage.tsx](../src/core/crud/FormPage.tsx)). Informative but noisy — the generic toast
      should probably be suppressed when the response carried its own messages.
- [~] **B-04** *(by design — confirmed with the team; pagination for the table view may be added
      later. The card view keeps its own pagination.)* — Table list view has no pagination. `offset`/`limit` are only added to the query when
      `isCard` is true ([ListPage.tsx:216-221](../src/core/crud/ListPage.tsx#L216-L221)), and the
      `<Pagination>` is only rendered in the card branch
      ([ListPage.tsx:534](../src/core/crud/ListPage.tsx#L534)). The default table view fetches the
      **entire collection** on every load.
- [x] **B-05** **Fixed.** `getInitials` now splits on whitespace and uses first + last word. Verified: `"John Doe"`→`JD`, `"Mary Jane Watson"`→`MW`, `"Ali"`→`AL`. Typo `unamed` corrected. Original report: — `getInitials()` returns the first two characters, not initials.**
      [utils.ts:78-83](../src/core/lib/utils.ts#L78-L83) destructures a *string*, so `last` is always a
      non-empty char array and the `!last` branch is dead. Verified: `"John Doe"` → `"JO"`, expected `"JD"`.
      Also the fallback string is misspelled `"unamed"`.
- [x] **B-06 — Wallet reads dropped their query, and invalidation missed the live cache entry.**
      **Fixed.** Two defects, and the second was the one users could see. (1) `getWallets` hashed
      `query` into the cache key then sent `query: {}` — a latent landmine, since both current callers
      pass no query. (2) The live bug: `invalidateWallets()` called `getWallets()` /
      `getWalletLedgers()` **with no arguments**, invalidating only the entry keyed by `hash({})`,
      while `transaction-history.tsx` reads through `getWalletLedgers(query)` with filters and
      pagination — so **the transaction history stayed stale after every transfer**. Fix: the query is
      passed through; invalidation now uses `ThunderSDK.withCaching({ matcher })` to reach every
      wallet entry whatever its query hash; both reads accept the `signal` so they can be aborted.
      Matcher verified against 12 key shapes, including lookalikes (`subwallets.get`,
      `wallets.getBalance`, `walletLedgersArchive.get`) that must not be caught. Original report:
      [wallet.ts:9](../src/core/endpoints/wallet.ts#L9) hashes `query` into the cache key but then calls
      `ThunderSDK.wallets.get({params:{}, query:{}})`. Any filtered wallet fetch silently returns
      unfiltered data under a distinct cache key. `invalidateWallets()` then only clears the `{}` entry.
- [x] **B-07 — Date inputs lose their value in edit mode.** **Fixed — three defects, one of them
      silent data loss in half the world.** (1) *Ordering:* `setIsRecordLoading(false)` ran inside
      `.finally()` on the fetch, i.e. **before** `methods.reset()`, so the form rendered once with
      empty values. (2) *Uncontrolled:* the two date inputs used `defaultValue`, so they latched that
      blank and never saw the reset — opening a record for edit showed empty dates, and saving wrote
      the blanks back. Both are now `value=`, controlled. (3) *Timezone, surfaced by fixing (2):*
      `new Date("2024-01-15")` parses as **UTC** midnight while `formatDateForInput` reads **local**
      parts, so once the field round-tripped, every save in a negative UTC offset shifted the date
      back a day — proven at UTC-10/-8/-5, correct at UTC+0/+5/+9. A new `parseDateInput()` builds
      the Date from local parts, returns `null` for empty input (`new Date("")` was submitting
      `Invalid Date`), and rejects rollovers like `2024-13-45`, which `Date` would otherwise accept
      as 2025-02-13. The record effect also gained a cancellation guard and a `catch`, so a failed
      load no longer hangs on the skeleton. Original report: Date controls use `defaultValue`
      (uncontrolled — [RenderInput.tsx:468](../src/core/crud/form/RenderInput.tsx#L468) and
      [:490](../src/core/crud/form/RenderInput.tsx#L490)), while `FormPage` flips `isRecordLoading`
      to `false` inside `.finally()` *before* calling `methods.reset(results[0])`
      ([FormPage.tsx:155-165](../src/core/crud/FormPage.tsx#L155-L165)). The form renders once with
      empty values, and uncontrolled inputs never pick up the reset.
- [x] **B-08** **Fixed** in the shared `findFieldError` helper: the descent now starts at the root and follows the path strictly. Verified that `wage.amount` no longer resolves to an unrelated top-level `amount` error. Original report: — Nested field errors resolve to the wrong error.** The `getError` loop
      `error = error?.[p] ?? errors[p]` re-falls-back to the *top-level* key on every iteration.
      Duplicated verbatim in three files:
      [RenderInput.tsx:57-72](../src/core/crud/form/RenderInput.tsx#L57-L72),
      [RenderArray.tsx:42-57](../src/core/crud/form/RenderArray.tsx#L42-L57),
      [RenderObject.tsx:32-47](../src/core/crud/form/RenderObject.tsx#L32-L47).
- [x] **B-09** **Fixed** in the shared `groupPath` helper: `replace(/\s+/g, "-")`. Verified `"Human Resources Admin"` → `human-resources-admin`. Original report: — Group paths with more than one space break.** `.replace(" ", "-")` replaces only the
      first space. A group named `"Human Resources Admin"` becomes `human-resources admin`, which does
      not match its own route. Four sites: [router.tsx:143](../src/core/router.tsx#L143),
      [ListPage.tsx:108](../src/core/crud/ListPage.tsx#L108),
      [ListPage.tsx:302](../src/core/crud/ListPage.tsx#L302),
      [ViewPage.tsx:21](../src/core/crud/ViewPage.tsx#L21). Same class of bug in
      `appName()` ([utils.ts:16](../src/core/lib/utils.ts#L16)).
- [x] **B-10** **Fixed.** The self-matching `matchPath` call is gone; `allowForm` now asks the module metadata whether `create` or `update` exists — the actual condition `router.tsx` uses to emit a form route. Original report: — `allowForm` is always true.** [ListPage.tsx:301-304](../src/core/crud/ListPage.tsx#L301-L304)
      matches a path against *itself*, which always succeeds (verified). The literal `/tenant/` prefix is
      also wrong — the real segment is the tenant id. The permission check beside it is doing all the work.
- [x] **B-11** **Fixed.** Deletes run through `Promise.allSettled`, so one rejection no longer skips the rest (and the user is told how many failed), and the **count** cache is invalidated alongside the rows. Original report: — Count is not invalidated after a bulk delete.**
      [ListPage.tsx:629](../src/core/crud/ListPage.tsx#L629) calls `get.invalidate()` only; the total
      stays stale. The delete loop also has no error handling — one failure aborts the rest with no toast.
- [x] **B-12** **Fixed.** `setError(null)` on a successful response, so error UI clears on a working retry. Original report: — `use()` never clears a previous error.** On a successful retry,
      [use.tsx:58](../src/core/hooks/use.tsx#L58) sets data but leaves `error` set, so error UI sticks.
- [x] **B-13** **Partly fixed.** The button is hidden behind a `HAS_SETTINGS_ROUTE` constant instead of navigating to a guaranteed 404. Building the page stays open as F-08. Original report: — Mobile "Settings" button navigates to a route that does not exist.**
      [mobile/index.tsx:129](../src/core/layouts/mobile/index.tsx#L129) goes to `/${tenantId}/settings`;
      there is no `settings` route anywhere in `coreRoutes`. Guaranteed 404.
- [x] **B-14 — Unread-count polling runs at ~4 ms when the env var is unset.** **Fixed in passing**
      during the R-07 consolidation — consolidating three copies forced a single definition, and
      `unreadCountInterval` is now `Number(...) || 30_000` in `lib/constants.ts`. Original report:
      [mobile/index.tsx:80](../src/core/layouts/mobile/index.tsx#L80) passes the raw
      `import.meta.env.VITE_UNREAD_COUNT_INTERVAL` to `setInterval`; `undefined` → minimum delay.
      `VITE_UNREAD_COUNT_INTERVAL` only exists in `.env`, not in the mode-specific env files.
- [x] **B-15** **Fixed.** Skip and Get Started share one `dismiss()` that persists the preference. Original report: — Onboarding "Skip" does not persist.**
      [onboarding.tsx:76](../src/components/onboarding.tsx#L76) only calls `setOpen(false)`; it never
      writes the `onboarding` preference, so the flow reappears on every launch.
- [x] **B-16** **Fixed.** Clamps to `totalPages - 1`. Verified page 999 of a 5-page list resolves to 4. Original report: — Pagination page clamp uses the item count.**
      [pagination.tsx:81](../src/components/pagination.tsx#L81) clamps to `total` (number of records)
      instead of `totalPages - 1`.
- [x] **B-17** **Fixed.** Each `$nbt` now gets its own `$or` nested under `$and`, so two "not between"
      filters stay independent — the shared `mongoFilter.$or` turned an AND of two exclusions into a
      single OR, meaning a second such filter *widened* the results instead of narrowing them.
      **`mongoToFilter` had to change with it**: it reverse-maps `$or` pairs back into filter chips,
      so the new shape would have been unreadable. It now reads both, which keeps links already saved
      with the flat `$or` working. Verified: two filters stay independent, both round-trip to chips,
      legacy flat-`$or` links still decode, `$bt` untouched. Original report: — Multiple "is not between" filters collapse into one `$or`.**
      [filterToMongo.ts:141-154](../src/core/crud/filters/lib/filterToMongo.ts#L141-L154) pushes every
      `$nbt` into one shared `mongoFilter.$or`, turning an AND of two exclusions into a single OR.
- [x] **B-18** **Fixed** by renaming the labels to match the inclusive operators (`is at least` / `is at most`, `is on or after` / `is on or before`). Swapping the operators to `$gt`/`$lt` would silently change the meaning of filters already saved in URLs. Original report: — "is greater than" maps to `$gte`, "is less than" maps to `$lte`.**
      [operators.ts:19-20](../src/core/crud/filters/lib/operators.ts#L19-L20) and
      [:37-38](../src/core/crud/filters/lib/operators.ts#L37-L38) — the labels say strict, the operators are inclusive.
- [x] ~~**B-19 — Regex filter values are not escaped.**~~ **Resolved by D3** — the framework escapes
      `{ type: "regex" }` values server-side. No client change; document the guarantee instead.
- [x] **B-20** **Fixed.** One `setSystemBars(hex, style)` replaces the pair that re-converted an already-hex value, and `resolvedTheme` is now a dependency so the bars follow a theme switch. Original report: — Native system-bar colour is converted twice.**
      [AppWrapper.tsx:36-39](../src/core/AppWrapper.tsx#L36-L39) calls `rgbToHex(background)` and then
      passes the result into `setDarkStyle`/`setLightStyle`, which call `rgbToHex` again on an already-hex
      value. The effect also omits `resolvedTheme` from its deps, so the bars do not follow a theme switch.
- [x] **B-21** **Fixed.** `<Toaster theme={resolvedTheme} />`. Original report: — Toasts are locked to the light theme.**
      [layout-provider.tsx:51](../src/core/layouts/layout-provider.tsx#L51) hardcodes `theme={"light"}`.
- [x] **B-22** **Fixed.** A `Root` component subscribes to `useTranslation` and feeds `i18n.dir()` to `DirectionProvider`, so Base UI re-lays-out on language change. Original report: — `DirectionProvider` is fixed at mount.**
      [main.tsx:17](../src/main.tsx#L17) reads `i18next.language` once. Switching language updates the
      `dir` attribute ([App.tsx:72](../src/App.tsx#L72)) but not Base UI's direction context.
- [x] **B-23** **Fixed.** The unmodified `d` hotkey is removed, along with the `isEditableTarget` helper that existed only to serve it. Original report: — Pressing `d` anywhere toggles dark mode.**
      [theme-provider.tsx:170-205](../src/components/theme-provider.tsx#L170-L205) — no modifier key,
      only guarded against editable targets. Surprising and undocumented.
- [x] **B-24** **Fixed** with an `envFlag()` reader treating `0`/`false`/`off`/`no` as disabled; applied at both `VITE_DISABLE_WALLET` sites. Original report: — `VITE_DISABLE_WALLET` can never be falsy.** Vite env values are strings, so
      `VITE_DISABLE_WALLET=0` still disables the wallet.
      [router.tsx:179](../src/core/router.tsx#L179), [navbar/index.tsx:368](../src/core/layouts/navbar/index.tsx#L368).
- [x] **B-25** **Fixed.** The `App.addListener` handle is kept and removed on cleanup — previously every
      remount added another `appUrlOpen` listener and the old ones lived for the life of the app, each
      re-running the login callback. The effect also gained a `cancelled` guard (including for a
      teardown that happens while `addListener` is still awaiting) and now lists its real
      dependencies, which is safe because `callbackUri`, `handleLogin` and `userManager` are each
      stable for the provider's lifetime. Original report: — `AuthProvider` leaks its native URL listener and has a stale-closure effect.**
      [AuthProvider.tsx:133](../src/core/context/AuthProvider.tsx#L133) never removes the `appUrlOpen`
      listener; the effect at [:146](../src/core/context/AuthProvider.tsx#L146) declares `[]` deps while
      using `callbackUri`, `handleLogin` and `userManager`.
- [x] **B-26** **Fixed.** One configured axios client per base URL replaces the bare `axios` calls:
      `baseURL` with trailing slashes stripped (a `VITE_TRIGGERS_BASE_URL` ending in `/` produced a
      double slash), a 15s timeout, `AbortSignal` support on all three calls, and path segments
      escaped. **Deliberately not changed:** the requests still send no credentials, because enabling
      them needs the triggers service to return `Access-Control-Allow-Credentials`. No toast
      interceptor either: the unread count polls every 30s, so a failing poll would spam. Callers
      already catch, and `markNotificationAsRead` surfaces its error. Original report: — Notification endpoints bypass the SDK.**
      [notification.ts](../src/core/endpoints/notification.ts) uses bare `axios`, so no auth
      interceptors, no `withCredentials`, no error toasts; `baseUrl` is concatenated without trailing-slash
      normalisation.
- [x] **B-27** **Fixed.** `pageSize` added to the query memo deps. Original report: — `ListPage` query memo is missing `pageSize`.**
      [ListPage.tsx:225](../src/core/crud/ListPage.tsx#L225) — changing page size does not refetch.
- [x] **B-28** **Fixed.** The item now links to the notifications route. Original report: — Dead "Notifications" menu item.**
      [navbar/index.tsx:302-305](../src/core/layouts/navbar/index.tsx#L302-L305) has no `onClick`.
- [x] **B-29** **Fixed.** The unresolvable Radix variable is dropped; `min-w-56` already sized the menu. Original report: — Radix CSS variable in a Base UI component.**
      [navbar/index.tsx:257](../src/core/layouts/navbar/index.tsx#L257) uses
      `w-(--radix-dropdown-menu-trigger-width)`, which never resolves in this stack.
- [x] **B-30** **Fixed.** `type="image/png"`. Original report: — `index.html` favicon MIME type is `image/svg+xm+png`.**
      [index.html:5](../index.html#L5) — typo; the file is a PNG.
- [x] **B-31** **Fixed** together with F-04. `FormPage` no longer resolves refs at all
      (`resolveRef: false`) - it was downloading every referenced collection before the form could
      paint. `ref` fields now render `RefSelect`. The one remaining consumer, the list filter
      dropdowns, is capped at `REF_OPTIONS_LIMIT = 100`. Original report: — Ref dropdowns fetch the entire referenced collection.**
      `JSONSchemaToFields.resolveRef` ([FormPage.tsx:69-83](../src/core/crud/FormPage.tsx#L69-L83))
      issues a `get` with no `limit`. A `ref` to a large module loads every record into a `<select>`.

### 2.2 Missing translations

- [x] **B-32** **Fixed.** All 227 strings now live in `src/core/locals/{en,ar}`, and `src/locals/{en,ar}`
      ship empty as the developer's override layer. `i18n.ts` merges app **over** core, so a
      developer overrides any framework string by redefining that key — and `--forceSync` can now
      actually deliver translation updates, which it never could while the strings sat in the
      app-owned file (S-02). Original report: — `src/core/locals/{en,ar}/translation.json` are both empty (`{}`).** All 72/76 existing keys
      live in `src/locals/`, which is the *app override* layer. For a boilerplate this is backwards:
      every generated app inherits the framework's strings in its own project-level file, and a `deno task
      generate:app` refresh will fight the developer's edits. **Move core strings into `core/locals`.**
- [x] **B-33** **Fixed.** Coverage is now **227 / 227 in both languages, zero missing, zero
      untranslated**. 125 keys were missing from `en` and 121 from `ar` at the start of this pass. Original report: — 118 `t()` keys missing from `en`, 114 from `ar`.** Full list reproducible with the scan
      in §5. Arabic users currently see ~114 strings in English, including the entire auth flow
      (`"Sign in to continue"`, `"Getting things ready!"`, `"We are loading your permissions..."`),
      all form chrome (`"Submit"`, `"Cancel"`, `"Update"`, `"This field is required!"`,
      `"Record not found."`), pagination, notifications and the markdown editor.
- [x] **B-34** **Fixed.** Wrapped the hardcoded JSX in `overview.tsx` (the whole page), `not-found.tsx`
      (which already imported `t` but never used it for its copy), the navbar's `Toggle theme` /
      `Logout` / `Unnamed` / `N/A`, `protected.tsx`'s `Sign In` / `Logout` / `Go to Account` and both
      unexpected-error fallbacks, the onboarding `Skip` / `Continue` / `Get Started` plus its screen
      copy, the sidebar brand (now `appName()` rather than a literal `Thunder UI`), and the
      `ListPage` screen-reader labels. Original report: — Hardcoded English in JSX, not wrapped in `t()` at all:**
      - [overview.tsx:21-30](../src/pages/overview.tsx#L21-L30) — the entire welcome page
      - [not-found.tsx:22-26](../src/core/layouts/shared/not-found.tsx#L22-L26) — title and description
        (the file already imports `t`)
      - [navbar/index.tsx:226](../src/core/layouts/navbar/index.tsx#L226) `Toggle theme`,
        [:347](../src/core/layouts/navbar/index.tsx#L347) `Logout`,
        [:276](../src/core/layouts/navbar/index.tsx#L276) `Unamed`, [:92](../src/core/layouts/navbar/index.tsx#L92)
        `Hide balance`/`Show balance`, [:130](../src/core/layouts/navbar/index.tsx#L130) `Toggle menu`
      - [protected.tsx:84](../src/core/protected.tsx#L84) `Sign In`,
        [:116](../src/core/protected.tsx#L116) `Logout`, [:210](../src/core/protected.tsx#L210) `Goto Account`,
        and both `"An unexpected error has been encountered!..."` fallbacks
      - [onboarding.tsx](../src/components/onboarding.tsx) — `Skip`, `Continue`, `Get Started`, all screen copy
      - [sidebar/index.tsx:41](../src/core/layouts/sidebar/index.tsx#L41) — literal `Thunder UI`
      - [pagination.tsx:120](../src/components/pagination.tsx#L120) — `Pages`
      - [ListPage.tsx](../src/core/crud/ListPage.tsx) — `aria-label` on select-all / select-row /
        clear-selection; `AvatarFallback` literal `AV`
- [x] **B-35** **Fixed.** Dropped `"Error Occurred!"` and `"adjust or clear filters to reveal
      issues."`, the stale miscased twins of keys actually in use. Three same-meaning pairs remain by
      design — `all`/`All` (filter operator vs. notifications tab) and
      `Insert image`/`Insert Image`, `Insert link`/`Insert Link` (tooltip vs. dialog title). Original report: — Duplicate keys differing only in case** in `src/locals/en`: `"Error Occurred!"` vs
      `"Error occurred!"`, `"adjust or clear filters to reveal issues."` vs the capitalised variant.
      4 keys exist in `ar` but not `en`.
- [x] **B-36** **Fixed.** `timeAgo` and `getDateGroup` now pass a date-fns locale chosen from
      `i18next.language`, and the hardcoded `"Today"`/`"Yesterday"` go through `i18next.t`. Original report: — Dates and relative times are not localised.** `timeAgo` and `getDateGroup`
      ([utils.ts:325-334](../src/core/lib/utils.ts#L325-L334)) call `date-fns` with no `locale`, and
      return hardcoded `"Today"` / `"Yesterday"`. `ListPage` *does* use `Intl.DateTimeFormat(i18next.language)`
      for table cells — the two are inconsistent.
- [x] **B-37** **Fixed.** `t(field.label ?? name)` replaces `field.label ?? t(name)`, which translated
      the raw field name but left a schema-supplied label untranslated. `field.description` is
      translated too, and the same applies to the `RenderArray` / `RenderObject` legends. Original report: — `field.label` is never translated.**
      [RenderInput.tsx:86](../src/core/crud/form/RenderInput.tsx#L86) does `field.label ?? t(name)` — the
      schema-provided label bypasses i18n entirely, while the raw field name gets translated.
      `field.description` ([:92](../src/core/crud/form/RenderInput.tsx#L92)) is never translated either.
      Same in `RenderArray`/`RenderObject` legends.
- [x] **B-38** **Fixed** per your decision: `fallbackLng: "en"` with
      `detection.order: ["localStorage", "navigator"]`. An Arabic browser still resolves to Arabic
      automatically; everyone else gets English instead of Arabic. The inline comment claimed browser
      settings were consulted when they were not — now they are. Original report: — `fallbackLng: "ar"`** ([i18n.ts:37](../src/i18n.ts#L37)) with `detection.order:
      ["localStorage"]` only. A first-time visitor with no stored preference gets Arabic regardless of
      browser language, and the inline comment ("then browser settings") does not match the config.

- [x] **B-40 — Hooks called conditionally in `NotificationPopover`.** **Fixed.**
      `useRegisterPushNotification()` and a `useEffect` sat inside
      `if (Capacitor.getPlatform() !== "web")`. The platform never changes at runtime so it did not
      crash in practice, but any refactor could have turned it into a hook-order violation. The hook
      holds no state, so it is now called unconditionally and the platform check moved into the
      effect body.
- [x] **B-41 — The layout component was resolved by an inline factory during render.** **Fixed.**
      `LayoutProvider` computed `Layout` from an immediately-invoked arrow in the render body, which
      React (and `react-hooks/static-components`) reads as creating a component per render — the risk
      being that the entire subtree remounts and loses state. Hoisted to module scope.
- [x] **B-42 — Undated notifications were grouped under the literal string "undefined".** **Fixed.**
      `groups[n?.dateGroup!]` combined an optional chain with a non-null assertion; entries without a
      `dateGroup` are now skipped.
- [x] **B-43 — JSX built inside `try/catch` in `FilterValueDateDisplay`.** **Fixed.** React renders
      children *after* the function returns, so the `catch` never protected rendering — it only
      happened to catch `format()` throwing on an unresolved relative date. Only the formatting is
      guarded now, and the JSX is returned once outside.
- [x] **B-44 — Unused catch bindings and stale `eslint-disable` directives.** **Fixed.** Two
      `catch (e)` with unused bindings, three `eslint-disable` comments for rules that no longer fire
      (left behind by the earlier dedup), and a triple negation `!!!` in `ListPage`.

---

## 3. Suggested missing features

- [x] **F-01** **Closed as by design.** A detail route with no registered view goes to that module's
      edit form; there is no generic read-only detail page, and the team keeps it that way. Original report: — A real detail/view page.** `ViewPage` currently redirects to the *edit form* when no
      override exists ([ViewPage.tsx:17-27](../src/core/crud/ViewPage.tsx#L17-L27)). There is no
      read-only record view, which also means read-only users have nowhere to land.
- [x] **F-02** **Resolved by removing the prop.** `TViewProps.data` was always `{}`, which read as
      though the record had been fetched for you. Views now take **no props**, mirroring
      `TFormsOverride`: `TViewsOverride = Record<string, React.ComponentType>`. `TViewProps` is
      kept as a deprecated empty type so an existing import still resolves, and `ViewPage` renders
      `<View />`. Fetching the record is the detail component's job, by design — confirmed with the
      team. Original report: — `ViewPage` never fetches the record.** It renders `<View data={{}} />`
      ([ViewPage.tsx:15](../src/core/crud/ViewPage.tsx#L15)) — every custom detail view has to refetch
      by id itself. The `TViewProps.data` contract is a lie.
- [~] **F-03** *(deferred with B-04)* — Table pagination + page-size control** (pairs with B-04). `usePagination` already
      exposes `setPageSize`; nothing uses it.
- [x] **F-04** **Built:** [`src/core/custom/RefSelect.tsx`](../src/core/custom/RefSelect.tsx) - a
      searchable, server-paginated reference picker. Popover + cmdk `Command` with
      `shouldFilter={false}` so filtering happens server-side; 25 records per page with *Load more*;
      300ms debounced search as a typed case-insensitive `$regex` `$or` across the field's
      `refLabel` fields; every request abortable, with the previous one cancelled on each keystroke
      and on unmount; a label cache so a chosen item still reads correctly once the list is filtered
      or paged past it; a separate `$in` lookup (objectId-typed, matching the list filter convention)
      to resolve labels for values arriving with the record in edit mode; single and `multi`
      selection, clear button, and an inline error state with Retry. Honours `refFilters`,
      `refLabel` (string or array) and `refValue`. Original report: — Searchable / paginated reference picker.** Required to fix B-31 without a regression on
      large collections.
- [ ] **F-05 — Table sorting from column headers.** `sort` state exists in `ListPage` but is only ever
      set by a card override's `fetcher`.
- [ ] **F-06 — `src/overrides/layout.tsx`.** `LayoutProvider` accepts a `layout` prop but `App.tsx`
      never passes one, so a custom shell means editing a core-adjacent file. An override entry would
      match the existing pattern and keep `generate:app` refreshes clean.
- [x] **F-07** **Fixed** alongside the G-series: `buildRules(field, t)` in `RenderInput` now derives `required`, `pattern`, `minLength`/`maxLength`, `min`/`max` and array `minItems`/`maxItems` from the schema, and replaces the rule literal that was spelled out at all **15** Controller call sites. — Validation from the schema.** `minLength`/`maxLength`/`minimum`/`maximum` reach the DOM
      as attributes but never enter the React Hook Form `rules`, so they are unenforced for every
      non-native control (dropdown, tag input, number input, uploads).
- [ ] **F-08 — A `settings` page** (pairs with B-13) — the mobile layout already links to one.
- [ ] **F-09 — Error boundary.** `errorElement: <NotFound />` is set only on the root route
      ([App.tsx:31](../src/App.tsx#L31)); a render error inside a module page has no boundary.
- [ ] **F-10 — Export / bulk actions beyond delete.** The action bar only offers edit (single) and delete.
- [x] **F-11** **Fixed.** `.env.example` documents all 13 `VITE_` variables used in the code, grouped by concern, with the unit or accepted values for each. Verified mechanically that no variable read in `src/` is undocumented. Original report: — `.env.example`** (see C-02).
- [x] **F-12** **Done** as C-13. Original report: — A translation-key extraction script** wired as an npm script, so missing keys
      are caught before review.
- [x] **F-13** **Done** (D8). `src/core/lib/features.ts` exposes `features.wallet` / `.users` / `.notifications`, read through `envFlag` so `0`/`false`/`off`/`no` all disable. Gated: the wallet route and the navbar balance widget; the users card view; the notifications route (which now redirects when off, so `/notifications` cannot render a page polling a disabled service), the navbar bell and the mobile bell. Original report: — Env flags for the built-in feature pages** (per D1). Only `VITE_DISABLE_WALLET` exists;
      `users` and `notifications` have no equivalent, so every generated app ships them. Needs a shared
      boolean-env helper too — the current `!import.meta.env.VITE_DISABLE_WALLET` test treats the string
      `"0"` as truthy (B-24).

---

## 4. Refactor / cleanup

Backwards-compatible unless noted.

- [x] **R-01** **Done. `RenderInput.tsx` 697 → 575 lines; `<Controller>` usages 18 → 2.** A single
      `controlled(render, overrideRules?)` helper binds `name`, `control`, `rules` and `defaultValue`,
      so each branch is now just its control — the shape a contributor has to copy to add a field
      type. Two related cleanups fell out: the duplicated `enum` item-mapping became one
      `enumItems()`, and the two date branches collapsed into one (they differed only in
      `type` and the `withTime` flag).

      `controlled` is deliberately a **plain function, not a component** — a component declared
      inside the render body would get a new identity every render and remount its subtree, which is
      exactly the defect B-41 fixed in `LayoutProvider`.

      **Verified mechanically**, because an omitted optional prop is the failure mode of a
      15-branch rewrite and typecheck would not catch it: a script extracted the prop list of every
      control before and after and diffed them. Three reported differences were regex artifacts (a
      `=>` inside `items={...}` truncated the old match) and one was index-shift from merging the date
      branches; the merged date input and the fallback input were then compared line by line and are
      equivalent. `eslint` now reports **zero problems** for the file, and the lazy `phone-input` and
      `MarkdownEditor` chunks still split correctly. Original report: — Collapse the 15 duplicated `<Controller>` blocks in `RenderInput`.** Every branch repeats
      the same `control` / `rules` / `defaultValue` triple; ~525 lines would drop to roughly half. This is
      the single biggest barrier to a new contributor adding a field type. **Do this before writing the
      "how to add a custom field type" doc.**
- [x] **R-02** **Done** during the dedup pass: `findFieldError` in `src/core/crud/form/errors.ts` replaced all three copies, and B-08 was then fixed once, in it. Original report: — Extract one `getFieldError(errors, name)` helper** and delete the three copies (fixes B-08
      in one place).
- [x] **R-03** **Done** during the dedup pass: `groupPath()` in `lib/utils.ts` replaced all four call sites, and B-09 was then fixed once, in it. Original report: — Extract one `groupPath(group)` helper** for `toLowerCase() + space→dash` and use it at all
      four sites (fixes B-09 in one place).
- [~] **R-04** *(reverted per D6 — see D-03)* — Delete the unused half of `cssVars.ts`.** `configureCssVars`, `getCssVar`, `setCssVar`,
      `removeCssVar`, `subscribeCssVars`, `refreshCssVars` and the module-level listener set are
      **entirely unreferenced**; `useCssVar` does not even subscribe to them. Only `useCssVar` is used
      (one call site, `AppWrapper`).
- [x] **R-05 — Delete `JSONSchemaToFields.jsonFieldSchema`.** The zod schema at
      [jsonSchemaToFields.ts:387-417](../src/core/lib/jsonSchemaToFields.ts#L387-L417) is never used, and
      it is the only reason `zod` is imported — **`zod` is not in `package.json`**, it only resolves
      transitively through `thunder-sdk`. Removing it drops an undeclared dependency.
- [x] **R-06 — Move the 300-line commented JSON Schema sample** out of
      [jsonSchemaToFields.ts:1-300](../src/core/lib/jsonSchemaToFields.ts#L1-L300) and into the docs we
      are about to write. It is genuinely good reference material in the wrong place.
- [x] **R-07 — De-duplicate the trigger env constants.** `triggersTenantId` / `triggersBaseUrl` /
      `unreadCountInterval` are declared in [constants.ts:24-26](../src/core/lib/constants.ts#L24-L26),
      again in [utils.ts:336-338](../src/core/lib/utils.ts#L336-L338), and read inline again in
      [mobile/index.tsx:56-58](../src/core/layouts/mobile/index.tsx#L56-L58). Pick one, parse
      `unreadCountInterval` as a number with a default (fixes B-14).
- [x] **R-08 — Delete `allowDisplay` in [sidebar/index.tsx:22](../src/core/layouts/sidebar/index.tsx#L22)**,
      a verbatim copy of `allowDisplayRoute` in `lib/utils`. The sidebar layout also bypasses
      `getNavRoutes`/`sortRoutes`, so route `priority` is silently ignored there but honoured in the
      navbar and mobile layouts — worth unifying.
- [ ] **R-09 — Move the conditional-hook early returns.** `FormPage`, `RenderInput`, `RenderArray` and
      `RenderObject` all `return` before calling hooks (hence four `eslint-disable
      react-hooks/rules-of-hooks` headers). `RenderInput` is the risky one: `field.type` can change
      between renders as refs resolve asynchronously. Split the override/dispatch decision into a thin
      parent component.
- [~] **R-10** *(reverted per D6 — aliases restored as `@deprecated`; only the duplicate prop was collapsed, and it now falls back)* — Trim the speculative breadcrumb API.**
      [breadcrumb.tsx](../src/core/layouts/shared/breadcrumb.tsx) exports `setBreadcrumbTitle` +
      `setBreadcrumb` (alias), `useBreadcrumbTitle` + `useBreadcrumb` (alias), and accepts both
      `customTitleCallback` and `resolveLabel` for the same thing. **None of the four aliases or either
      callback prop is used anywhere.** Keep one of each before documenting it.
- [~] **R-11** *(reverted per D6 — see D-05)* — `FullScreenArea` is never mounted,** so `usePortalContainer` always returns
      `document.body` — which makes the five `core/custom/overrides/*Content.tsx` wrappers
      ([DropdownMenuContent](../src/core/custom/overrides/DropdownMenuContent.tsx) et al.) pure
      pass-throughs today. Either wire fullscreen up or drop the indirection.
- [x] **R-12** **Fixed.** The two metadata passes are now sequential with a cancellation guard: columns render from the unresolved pass, then upgrade when the `ref` option lists arrive. Previously both ran unconditionally, so the schema walk and every `resolveRef` request happened twice per mount. Original report: — Remove the double fetch in `ListPage`'s field effect.**
      [ListPage.tsx:364-369](../src/core/crud/ListPage.tsx#L364-L369) calls
      `columnFromModuleMetadata` twice (once without refs, once with) and sets state twice, with no
      cancellation if `metadata` changes mid-flight.
- [ ] **R-13 — `use()` returns a memo it then mutates** ([use.tsx:164-198](../src/core/hooks/use.tsx#L164-L198)).
      It works, but it is the kind of thing that needs a comment or a rewrite before anyone else touches it.
- [ ] **R-14 — `flatten()` and `resolveField()` mutate their inputs**
      ([jsonSchemaToFields.ts:584-586](../src/core/lib/jsonSchemaToFields.ts#L584-L586),
      [:527](../src/core/lib/jsonSchemaToFields.ts#L527)). Calling `flatten` twice on the same array
      double-prefixes every name. Worth making pure before it is documented as a public utility.
- [x] **R-15 — Dead/commented code:** the `Sheets` import and usage in
      [layout-provider.tsx:9,48](../src/core/layouts/layout-provider.tsx#L9),
      the commented `SubNav compact` in [mobile/index.tsx:141](../src/core/layouts/mobile/index.tsx#L141),
      and `ShippingBanner` at [:148](../src/core/layouts/mobile/index.tsx#L148).
- [x] **R-16 — Remove leftover `console.log` / `console.info`:**
      [FormPage.tsx:53](../src/core/crud/FormPage.tsx#L53) (`"Fields:"`, fires on every form load),
      [useRegisterPushNotification.tsx:19](../src/core/hooks/useRegisterPushNotification.tsx#L19),
      [notification-popover.tsx:82,109](../src/core/pages/notifications/notification-popover.tsx#L82),
      [notification-sidebar.tsx:87](../src/core/pages/notifications/notification-sidebar.tsx#L87).
      Also `logs: true` in [thunder.ts:7](../src/core/lib/thunder.ts#L7) — should be dev-only.

---

## 5. Chores / repo hygiene

- [x] **C-01** **Closed.** `AttendanceCard` stays deleted (D7 — not part of Thunder UI). The squatted registrations are gone from the developer's `overrides/crud/cards.tsx`, which now ships empty as intended; `users: UserCardView` moved to core's own `src/core/crud/builtins.ts`, gated by `VITE_ENABLE_USERS`. `ListPage` merges built-ins **under** the overrides, so a developer registering the same key still wins. Original report: — Project-specific code is shipped in the boilerplate.** *Scoped by D1:* `wallet`, `users`
      and `notifications` stay as framework features. What remains to remove is
      [components/AttendanceCard.tsx](../src/components/AttendanceCard.tsx) (an attendance-tracking card
      with `employeeCode` / `punchAt` / `timezone` — clearly one project's domain) and the two default
      registrations in [overrides/crud/cards.tsx](../src/overrides/crud/cards.tsx)
      (`attendances: AttendanceCard`, `users: UserCardView`). The overrides files are the developer's
      — the comment directly above those entries says "Add your custom cards components here" — so they
      must ship empty. If the user card view is a framework feature, `core` should register it itself,
      not squat in the developer's override map.
- [~] **C-02** *(tracked deliberately per D7. `.env.example` is added as documentation; the real files stay committed. Worth revisiting if the repo ever goes public — it carries a live OAuth client id and tenant id.)* — Real credentials and infrastructure are committed.** `.env`, `.env.development`,
      `.env.production` and `.env.mobile` are all tracked and contain
      `VITE_OAUTH_CLIENT_ID=69f0a39b9f909d61a04356c9`, `VITE_TRIGGERS_TENANT_ID=6a0f0dc1216c36e813000c98`
      and `https://erp.huruftech.com` / `https://triggers.huruftech.com`. Every cloned app starts
      pointed at Huruf's production ERP. Replace with `.env.example` + gitignore the real ones.
- [x] **C-03** **Fixed.** `VITE_DEFAULT_CACHE_TTL` is now declared in `.env` and documented in `.env.example`, with the unit (**seconds**) stated. Left at `1` so behaviour is unchanged — raising it is what actually enables the SDK cache. Original report: — `VITE_DEFAULT_CACHE_TTL` is read in four places but defined in none of the env files**
      (`ListPage`, `FormPage`, `endpoints/wallet.ts`, `endpoints/user.ts`). Every call therefore falls
      back to `"1"` — a **1-second** stale time (D4), which effectively disables the SDK cache
      everywhere. Add it to `.env.example` with a sensible default and document the unit.
- [~] **C-04** *(by design — the team tracks `www/` deliberately.)* — Build output is committed.** 22 files under `www/` are tracked, and `.gitignore` does not
      list `www` even though `vite.config.ts` sets `outDir: "./www"`.
- [x] **C-05** **Fixed.** `minify: false` removed. Measured on this tree: **8,135 KB → 4,068 KB raw, 1,672 KB → 1,186 KB gzip.** Sourcemaps left off so the committed `www/` stays small; flip `sourcemap` on temporarily to debug a built bundle. **`www/` needs a rebuild to pick this up.** Original report: — `minify: false` in the production build**
      ([vite.config.ts:9](../vite.config.ts#L9)). Intentional for debugging? It ships unminified JS to
      every generated app.
- [x] **C-06** **Fixed.** `"include": ["src"]` — the phantom root `i18n.ts` is gone; the real file at `src/i18n.ts` was already covered. Original report: — `tsconfig.app.json` includes a non-existent root `i18n.ts`**
      ([tsconfig.app.json](../tsconfig.app.json)) — the file is at `src/i18n.ts`.
- [~] **C-07** *(by design — kept as-is per D7)* — Capacitor identity is hardcoded to Huruf.** `appId: 'com.huruf.thunderui'`,
      `appName: 'thunder-ui'` ([capacitor.config.ts](../capacitor.config.ts)); the generated `android/`
      and `ios/` projects carry `com.huruf.thunderui` too. A per-project rename step is needed (and must
      be documented).
- [x] **C-08** **Fixed.** The mobile logo's `aria-label`/`alt` now use `appName()`; the `"Doze"` key is deleted. — `"Doze"` is a leftover brand name** in the mobile layout's logo `aria-label` and `alt`
      ([mobile/index.tsx:109,112](../src/core/layouts/mobile/index.tsx#L109)). Should be `appName()`.
- [x] **C-09** **Done differently than logged, per the maintainers.** The README is not the
      deliverable: the docs live in the Thunder Framework's Fumadocs site. `llms.txt` at the repo root (the llmstxt.org convention)
      is the source-of-truth brief an LLM consumes to author that section — 20 sections in Markdown,
      covering install, the sync boundary, route generation, the full JSON Schema support matrix,
      every override registry with its exact prop types, layouts, i18n, theming, the mobile build,
      auth, and a §18 list of real limitations. Every factual claim was re-verified against the code
      (key counts, `appId`, storage keys, auth endpoints, flag names, `data={{}}`, empty `Screens`,
      `HAS_SETTINGS_ROUTE`), and every `src/`, `docs/` and `scripts/` path in it was checked to
      resolve. §19 lists the framework-side facts that could not be verified here, so the authoring
      model asks instead of inventing. The README itself is still the stock template — see C-17. Original report: — `README.md` is the stock Vite + shadcn template.** It says nothing about Thunder.
- [x] **C-18 — `zod` was an undeclared runtime dependency.** **Fixed:** declared as
      `zod@^4.6.5`. Worse than previously logged — it did **not** resolve through `thunder-sdk`
      (which declares only `axios` and `path-to-regexp`), but through the **devDependencies**
      `eslint-plugin-react-hooks` and `shadcn`. Two runtime files import it
      (`src/core/lib/zodToMongoProjection.ts`, `src/core/pages/users/userCardView.tsx`), so a
      production install (`npm ci --omit=dev`) would have had no `zod` at all and the build would
      have failed.
- [x] **C-19 — Lint error count was being misread.** `npx eslint .` prints a "potentially
      fixable" line after the `✘ N problems (X errors, Y warnings)` totals line; earlier reports
      in this log read the former. The true count was **2 errors**, both pre-existing on the
      committed baseline: `react-hooks/rules-of-hooks` on `ThunderSDK.useCache` in
      `src/core/crud/metadata.ts` (introduced by the P-12 extraction, which moved the call outside
      the `src/core/endpoints/**` exemption) and `prefer-const` on the timer handle in
      `src/core/custom/UndoToast.tsx`. Both fixed in `eslint.config.js`: the exemption now covers
      `metadata.ts`, and `prefer-const` runs with `ignoreReadBeforeAssign: true`, which is the
      correct option for a variable captured by a closure before it is assigned. **Now genuinely
      0 errors, 68 warnings.**

- [ ] **C-17 — `README.md` is still the stock Vite + shadcn template.** With the real
      documentation now sourced from `llm.txt` into the framework's Fumadocs site, the README only
      needs to be a short orientation for someone opening this repository: what Thunder UI is, the
      `src/core/` read-only rule, the commands, and links to `llms.txt`, `docs/SYNC.md` and the
      published docs.

- [x] **C-10** **Fixed.** An inline script in `index.html` applies the stored theme class and
      `dir`/`lang` **before first paint**; previously both were set in effects after React mounted,
      so every load flashed light-mode and left-to-right. It mirrors `ThemeProvider`'s `storageKey`
      and i18next's `lookupLocalStorage` / detection order / `fallbackLng`, with a comment naming the
      files it must stay in sync with. Verified against the real script extracted from `index.html`
      across 10 cases — stored theme, `system` + OS preference, stored vs. browser language,
      unsupported language, and `localStorage` throwing in private mode. Original report: — No theme/direction flash prevention.** `index.html` has no inline script, so the theme
      class and `dir` attribute are only applied in an effect — light-mode and LTR flash on every load.
- [x] **C-11** **Fixed.** `Screens` ships **empty**, with the type and a worked example in a doc comment, and `Onboarding` returns `null` (and skips the `Preferences` lookup) when there is nothing to show. The three placeholder “Thunder UI” slides no longer appear in every generated app, but the helper is intact — adding one screen turns the flow back on. Original report: — Onboarding placeholder content ships enabled.** `<Onboarding />` is mounted
      unconditionally in [App.tsx:91](../src/App.tsx#L91) and shows three auto-advancing
      "Thunder UI / Thunder UI 2 / Thunder UI 3" screens to every first-time user of every generated app.
- [x] **C-12** **Fixed.** One env-backed `defaultCurrency` in `lib/constants.ts` (`VITE_DEFAULT_CURRENCY`, default `LYD`) replaces the literal at four sites — one of which was lowercase `"lyd"` immediately after an `.toUpperCase()` branch. The `LYD -> د.ل` symbol maps stay: those are data, not fallbacks. Original report: — Hardcoded `"lyd"` currency fallback** in
      [navbar/index.tsx:81](../src/core/layouts/navbar/index.tsx#L81) (lowercase, after an `.toUpperCase()` branch).
- [x] **C-13** **Fixed.** `npm run i18n:check` runs `scripts/i18n-check.mjs`: it scans `t("…")` across `src/`, diffs against core+app locales in both languages using the same merge order as `i18n.ts`, flags missing *and* untranslated keys, lists keys with no static reference, and exits non-zero. Currently passes at 227/227. Original report: — Add the i18n scan as `npm run i18n:check`.** The script used for this audit walks `src/`,
      extracts `t("…")` literals, and diffs them against both locale files in both languages.

- [x] **C-14** **Fixed.** `"typecheck": "tsc -b"`. The script pointed at the solution `tsconfig.json`
      (`"files": []` + references), so `tsc --noEmit` compiled **zero files and always exited 0**.
      It now reports the real state — which is currently **red**, because of C-15. Original report: — `npm run typecheck` checks nothing.** `tsconfig.json` is a solution file
      (`"files": []` plus two `references`), so `tsc --noEmit` against it compiles **zero** files and
      always exits 0. Real type errors only surface through `tsc -b`, which only runs inside
      `npm run build`. Fix: `"typecheck": "tsc -b --noEmit"` (or point it at `tsconfig.app.json`).
      Note it will go red immediately — see C-15.
- [x] **C-15** **Diagnosed; needs your decision.** These are not type-only errors. The four methods
      are **absent from the installed SDK entirely** — not in the `.d.ts`, not in the shipped
      JavaScript:

      | Module | Methods the SDK actually exposes |
      | --- | --- |
      | `ThunderSDK.users` | `ban`, `count`, `create`, `get`, `update` |
      | `ThunderSDK.wallets` | `count`, `get`, `metadata`, `signTransfer`, `transfer` |

      So `users.addFcmToken`, `users.getUserTenants`, `wallets.getOverdraftLimit` and
      `wallets.updateOverdraftLimit` would each throw `TypeError: ... is not a function` **at
      runtime**, not merely fail to compile. Affected today: push-token registration on native
      (both notification components), the tenant list in `userDetail`, and the whole
      `OverdraftLimitModal`. Note the wallet *type* does carry an `overdraftLimit` field, so the
      concept exists in the data model but the endpoints are not in `sdk@0.0.13`. Options: bump the
      SDK, remove the features from the boilerplate, or feature-detect so they degrade instead of
      crashing. Original report: — `npm run build` currently fails: 6 type errors against the SDK.** Pre-existing on
      `master`, unrelated to any change in this audit. Every one is a property the code calls but the
      installed `thunder-sdk` does not declare:

      | Call site | Missing on SDK |
      | --- | --- |
      | [notification-popover.tsx:83](../src/core/pages/notifications/notification-popover.tsx#L83) | `users.addFcmToken` |
      | [notification-sidebar.tsx:88](../src/core/pages/notifications/notification-sidebar.tsx#L88) | `users.addFcmToken` |
      | [OverdraftLimitModal.tsx:64](../src/core/pages/users/components/OverdraftLimitModal.tsx#L64) | `users.getUserTenants` |
      | [OverdraftLimitModal.tsx:117](../src/core/pages/users/components/OverdraftLimitModal.tsx#L117) | `wallets.getOverdraftLimit` |
      | [OverdraftLimitModal.tsx:157](../src/core/pages/users/components/OverdraftLimitModal.tsx#L157) | `wallets.updateOverdraftLimit` |
      | [userDetail.tsx:75](../src/core/pages/users/userDetail.tsx#L75) | `users.getUserTenants` |

      Either the pinned SDK (`sdk@0.0.13`) predates these endpoints, or the features were written
      against a newer build. **This needs your call** — it decides whether the `users` feature set in
      C-01/D1 is actually shippable in the boilerplate.
- [x] **C-16 — Test files are excluded from the build.** `tsconfig.app.json` now excludes
      `**/*.{test,spec}.{ts,tsx}`, so a stray test file cannot break `tsc -b`. Verified with a
      deliberately broken probe file. The project ships **no** test suite and no `test` script by
      design.

---

## 6. Sync boundary — what `--forceSync` must own

Per D5, `deno task generate:app --forceSync` replaces `src/core/` and "core related files". That
constraint is currently **undeclared and violated in both directions**: developers are told to edit
files that will be overwritten, and core depends on files developers are told to own.

### 6.1 Ownership, as the code actually behaves today

| Path | Should be | Evidence |
| --- | --- | --- |
| `src/core/**` | **core** | by definition |
| `src/overrides/**` | **app** | the whole point of the layer |
| `src/pages/**` | **app** | `overview.tsx` is the developer's home page |
| `src/locals/**` | **app** | merged *over* `src/core/locals` in [i18n.ts](../src/i18n.ts) |
| `src/index.css` | **app** | theme tokens — 62 `oklch` declarations |
| `src/core/styles/index.css` | **core** | pure mechanics: `@property`, keyframes, utilities, zero tokens |
| `src/components/ui/**` (50 files) | **core** (see S-03) | core imports `@/components` **168 times** |
| `src/components/reui/**` | **core** | imported by `RenderInput` |
| `src/lib/utils.ts` | **core** | core imports `@/lib` 26 times |
| `src/hooks/**` | **core** | `usePagination`, `useIsMobile` imported by core |
| `src/App.tsx`, `src/main.tsx`, `src/i18n.ts` | **core** | wire `Protected`, `LayoutProvider`, `coreRoutes` |
| `src/components/{theme-provider,onboarding,pagination,refresher}.tsx` | **core** | imported by `main.tsx` / core layouts |
| `src/components/AttendanceCard.tsx` | **neither** | project-specific, should not exist here (C-01) |

### 6.2 Findings

- [x] **S-01 — Re-diagnosed; the original reading was wrong.** `App.tsx` is **not** in `src/core/`,
      so `--forceSync` never touches it and a developer's custom routes there are safe. The real
      problem is the mirror image: **core improvements to `App.tsx` can never reach an existing app.**
      That generalises into the finding below (S-09), which is the one that matters. Documented as
      §6 of [docs/SYNC.md](SYNC.md): keep the wiring thin and add routes via
      `src/overrides/routes.tsx`. Original (incorrect) report:
      [App.tsx:56](../src/App.tsx#L56) says *"You can add your custom routes here, they will not be
      affected by the core routes"*. But `App.tsx` defines the root `Protected` wrapper, the
      `/:tenant` branch and `coreRoutes` — it is unambiguously core. Either `--forceSync` overwrites it
      and **silently deletes the developer's routes**, or it skips the file and **framework routing
      fixes never reach existing apps**. `src/overrides/routes.tsx` already exists for exactly this.
      Delete the comment and point it at the override.
- [x] **S-02** **Resolved by B-32** — all 227 strings now live in `src/core/locals`, so `--forceSync` can deliver translation updates; `src/locals` is the developer's override layer. Original report: — Core translations live in the app-owned file.** This is B-32 re-weighted: because
      `src/core/locals/{en,ar}` are empty and all 72/76 keys sit in `src/locals/`, `--forceSync`
      **can never ship a translation fix or a new core string** to an existing project, and every
      developer's own strings are tangled with the framework's in one file. Fixing B-32 is a
      prerequisite for the sync model working at all.
- [x] **S-03 — `src/components/ui/**` ownership is unstated and load-bearing.** *Resolved by D0:*
      app-owned and customisable. The risk stands and is now a known trade-off — core imports it 168
      times, so a developer editing `button.tsx` can break core, and core UI fixes never reach an app
      that customised the file. Worth a documentation warning. Original report: Core imports from
      `@/components` 168 times, so these 50 shadcn files are effectively core — yet they sit in the
      conventional shadcn location where `npx shadcn add` writes, and the README actively tells
      developers to run it. A developer who customises `button.tsx` loses it on the next sync; a
      framework fix to `button.tsx` that is *not* synced leaves apps broken. **Needs an explicit rule**,
      plus a sanctioned place for developer UI components (e.g. `src/components/custom/`).
- [x] **S-04** **Fixed.** `src/pages/overview.tsx` moved to `src/core/pages/overview.tsx`, so core
      owns its default. The developer replaces it by registering `overview` in
      `src/overrides/routes.tsx`, which is merged **over** core's definition (keeping the icon,
      priority and permission checks). `wallet` and `notifications` got the same slot for
      consistency, and the three keys are excluded from SDK module-name resolution.
      **Core now has zero imports from `@/pages/*`.** Original report: — Core imports an app-owned page.**
      [router.tsx:16](../src/core/router.tsx#L16) does `import Overview from "@/pages/overview"`.
      If a developer deletes or renames their own overview page — a file explicitly meant to be theirs
      ("You can customize this page…") — **the core router fails to build**. Overview should come
      through the override registry, with a core fallback.
- [x] **S-05 — `src/hooks/` and `src/lib/utils.ts` look app-owned but are core.** *Resolved by D0:*
      they are app-owned; core simply depends on them. Same trade-off as S-03. Original report: `usePagination`,
      `useIsMobile` and `cn` are imported by core from paths that, by every naming convention in this
      repo, read as the developer's. Either move them under `src/core/` or declare them.
- [x] **S-06** **Done:** [docs/SYNC.md](SYNC.md). The boundary turned out to be simpler than the
      audit assumed — `--forceSync` replaces **`src/core/` wholesale** and touches nothing else — so
      the doc states that rule, lists what the developer owns, documents every extension point, and
      ends with a pre-release checklist. Its central section is the dependency risk below, and every
      figure in it was verified mechanically. Original report: — There is no machine-readable manifest of the boundary.** Nothing in this repo tells
      `--forceSync` (or a developer) which paths are replaced. A `sync.json` / `SYNC.md` listing
      core-owned globs, committed here and read by the framework command, would make the contract
      checkable instead of folkloric. **This is the single highest-value item for onboarding new devs.**
- [~] **S-07** *(by design — kept as-is per D7)* — Root config carries the framework author's identity.** `capacitor.config.ts`
      (`com.huruf.thunderui`), `package.json` (`"name": "thunder-ui"`, which `appName()` derives the
      visible app name from), `index.html` (`<title>Thunder UI</title>`) and the committed `android/` /
      `ios/` projects are app-owned but ship Huruf's values. A documented rename step is needed, and
      `--forceSync` must not revert it. Ties to C-07.
- [x] **S-08** **Done** — written up as §4 of [docs/SYNC.md](SYNC.md), the boundary the rest of the
      codebase should copy. Verified: `src/index.css` holds 62 `oklch` token declarations,
      `src/core/styles/index.css` holds **zero** — mechanics only. Original report: — The one boundary that *is* right should be the model.** `src/index.css` (developer:
      theme tokens) importing `src/core/styles/index.css` (core: mechanics only, zero tokens) is a clean
      split. Document it as the pattern the other boundaries should follow.

- [~] **S-09** *(accepted — the team considers it a non-issue; documented as a frozen API for core in §5 of SYNC.md.)* — Core depends on 193 import sites it can never update.** Measured: `src/core/`
      imports **199 times** from outside itself, of which only **6** are the intended
      `src/overrides/` registries.

      | Imported by core | Sites | Deliverable by `--forceSync`? |
      | --- | --- | --- |
      | `@/components/ui/*`, `@/components/reui/*` | 160 | **no** |
      | `@/lib/utils` (`cn`) | 21 | **no** |
      | `@/components/theme-provider` | 5 | **no** |
      | `@/components/refresher`, `@/components/pagination` | 4 | **no** |
      | `@/hooks/use-pagination`, `@/hooks/use-mobile` | 3 | **no** |
      | `@/overrides/*` | 6 | n/a — intended |

      Two consequences for the stated purpose of `--forceSync` (shipping security patches and minor
      fixes): a patch that needs to change any of those files **cannot ship through sync at all**, and
      a core patch that *depends* on a newer version of one of them **breaks on sync**, because core
      moves forward while its dependency stays pinned to whatever the developer has.

      This is partly deliberate — developers are meant to theme the shadcn primitives, which only
      works because those files are theirs. §5 of [docs/SYNC.md](SYNC.md) therefore documents them as
      a frozen API for core, and requires any release touching them to be flagged as needing manual
      steps. **Whether that is enough, or whether core should carry its own copy of the primitives it
      depends on, is an open architectural decision.**

---

## 7. Performance

Measured, not estimated — `npx vite build` on the current tree.

- [x] **P-12 — A module side effect blocked code splitting.** **Fixed** as a prerequisite for
      P-01. `FormPage.tsx` assigned `JSONSchemaToFields.resolveRef` at **module scope**, and both
      `ListPage` and the wallet transaction history imported `fieldsFromModuleMetadata` from it — so
      they pulled the entire form page in just to make that assignment run. That made the form route
      impossible to split and left a hidden import-order dependency: whichever module evaluated first
      had to be the one that registered the resolver. Extracted to `src/core/crud/metadata.ts`, which
      both import; `FormPage` re-exports both symbols for backwards compatibility (D6). Audited the
      whole tree for similar hazards — the remaining module-scope statements are all safe
      (`coreRoutes.unshift`, Handlebars helper registration, two `displayName` assignments).

- [x] **P-01** **Largely fixed — initial JS 4,068 kB → 1,933 kB (553 kB gzip).** Measured, not
      estimated: a temporary per-package `manualChunks` build was used to find what was actually
      large, which pointed at four leaf dependencies rather than the routes:

      | Split out | kB (gzip) | Loads only when |
      | --- | --- | --- |
      | `MarkdownEditor` (+ codemirror, lexical, lezer) | 1,293 (428) + 52 CSS | a field has `fieldHint: "markdown"` |
      | `phone-input` (country-flag-icons, libphonenumber-js) | 435 (101) | a field has `type: "phone"` |
      | `userCardView` (pulls `zod`) | 285 (67) | the users card view is enabled **and** shown |
      | `handlebars` + template | 107 (33) | someone exports a wallet PDF |

      `zod` was the sharpest find: it shipped to **every** app even with `VITE_ENABLE_USERS` off,
      because the flag gated the registration but not the import.

      **Route-level `lazy()` was deliberately not done.** These four are leaf components behind a
      condition, each with a local Suspense boundary at its use site, so nothing else can be affected
      while a chunk is in flight. Splitting routes would additionally touch `getNavRoutes`, the
      `display()` permission callbacks and the router's eager `coreRoutes` construction — more risk
      for less gain. It remains available if the entry chunk needs to shrink further. Original report: — One 8.0 MB JavaScript chunk, 1.66 MB gzipped, for 11,651 modules.** There is **zero code
      splitting**: no `React.lazy`, no dynamic `import()` anywhere in `src/`. Every module page, all three
      layouts, the markdown editor, the Handlebars compiler and the whole wallet print pipeline are parsed
      before first paint. For a Capacitor app on a mid-range phone this is the dominant startup cost.
      Route-level `lazy` in `router.tsx` is the obvious first cut.
- [x] **P-02** **Fixed with C-05** — minification enabled; raw bundle halved. — `minify: false` in the production build doubles the bundle.**
      [vite.config.ts:9](../vite.config.ts#L9). Measured: **8.0 MB → 3.98 MB raw, 1.66 MB → 1.17 MB
      gzip** from that one line. Confirm it was deliberate; if it was for debugging, `sourcemap: true`
      is the right tool.
- [x] **P-03** **Fixed with P-01.** Both are now dynamic. `handlebars` additionally had a module-scope
      `Handlebars.compile(...)`, so merely importing the print module pulled the compiler in; the
      template is compiled on first use and cached. Original report: — `@mdxeditor/editor` and `handlebars` are eagerly bundled.** The editor is only reachable
      via `fieldHint: "markdown"` ([RenderInput.tsx:160](../src/core/crud/form/RenderInput.tsx#L160)) and
      Handlebars only via wallet PDF export, yet both load for every user on every page. Both are large
      and both are textbook `lazy()` candidates.
- [x] **P-04** **Fixed, and the original claim was partly wrong.** Each `@font-face` carries a
      `unicode-range`, so browsers only ever **download** the subsets a page needs — the extra
      cyrillic/greek/vietnamese subsets were never a load cost. They were, however, emitted into the
      committed `www/`: **13 woff2 files, ~295kB, of which 8 (~116kB) nobody could ever download.**
      `src/core/styles/fonts.css` now declares only the ranges this app serves, so the build emits
      **5 files**. The real user-facing gap — no Arabic face at all, so Arabic fell back to whatever
      the device provided — is fixed by bundling **Cairo (31kB, Arabic range)**, the same family the
      print templates already fetch. Because selection is per character, Latin still renders in
      Inter/Geist and only Arabic resolves to Cairo, and it works offline in the Capacitor build.
      Note: Geist is **not** removable — it backs `--font-heading`, used by six UI components. Original report: — Two Latin fonts are bundled, and neither supports Arabic.**
      [index.css:6-7](../src/index.css#L6-L7) imports **all** subsets of Inter *and* Geist Variable —
      13 woff2 files, ~295 KB — while the app defaults to Arabic (`fallbackLng: "ar"`). Arabic text
      falls back to a system font. Meanwhile `loadFontsCSS()`
      ([utils.ts:261](../src/core/lib/utils.ts#L261)) fetches **Cairo** from Google Fonts at runtime,
      but only for print templates. Pick one Latin family, subset it, and bundle an Arabic face.
- [x] **P-05** **Measured; closing as not an issue — the original claim was wrong.** The
      `@source inline(...)` matrix costs **1.7kB raw / 0.28kB gzip**, not the inflation the audit
      implied, so it stays as-is (and it is genuinely needed: schema-supplied `className` values are
      invisible to Tailwind's scanner). Measured breakdown of the 227.9kB / 33.7kB gzip stylesheet:
      the `@tailwindcss/typography` plugin is 15kB raw / 2.2kB gzip and **is** used (the markdown
      preview's `prose` classes), leaving ~211kB / 31.5kB gzip for Tailwind base + the shadcn theme +
      Base UI + tw-animate + the app's own utilities. **33.7kB gzip for a complete design system is
      not worth optimising**, and splitting the typography rules out to follow the now-lazy markdown
      editor is not something Tailwind v4 supports per-chunk. Original report: — 343 KB of CSS (46 KB gzip), inflated by a force-generated utility matrix.**
      [index.css:10-12](../src/index.css#L10-L12) `@source inline(...)` materialises
      `grid-cols-{1..12}`, `grid-rows-{1..12}`, `gap-{1..10}`, `col-span-{1..12}` and both grid-flow
      directions. The need is real — schema-supplied `className`/`groupClassName` are invisible to
      Tailwind's scanner — but the range should be narrowed to what schemas actually use, and the
      reason documented so nobody deletes it.
- [x] **P-06** **Fixed.** One `module` memo replaces nine `ThunderSDK.getModule(name)` calls per render, several of which were inside JSX. Original report: — `ThunderSDK.getModule(name)` is called 8 times per `ListPage` render**, several of them
      inside JSX ([ListPage.tsx:397](../src/core/crud/ListPage.tsx#L397),
      [:473](../src/core/crud/ListPage.tsx#L473), [:593](../src/core/crud/ListPage.tsx#L593),
      [:613](../src/core/crud/ListPage.tsx#L613)). Hoist to one `useMemo`.
- [x] **P-07** **Fixed.** `Intl.DateTimeFormat` instances are cached per locale instead of constructed for every date cell on every render. Original report: — A new `Intl.DateTimeFormat` is constructed for every date cell on every render.**
      [ListPage.tsx:136](../src/core/crud/ListPage.tsx#L136). Formatter construction is the expensive
      part; hoist it per-locale.
- [x] **P-08** **Fixed** with R-12. Original report: — `columnFromModuleMetadata` runs twice per list mount** (R-12), so the schema walk,
      flatten and every `resolveRef` request happen twice.
- [x] **P-09** **Fixed.** The 300ms delay now applies only on mobile, where it covers the nav sheet’s close animation. Every desktop navigation was paying it for a sheet that was never open. Original report: — 300 ms artificial delay on every navigation.**
      [navbar/index.tsx:180](../src/core/layouts/navbar/index.tsx#L180) wraps `navigate()` in a
      `setTimeout`. If it is waiting for the sidebar close animation, tie it to the animation instead.
- [~] **P-10** *(half done, half by design: the unbounded ref dropdown is fixed by B-31/F-04; the unbounded table query is B-04, which the team keeps deliberately.)* — Unbounded fetches** — the full-collection list query (B-04) and the full-collection ref
      dropdown (B-31) are the two largest runtime costs and are tracked as bugs.
- [x] **P-11** **Fixed.** `useUnreadCount(userId)` in `src/core/hooks/useUnreadCount.ts` replaces the two separate implementations in the mobile layout and the notification popover. It also aborts in-flight requests on unmount and before each poll, now that the endpoint accepts a signal (B-26). Original report: — Unread-count polling is implemented twice**, once in
      [mobile/index.tsx:60-83](../src/core/layouts/mobile/index.tsx#L60-L83) and once in
      [notification-popover.tsx:105-120](../src/core/pages/notifications/notification-popover.tsx#L105-L120),
      with separate state, separate intervals and separate error handling. Only one runs per layout
      today, so this is duplication rather than double-polling — but it is two places to fix B-14.

---

## 8. Dead code

**Per D6, an export with no in-repo caller is not automatically dead.** A first pass removed several
of these and was reverted: the five `core/custom/overrides/*Content.tsx` wrappers, `FullScreenArea`,
the `cssVars` read/write helpers, the unused `ease.ts` motion tokens and `ActionSwapButton` are all
usable API for a consuming app, and are **kept**. The items below are the ones that survive the D6
test. Items marked *reverted* are recorded for the record and should not be actioned.

- [~] **D-01** *(reverted per D6 — the wrapper is usable API for a consuming app even with no in-repo caller)* — [`core/custom/overrides/HoverCardContent.tsx`](../src/core/custom/overrides/HoverCardContent.tsx)
      is entirely dead.** Nothing imports it, and there is **no `hover-card.tsx` in `components/ui`** for
      it to pair with. Delete the file.
- [~] **D-02** *(reverted per D6 — `ActionSwapButton` is a usable component; only its in-repo callers are absent)* — ~180 of 341 lines in [action-swap.tsx](../src/core/pages/wallet/action-swap.tsx) are
      unreachable.** `ActionSwapButton` is never used; `ActionSwapIcon`, `VARIANT_CLASS`, `SIZE_CLASS`
      and 5 exported types exist only to serve it. Only `ActionSwapText` is live (navbar balance).
- [~] **D-03** *(reverted per D6 — `getCssVar`/`setCssVar` are usable standalone utilities)* — The `cssVars` pub/sub layer is unreferenced** — `configureCssVars`, `getCssVar`,
      `setCssVar`, `removeCssVar`, `subscribeCssVars`, `refreshCssVars` and the module-level listener
      `Set`. `useCssVar` does not even subscribe to it, and has exactly one call site. (= R-04)
- [~] **D-04** *(reverted per D6 — a dev-facing extension point for setting a dynamic breadcrumb from a custom page)* — Every public export of the breadcrumb title bus is unused**: `setBreadcrumbTitle`,
      `setBreadcrumb`, `useBreadcrumbTitle`, `useBreadcrumb`, plus the `customTitleCallback` /
      `resolveLabel` prop pair. The `window` CustomEvent machinery behind them is dead too. (= R-10)
- [~] **D-05** *(reverted per D6 — `FullScreenArea` is a dormant capability, not dead code)* — `FullScreenArea` is never mounted**, so `usePortalContainer` always returns
      `document.body` and the five `core/custom/overrides/*Content.tsx` wrappers are pass-throughs. (= R-11)
- [x] **D-06 — `JSONSchemaToFields.jsonFieldSchema`** — a 30-line zod schema that nothing reads, and the
      sole reason `zod` is imported. **`zod` is not in `package.json`**; it resolves only transitively
      through `thunder-sdk`, so this is also an undeclared dependency waiting to break. (= R-05)
- [~] **D-07** *(reverted per D6 — documented design tokens for apps building custom animated pages)* — 5 of 8 motion tokens in [ease.ts](../src/core/lib/ease.ts) are unused**: `EASE_IN_OUT`,
      `EASE_DRAWER`, `SPRING_PANEL`, `SPRING_LAYOUT`, `SPRING_MOUSE`.
- [~] **D-08** *(reverted per D6 — prefixed `_`, but still reachable API)* — `_mongoToFilter`** is exported from
      [mongoToFilter.ts](../src/core/crud/filters/lib/mongoToFilter.ts) and referenced nowhere.
- [x] **D-09 — The 300-line commented JSON Schema block** at the top of `jsonSchemaToFields.ts` (= R-06
      — move it to the docs, it is good reference material).
- [x] **D-10 — Commented-out code:** `Sheets` import + JSX
      ([layout-provider.tsx:9,48](../src/core/layouts/layout-provider.tsx#L9)), `SubNav compact`
      ([mobile/index.tsx:141](../src/core/layouts/mobile/index.tsx#L141)), `ShippingBanner`
      ([mobile/index.tsx:148](../src/core/layouts/mobile/index.tsx#L148)).
- [x] **D-11 — `AttendanceCard.tsx`** — project-specific, not framework (= C-01).
- [~] **D-12** *(reverted per D6 — these are the public API of their modules)* — Over-exported internals** (low priority, no deletion — just narrow to `const`):
      12 symbols in `filter-value.tsx`, `getLocalPath` / `getRouteSortIndex` / `printWindow` in
      `lib/utils.ts`, `StringOperator` / `BooleanOperator` / `MultiOptionOperator` in `operators.ts`,
      `cleanThunder` in `thunder.ts`, `CapacitorStateStore` / `CapacitorRedirectNavigator` in
      `AuthProvider.tsx`. All are used only within their own file. Narrowing them makes the real public
      API legible before it gets documented.

---


## 9. Form generator — JSON Schema coverage

Every row below was produced by running the real `JSONSchemaToFields.toFields()` against the schema
and walking the resulting field tree the way `RenderFieldGroup` / `RenderArray` / `RenderObject` do.
Nothing here is inferred from reading the code.

### 9.1 What works

| Construct | Result |
| --- | --- |
| Flat object, scalars | correct types, correct `required` |
| `object > object > object` | correct, dotted paths `a.b.c` |
| `array > object` | correct, `items.0.sku` |
| `array > object > array > object` | correct, `orders.0.lines.0.sku` |
| Array of scalars | tag input (`multi`) |
| Array of arrays of scalars | per-row tag input |
| `required` inside array items | propagates correctly |
| `enum` of numbers | dropdown |
| `format`: `date-time`, `email`, `uri`, `e164` | date / email / url / phone |
| Field grouping (`group`, `groupTitle`) | correct |
| `fieldHint` routing, `ref` / `refLabel` / `refValue` | correct |

Deep nesting is genuinely solid — that was the thing most likely to be broken, and it is not.

### 9.2 Gaps

- [x] **G-01** **Fixed.** `$ref` now resolves against `$defs`/`definitions` (JSON-Pointer, with escaping), `allOf` is folded into the host schema, and `oneOf`/`anyOf` collapse: `null` branches are dropped, a single branch is inlined losslessly, object branches are merged into one object, and a differing-`const` discriminator becomes an **enum** so the variant is selectable. Required is kept only where every branch agrees. Recursive `$ref` terminates via a ref stack held across the subtree walk. **Limitation:** a merged union is a superset form (every variant's fields shown, non-shared ones optional) rather than a true XOR variant picker — logged as G-01b. Original report: — Composition keywords are silently ignored: `oneOf`, `anyOf`, `allOf`, `$ref`.**
      All four fall through to the scalar branch and render as a **plain text input**, with no warning
      in the console or the UI. Measured:

      | Schema | Produces |
      | --- | --- |
      | `payment: { oneOf: […card…, …cash…] }` | `payment : text` |
      | `id: { anyOf: [string, number] }` | `id : text` |
      | `x: { allOf: […] }` | `x : text` |
      | `home: { $ref: "#/$defs/Addr" }` | `home : text` |

      This is the most serious gap. Thunder generates schemas from zod, so `z.union`,
      `z.discriminatedUnion`, and any reused or recursive (`z.lazy`) schema emit exactly these
      keywords. The user gets a free-text box, and the request fails server validation.
      **At minimum**: resolve `$ref` against `$defs`, collapse single-branch `allOf`, and render a
      discriminated `oneOf` as a variant selector. Until then the converter should `console.warn`
      rather than silently degrade.

- [x] **G-02** **Fixed.** `_toFields` now seeds `optional: true` and only sets `false` for properties named in the parent's `required`. Original report: — `required` is inverted when a schema omits its `required` array.**
      JSON Schema: a property is **optional** unless listed in the parent's `required`. The converter
      only sets `optional` when a `required` array exists
      ([jsonSchemaToFields.ts:115](../src/core/lib/jsonSchemaToFields.ts#L115)), so otherwise
      `optional` is `undefined`, and all 15 rule sites in `RenderInput` compute
      `required: !field.optional` → **`true`**. Measured:

      ```
      object with NO required array:
         a : optional=undefined -> UI marks required: true   <- should be false
         b : optional=undefined -> UI marks required: true   <- should be false

      optional nested object, no inner required array:
         bank  : optional=true      -> required: false
           iban  : optional=undefined -> required: true      <- blocks submit
           swift : optional=undefined -> required: true      <- blocks submit
      ```

      An optional nested object becomes **unsubmittable**: the user must fill fields the API does not
      want. Smallest correct fix is defaulting `optional` to `true` in `_toFields`.

- [x] **G-03** **Fixed.** `readType()` reads the union form and takes the first non-`null` member. Original report: — Nullable unions lose their type.** `type: ["string","null"]` and `["number","null"]`
      both resolve to `text`, because `resolveFieldType` only accepts a `string` `type`
      ([jsonSchemaToFields.ts:91-93](../src/core/lib/jsonSchemaToFields.ts#L91)). A nullable number
      renders as a text input and submits a string. zod `.nullable()` emits exactly this shape.

- [x] **G-04** **Fixed.** `_toFields` maps the schema's `default` onto `TField.defaultValue`, and `RenderInput` falls back to it when no query parameter is present (the query parameter still wins, so prefill links keep working). Original report: — Schema `default` values are never applied.** `_toFields` spreads the schema, so the
      value lands on the field as **`default`**, but `TField` declares **`defaultValue`** and
      `RenderInput` populates its `defaultValue` **only from query parameters**
      ([RenderInput.tsx:117-119](../src/core/crud/form/RenderInput.tsx#L117-L119)). Two different
      keys, so every schema default is dropped. Confirmed: `role: {type:"string", default:"member"}`
      reaches the field as `default="member"` and renders empty.

- [x] **G-05** **Fixed.** A `const` field now registers a hidden Controller with the constant as its value, so it is submitted and never shown as an editable box. Original report: — `const` renders as an editable, empty text input.** `RenderInput` only honours `const`
      when `type === "hidden"` ([RenderInput.tsx:80](../src/core/crud/form/RenderInput.tsx#L80)).
      A `{ const: "v1" }` property therefore shows a blank text box, and the constant is never
      submitted. `const` is how discriminated-union tags are expressed, so this compounds G-01.

- [x] **G-06** **Fixed.** `format: "date"` maps to the date control alongside `date-time`. Original report: — `format: "date"` renders as a text input.** Only `date-time` maps to the date control
      ([jsonSchemaToFields.ts:72-74](../src/core/lib/jsonSchemaToFields.ts#L72)). `z.iso.date()` is
      common. `time`, `uuid`, `ipv4`, `duration` also fall back to text — acceptable as a default,
      but `date` is a real miss.

- [x] **G-07** **Fixed.** A record renders a JSON textarea (`fieldHint: "json"`) that parses on change and blocks submit on invalid JSON, instead of a one-line text box. Original report: — Dictionaries (`additionalProperties`) render as a text input.** `{ type: "object",
      additionalProperties: { type: "string" } }` has no `properties`, so it misses the object branch
      and falls through to the scalar branch. zod `z.record()` produces this. Needs either a key/value
      editor or an explicit unsupported-field notice.

- [~] **G-08** *(works as-is; documented rather than changed)* — Tuples (`prefixItems`) flatten into sibling fields.** `point: {prefixItems:[number,
      number]}` yields two top-level fields `point.0` and `point.1` rather than an array container.
      It happens to submit correctly because react-hook-form treats a numeric path segment as an array
      index, but there is no array wrapper, so `minItems`/`maxItems` and add/remove do not apply.
      Works today; fragile and undocumented.

- [x] **G-09** **Fixed.** `FormPage` now requires the root field to be an object, so a root-level array degrades to the empty state. Original report: — A root-level array schema produces unnamed fields.** `{type:"array", items:{...}}` at
      the root yields item fields whose `name` is `undefined`, so `RenderFieldGroup` passes
      `name={undefined}` into `RenderInput`. Unusual for CRUD modules, but it should degrade to the
      empty state rather than render broken inputs.

- [x] **G-10** **Fixed.** `JSONSchemaToFields.warn()` reports every lossy or unsupported construct once (deduped), and can be silenced with `JSONSchemaToFields.silent = true`. Original report: — Unsupported constructs fail silently.** Every gap above degrades to a text input with
      no console warning and no UI hint. For a schema-driven framework this is the worst failure mode:
      the form looks fine and the API rejects it. A single `console.warn` in the fallback branch of
      `_toFields` would make all of these diagnosable in seconds.

### 9.3 Follow-up

- [ ] **G-01b — A true variant picker for `oneOf`/`anyOf`.** The merge above produces a working,
      submittable form but shows every variant's fields at once. A proper implementation would show
      only the selected variant's fields. The existing `requirementKey` mechanism is close but
      compares the watched value against the field's **own name**
      ([RenderInput.tsx](../src/core/crud/form/RenderInput.tsx)), which forces a nested
      `{ kind, card: {...} }` shape rather than the flat union shape, so it cannot be reused as-is.

### 9.4 Original suggested order

`G-02` (smallest, worst consequence) → `G-10` (makes the rest visible) → `G-04`, `G-05`, `G-06`,
`G-03` (small, independent) → `G-01` (largest; `$ref` + `allOf` first, `oneOf` variant picker after)
→ `G-07`, `G-09` → `G-08` (document only).

Note `F-07` (schema `minLength`/`maximum`/`minItems` never reach the react-hook-form rules) belongs
to this cluster and should be folded into whichever pass touches the rule construction.

---

## 10. Proposed order of work

Each phase is independently shippable. We confirm scope at the start of each one.

| Phase | Theme | Items |
| --- | --- | --- |
| **1** | **Contract & safety net** | S-06 (sync manifest), S-01, S-04, S-05, B-01 (restore eslint), C-13 (i18n check script), C-02 (`.env.example`), C-03, C-04, C-06 |
| **2** | **Crashes & data correctness** | B-02, B-03, B-06, B-07, B-11, B-12, B-27 |
| **3** | **Fix-once-fixes-many helpers** | R-02 + B-08, R-03 + B-09, B-05, B-10 |
| **4** | **i18n** | S-02 + B-32 (move core strings into `core/locals` — blocks the sync model), B-33, B-34, B-35, B-36, B-37, B-38 |
| **5** | **Dead code & over-export** | D-01 … D-12 (= R-04, R-05, R-06, R-07, R-08, R-10, R-11, R-15, R-16) |
| **6** | **Performance** | P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-11 |
| **7** | **List & form UX gaps** | B-04 + F-03, B-31 + F-04, F-05, B-16, F-07 |
| **8** | **Filters** | B-17, B-18 |
| **8.5** | **Form generator coverage** | G-02, G-10, G-04, G-05, G-06, G-03, G-01, G-07, G-09, F-07 — see §9.3 |
| **9** | **Platform & shell** | B-13 + F-08, B-14, B-15, B-20, B-21, B-22, B-23, B-24, B-25, B-26, B-28, B-29, B-30, C-07 + S-07, C-08, C-10, C-11, C-12 |
| **10** | **Boilerplate hygiene** | C-01 + D-11, F-13 (env-gate `users` / `notifications` per D1) |
| **11** | **Refactors for contributor onboarding** | R-01, R-09, R-12, R-13, R-14 |
| **12** | **New capability** | F-01, F-02, F-06, F-09, F-10 |
| **13** | **Documentation** | C-09 + the real docs this audit was written for |

Phase 1 is deliberately first: until the sync boundary is written down (S-06) and lint runs again
(B-01), every later change risks being silently reverted by the next `--forceSync` or regressing
unnoticed.

---

## 11. Open questions

1. **C-05 / P-02** — Was `minify: false` deliberate? It costs 4 MB raw / 0.5 MB gzip.
2. **B-38** — Should `fallbackLng` become `en`, and should browser-language detection run ahead of
   `localStorage`? Today a first-time visitor always gets Arabic.
3. **F-13** — What should the env flags for `users` and `notifications` be called, and should they
   default to on or off? (`VITE_DISABLE_WALLET` is opt-out; note B-24 — the current check treats
   `=0` as truthy, so whatever we add should use a shared boolean-env helper.)
