# Design System — DH Araria Hospital Portal

**Status:** enforceable; reviewers check changes against this file. **Sources of truth:** `apps/frontend/tailwind.config.ts` (tokens), `apps/frontend/src/styles/globals.css` (HSL bridges, base layer), `packages/ui/src` (primitives). **Change control:** a token change updates this file and its measured ratios in the same commit; pages may not invent tokens. **Scope:** public, auth and admin. Dark mode is out of scope — no `dark:` tokens.

## 1. Colour

All five ramps are complete (50–950). `600` is the anchor, so existing `bg-primary-600` and
`bg-danger-600` call-sites recolour without a rename.

| Family | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `primary` | `#EAF4FB` | `#CFE7F7` | `#A6D3EF` | `#6FB9E4` | `#349CD6` | `#0D7FBE` | `#006194` | `#004E77` | `#003D5E` | `#002D46` | `#001D2E` |
| `secondary` | `#F3F5FA` | `#E6EAF3` | `#CBD3E3` | `#A7B2CA` | `#7C8AA8` | `#5F6C87` | `#565E74` | `#454C5E` | `#363C4A` | `#282D38` | `#1A1E26` |
| `success` | `#F0FDF4` | `#DCFCE7` | `#BBF7D0` | `#86EFAC` | `#4ADE80` | `#22C55E` | `#16A34A` | `#15803D` | `#166534` | `#14532D` | `#052E16` |
| `warning` | `#FFFBEB` | `#FEF3C7` | `#FDE68A` | `#FCD34D` | `#FBBF24` | `#F59E0B` | `#D97706` | `#B45309` | `#92400E` | `#78350F` | `#451A03` |
| `danger` | `#FEF2F2` | `#FEE2E2` | `#FECACA` | `#FCA5A5` | `#F87171` | `#EF4444` | `#DC2626` | `#B91C1C` | `#991B1B` | `#7F1D1D` | `#450A0A` |

Semantic tokens — prefer these over raw ramp steps:

| Tokens | Hex | Role |
|---|---|---|
| `surface` / `surface-low` / `surface-container` / `surface-high` / `surface-highest` | `#F7F9FF` / `#F1F4FA` / `#EBEEF4` / `#E5E8EE` / `#DFE3E8` | page canvas / inputs, chips / inset panels / table headers / pressed |
| `card` | `#FFFFFF` | cards, header, focused inputs |
| `on-surface` / `on-surface-variant` | `#181C20` / `#3F4850` | headings, body / secondary copy, placeholders |
| `outline` / `outline-variant` | `#707881` / `#BFC7D2` | icons, strong borders / dividers, input borders |
| `primary` / `primary-container` | `#006194` / `#007BB9` | primary fill, links / lighter hover fill |
| `emergency` / `emergency-dark` | `#DC2626` / `#B91C1C` | 102/108 strip, CTA / pressed |
| `tertiary` / `tertiary-fixed` / `tertiary-on-fixed` | `#894D00` / `#FFDCC0` / `#2D1600` | "Low" text / badge fill / text on badge |
| `success` / `success-700` | `#16A34A` / `#15803D` | fills and dots only / all success text |
| `warning` / `warning-800` | `#F59E0B` / `#92400E` | fills only / warning text |
| `danger` / `danger-800` | `#DC2626` / `#991B1B` | destructive fill / error text on `danger-50` |

White text only on `primary-600` or darker, `secondary-600` or darker, `emergency`, `danger-600`,
`success-700`, `on-surface`. `primary-400/500` are decoration and focus rings, never text
backgrounds. Status is never conveyed by colour alone — pair it with a label or icon.

## 2. Typography

`font-heading` = Atkinson Hyperlegible Next (`--font-heading`); `font-sans` = Plus Jakarta Sans
(`--font-body`). Size tokens carry line-height and weight, so pair the family explicitly:
`font-heading text-h2`, never `text-h2` alone.

| Token | Classes | Size / line / weight | Use |
|---|---|---|---|
| `h1` | `font-heading text-h1` | 36 / 44 / 700 | one per page |
| `h2` | `font-heading text-h2` | 28 / 36 / 700 | section title |
| `h3` | `font-heading text-h3` | 22 / 28 / 600 | card, panel, dialog title |
| `body-lg` | `text-body-lg` | 18 / 28 / 400 | hero and lead paragraphs |
| `body` | `text-body` | 16 / 24 / 400 | default body, input text |
| `body-sm` | `text-body-sm` | 14 / 20 / 400 | helper text, legal copy |
| `label` | `text-label` | 14 / 20 / 600 | buttons, tabs, nav, form labels |
| `label-sm` | `text-label-sm` | 12 / 16 / 600 | badges, eyebrows, footer meta |

