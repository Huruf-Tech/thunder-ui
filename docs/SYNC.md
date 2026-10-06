# The sync boundary

Thunder UI is a boilerplate that stays updatable. A generated app can pull later
Thunder UI changes — security patches, fixes, small improvements — with:

```bash
deno task generate:app --forceSync
```

That command **replaces `src/core/` wholesale** with the latest Thunder UI, and
leaves everything else alone. So the rule is short:

> **`src/core/` is read-only. Everything outside it is yours.**

Edit a file under `src/core/` and the next sync overwrites it. Edit anything
else and the next sync preserves it.

---

## 1. What you own

| Path | Yours to change | What it is for |
| --- | --- | --- |
| `src/overrides/**` | yes | The sanctioned extension points — see §2 |
| `src/pages/**` | yes | Your own pages |
| `src/components/**` | yes | Your components, and the shadcn/ui primitives |
| `src/hooks/**`, `src/lib/**` | yes | Your helpers |
| `src/locals/**` | yes | Your translations, merged **over** core's |
| `src/index.css` | yes | Theme tokens — see §4 |
| `src/App.tsx`, `src/main.tsx`, `src/i18n.ts` | yes | App wiring — see §5 |
| `.env*`, `package.json`, `capacitor.config.ts`, `index.html` | yes | Project config |
| `android/`, `ios/`, `www/` | yes | Native projects and build output |
| **`src/core/**`** | **no** | Replaced on every sync |

---

## 2. Extension points

Everything under `src/overrides/` is a registry core reads at startup. Register
there instead of editing core.

| File | Replaces |
| --- | --- |
| `crud/lists.tsx` | A whole list page, per module |
| `crud/cards.tsx` | A card view alongside the table, per module |
| `crud/forms.tsx` | A whole form, per module |
| `crud/views.tsx` | A detail page, per module |
| `icons.tsx` | The nav icon, per module or group |
| `routes.tsx` | Add routes, or replace a generated or built-in one |

`routes.tsx` also replaces the built-in routes by name — `overview`, `wallet`,
`notifications`. Your entry is merged **over** core's, so you can swap only the
`Component` and keep its icon, priority and permission checks:

```tsx
export const routes: TRoutesOverride = {
  overview: { Component: MyDashboard },
}
```

Built-in card views work the same way: core registers its own in
`src/core/crud/builtins.ts`, and `ListPage` merges them **under** your
`overrides/crud/cards.tsx`, so your registration always wins.

---

## 3. Translations

`src/i18n.ts` merges app over core:

```ts
translation: { ...enCoreTranslations, ...enTranslations }
```

Core's 227 strings live in `src/core/locals/`, so a sync can ship new and
corrected translations. Your `src/locals/` starts empty. To change a core
string, redefine that key in your file — don't edit core's.

Run `npm run i18n:check` to find keys that are referenced but missing, or
present but untranslated.

---

## 4. Styling — the boundary to copy

This split is the model the rest of the codebase should follow:

- `src/index.css` — **yours.** Theme tokens: colours, radii, fonts. 62 `oklch`
  declarations and no mechanics.
- `src/core/styles/index.css` — **core's.** Mechanics only: `@property`
  declarations, keyframes, scroll-mask utilities. Zero tokens.

You restyle the whole app by editing tokens, and core can still ship new
utilities. Nothing is lost on either side.

---

## 5. The known risk: core depends on files it cannot update

This is the one thing to keep in mind when shipping a patch.

`src/core/` imports **199 times from outside itself**, and only **6** of those
are the intended `src/overrides/` registries:

| Imported by core | Sites | Sync can update it? |
| --- | --- | --- |
| `@/components/ui/*`, `@/components/reui/*` | 160 | **no** |
| `@/lib/utils` (`cn`) | 21 | **no** |
| `@/components/theme-provider` | 5 | **no** |
| `@/components/refresher`, `@/components/pagination` | 4 | **no** |
| `@/hooks/use-pagination`, `@/hooks/use-mobile` | 3 | **no** |
| `@/overrides/*` | 6 | n/a — intended |

Consequences:

1. **A patch that needs to change one of those files cannot ship through
   `--forceSync`.** If a fix lives in `components/ui/button.tsx`, sync will not
   deliver it.
2. **A core patch that *depends* on a newer version of one of those files will
   break on sync**, because core moves forward and its dependency does not.

This is a deliberate trade-off: developers are meant to theme the shadcn
primitives, which is only possible because those files are theirs. The cost is
that core cannot rely on their contents changing.

**Therefore, when changing Thunder UI core:**

- Treat `@/components/ui/*`, `@/lib/utils`, `@/hooks/*` and the non-ui
  `@/components/*` files as a **frozen API**. Use what is already there.
- Never add a core import of `@/pages/*` or any other developer file. Core
  imported `@/pages/overview` until recently, which meant deleting your own
  overview page broke the core router.
- If a patch genuinely requires a change outside core, it is **not** a sync-only
  release. Say so in the release notes and give the exact file and change, so a
  developer can apply it by hand or re-run `npx shadcn add <component>`.

---

## 6. App wiring

`src/App.tsx`, `src/main.tsx` and `src/i18n.ts` are yours, so your edits
survive — but for the same reason **core improvements to them never reach an
existing app.** Keep them thin: they should only wire core together, with the
real logic inside `src/core/`. Add routes through `src/overrides/routes.tsx`
rather than `App.tsx`, so the wiring stays untouched and updatable.

---

## 7. Checklist before a sync-only release

- [ ] Every change is inside `src/core/`.
- [ ] No new core import of `@/pages/*`.
- [ ] No change required in `@/components/**`, `@/lib/**` or `@/hooks/**`.
- [ ] New strings added to `src/core/locals/{en,ar}` — `npm run i18n:check` passes.
- [ ] New env variables documented in `.env.example`, and absent values degrade safely.
- [ ] `npm run typecheck` and `npm run lint` pass.

If any of the first three fails, the release needs manual steps and the notes
must say which.