Body copy is never below 14 px; mobile inputs are ≥16 px (prevents iOS zoom). Below `md`, a page
hero may use `text-[clamp(1.75rem,6vw,2.25rem)]` — the only approved arbitrary type value. Use
`text-balance` on headings and `break-words` on long names. `font-inter` is removed.

## 3. Radius, spacing, elevation

| Radius | Value | Use |
|---|---|---|
| `rounded` | 0.25rem | tags, nav items, compact buttons |
| `rounded-lg` | 0.5rem | inputs, buttons, step tiles |
| `rounded-xl` | 0.75rem | cards, banners, dialogs — **maximum** |
| `rounded-2xl` | 0.75rem | **deprecated alias** — replace with `rounded-xl` |
| `rounded-full` | 9999px | pills, avatars, icon buttons |

Spacing is the numeric Tailwind scale only: 4/6 (`1`/`1.5`), 8 (`2`), 12 (`3`), 16 (`4`), 20 (`5`
card padding), 24 (`6` gutter), 32 (`8` grid gap), 48 (`12` section rhythm). No custom spacing keys
and no arbitrary `p-[…]`, `w-[…]`, `text-[…]`. Exceptions are layout engineering values:
`max-h-[90dvh]`, sticky `top-[calc(var(--header-h)+1.25rem)]`, prose `max-w-[72ch]`, container
`2xl:max-w-[90rem]`, and the two header shadows below.

| Elevation | Class | Use |
|---|---|---|
| resting card | `shadow-sm` | cards, tiles |
| hover | `shadow-md` | interactive cards, selected day |
| dialog | `shadow-xl` | dialogs, sheets, hero media only |
| sticky header | `shadow-[0_1px_8px_rgba(0,0,0,0.04)]` | header, utility bar |
| sticky bottom bar | `shadow-[0_-1px_8px_rgba(0,0,0,0.04)]` | bottom nav, action bar |

Layout: `.container` = `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[90rem]`. Use
`className="container"` or the `Container` primitive — never `container mx-auto px-4`, which
overrides the responsive gutters. `body` is `flex min-h-dvh flex-col`; `main` is `flex-1`.

## 4. Contrast pairs (measured)

Method: WCAG 2.x relative luminance on sRGB, rounded to two decimals; an unmeasured pair may not ship.

| Foreground / background | Ratio | Verdict |
|---|---|---|
| white / `primary` `#006194` | 6.69:1 | passes AA and AAA for normal text |
| white / `primary-container` `#007BB9` | 4.63:1 | passes AA — hover only |
| `on-surface` / `surface` | 16.27:1 | passes |
| `on-surface-variant` / `surface` | 8.85:1 | passes |
| `on-surface-variant` / `card` | 9.32:1 | passes — use for placeholders |
| `tertiary` / `tertiary-fixed` | 5.20:1 | passes — "Low" badge |
| `tertiary-on-fixed` / `tertiary-fixed` | 13.25:1 | passes |
| `success-700` `#15803D` / white | 5.02:1 | passes — the only success text colour |
| `success` `#16A34A` / white | 3.30:1 | **fails** — fills, dots, ≥24 px icons only |
| `outline` `#707881` / white | 4.48:1 | 3:1 icons/borders; **not** body or placeholder text |
| white / `emergency` `#DC2626` | 4.83:1 | passes — 102/108 strip |
| white / `secondary-600` | 6.46:1 | passes |
| white / `primary-500` `#0D7FBE` | 4.38:1 | **fails** — never a text background |
| `primary-600` / `primary-50` | 6.00:1 | passes — ghost/outline button |
| `warning-800` / `warning-50` | 6.84:1 | passes — warning banner |
| `danger-800` / `danger-50` | 7.60:1 | passes — error banner |

If a pair fails, change the token, not the font size. 18.66 px bold / 24 px regular may use the 3:1 threshold, but never for body or labels.

## 5. Component usage rules

- **Button** — primary `bg-primary-600 text-white`; secondary `bg-secondary-600 text-white`; outline/ghost `text-primary-600` on `surface`; destructive `bg-danger-600 text-white`; emergency `bg-emergency text-white`. Keep `bg-primary-600`, `bg-danger-600` and `px-3 py-1.5 text-sm` exactly as they are: `Button.test.tsx` asserts those strings. Every variant has `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` and a 44×44 px minimum hit area (`min-h-11`).
- **Links** — `text-primary-600 underline-offset-2 hover:underline`; an `<a>` never looks like a button. Use `Button` with link semantics instead.
- **Fields** — `bg-surface-low border border-outline-variant rounded-lg text-base`; focus `focus-visible:ring-2 focus-visible:ring-ring`. Label above (`text-label`), hint (`text-body-sm text-on-surface-variant`), error (`text-body-sm text-danger-700` + icon). Required fields say "required", not just `*`.
- **Cards** — `bg-card rounded-xl shadow-sm border border-outline-variant/60 p-5`; hover lift only when the whole card is a link; no nested cards.
- **Status and alerts** — token pairs from §4; text + icon, never colour alone. Errors use `role="alert"`, success uses `role="status"`.
- **Dialog / Sheet** — `rounded-xl shadow-xl`, `aria-modal`, labelled title, focus trap, Escape, focus restore, `max-h-[90dvh]` with internal scroll.
- **Tabs, DataList, Pagination** — active state uses fill + `aria-selected`/`aria-current`; table header `bg-surface-high text-label-sm uppercase`; rows `border-outline-variant`; below `lg` tables become stacked cards; no inline column widths.
- **Empty and error states** — one icon, a plain-language title, one action. Never a bare "No data".
- **Media and icons** — `MediaFrame` with fixed `aspect-[16/9]`/`aspect-square`, `next/image` and `sizes`; alt text describes the setting, not the headline. `lucide-react` 16–24 px, `aria-hidden="true"` when decorative, labelled otherwise.

Compose `packages/ui` primitives; if one is missing, add it there with a test — never inline a one-off variant in a page.

## 6. UI states

| State | Requirement |
|---|---|
| Loading | `Skeleton` matching the final layout (no spinner-only pages, no CLS); container `aria-busy="true"`; submit buttons use `loading` and stay disabled. |
| Empty | `EmptyState` stating what is missing, why, and a reset/primary action. Never "0 results" without a way out. |
| Error | `ErrorState` with human copy, retry and a fallback link. `catch → setX([])` is a defect: an outage must not look like an empty list. Announce with `role="alert"`. |
| Success | Inline confirmation or toast with text + icon; focus moves to the confirmation; the changed value is visible on screen. |
| Permission | State what is required and link to it (sign in, request access, call the desk). Never hide the feature silently or render a blank admin page. |

Every data route implements loading, empty and error; forms implement success and validation error; admin routes implement permission.

## 7. Do / Don't

**Do** use semantic tokens (`bg-surface`, `text-on-surface`, `border-outline-variant`); use `font-heading` for `h1`–`h3` and `font-sans` for everything else; use the numeric spacing scale; measure any new pair; keep one `h1` per page; set `aria-current="page"` on active nav.

**Don't** use raw `bg-blue-*`, `text-blue-*`, `text-gray-*`, `bg-gray-*`, `border-gray-*`, `bg-white` or hex literals in JSX; don't put white on `primary-500`; don't use `success-600` for text; don't use `rounded-2xl` or arbitrary px values; don't invent a second button/card/alert recipe; don't ship colour-only status, `href="#"`, or an unhandled form.

## 8. Deprecations and the ratchet

| Deprecated | Replacement | Enforcement |
|---|---|---|
| `rounded-2xl` (aliased to 0.75rem) | `rounded-xl` | banned in new code; replace on touch |
| `rounded-md`, `rounded-sm` | `rounded`, `rounded-lg`, `rounded-xl` | not tokens |
| `bg-blue-*`, `text-blue-*`, `border-blue-*` | `primary-*` | banned in new code |
| `text-gray-*`, `bg-gray-*`, `border-gray-*` | `on-surface*`, `surface*`, `outline*` | banned in new code; count may only fall |
| `bg-white` | `bg-card` | prefer `bg-card` |
| `text-success-600` | `text-success-700` | contrast |
| `bg-primary-500` + white text | `bg-primary-600` or darker | contrast |
| `font-inter` / Inter | `font-heading` / `font-sans` | removed |
| `.dark`, `dark:` | none | dark mode is out of scope |

The token ratchet (`scripts/check-ui-tokens.mjs`) counts each banned pattern per file; a PR fails
if a count rises. New files start at zero. Escape hatches need a
`// ui-token-allow: <reason>` comment and reviewer sign-off.

## 9. Review gate

- [ ] Only tokens from §1–§3; no hex, raw palette utilities or arbitrary values; every text pair appears in §4 (or was measured in this commit).
- [ ] One `h1`; order `h1 → h2 → h3`; body ≥14 px; inputs ≥16 px on mobile; focus ring and ≥44 px hit area everywhere.
- [ ] §6 states implemented; status never colour-only; radius ≤ `0.75rem`; `container`, not `container mx-auto px-4`.
- [ ] No `href="#"` or dead route; class-pinning tests (`Button`, `AdminComplaintsPanel`) still pass.
