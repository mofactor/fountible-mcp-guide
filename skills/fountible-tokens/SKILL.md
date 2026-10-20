---
name: fountible-tokens
description: "Fountible design tokens: list existing variables and fonts, create colour / number / radius / opacity / font tokens, change, rename or delete them, and use the Tailwind utilities they mint."
when_to_use: "TRIGGER on 'set up a theme', 'use our brand colours', 'make this a token', 'what colours does this file use', 'apply the design system', or any restyle where a raw hex would otherwise be hardcoded."
---

# Design tokens

## Call `list_variables_and_fonts` first. Always.

Before any styling work. Hardcoding `#3B82F6` into a document that already
defines `--color-brand` is the most visible way an agent can look like it
doesn't understand the design system.

## Variables mint Tailwind utilities

A variable's slug becomes a utility suffix:

| Type | Renders as | Utilities you get |
| --- | --- | --- |
| `color` | `var(--color-<slug>)` | `bg-<slug>`, `text-<slug>`, `border-<slug>` |
| `number` | a length | `p-<slug>`, `w-<slug>`, `gap-<slug>`; as type: `text-<slug>` (size), `leading-<slug>`, `tracking-<slug>` |
| `radius` | a radius | `rounded-<slug>` |
| `opacity` | 0–1 | `opacity-<slug>` |
| `font` | a font-family list | `font-<slug>` |

So a `brand` colour variable is used as `bg-brand`, not `bg-[var(--color-brand)]`
and certainly not `bg-[#0ea5e9]`.

**The slug is not always the name.** A name that is a number or a built-in
Tailwind key gets a `-2` suffix, because the plain form would rebind the
built-in: a number variable named `8` is `gap-8-2` (`gap-8` stays 32px), and a
colour named `primary` is `bg-primary-2`. The tool reply and
`list_variables_and_fonts` give the real slug — write that one.

## Creating one

`create_variable` `{name, type, value}`:

- `color` → `#rrggbb` or `#rrggbbaa`
- `number` → integer px
- `radius` → integer px
- `opacity` → decimal 0–1
- `font` → a CSS font-family list, e.g. `"Inter", ui-sans-serif, sans-serif`
  (a generic fallback is added when the list has none)

Create the variable *before* the restyle that uses it, so the very first write
already references the token.

Good reasons to create one: the user names a brand colour; the same literal
appears in three or more places; the user says "our blue" / "the card radius".
Not a good reason: a one-off value used once.

## Changing, renaming, deleting

`edit_variable` `{variable, value?, name?, delete?}` — `variable` is the slug
(or id, or exact name). It works on the whole file at once, like the
Variables panel, and is one undo step:

- `value` changes the token; every layer using it updates.
- `name` renames it. The slug follows the new name and every class, text run,
  variant and instance override that spelled the old slug is rewritten, so
  nothing changes on screen. Write the new slug from the reply afterwards.
- `delete: true` removes it. Each use becomes the literal value it had
  (`p-gutter` → `p-6`), so nothing changes on screen either.

A token linked from a team library follows the library: it can be deleted
here, but its value and name change in the library file.

## Big files

`list_variables_and_fonts` lists 120 variables per call. Narrow it with
`query` (matches name or slug) and `type`, or page with `offset` — the
`… +N more` line gives the next one.

## Team libraries

A file can have published team libraries enabled. Their tokens are **not** in
`list_variables_and_fonts` until they are linked into the file, so a document
that looks like it has no brand color often has a hundred of them one call away.

1. `list_library_assets` `{query?, kind?, library?, type?, limit?}` searches the
   enabled libraries — published tokens and components.
2. `use_library_variable` `{variableIds}` (or `{names}`) links them into this
   file and returns, per token, the **local slug**.

**The slug it returns is the only one that works.** A library token is not
usable by its published name, and the local slug can differ from the published
one when a local variable already holds it (`brand-purple` → `brand-purple-2`).
Write back exactly what the tool returned; a guessed slug compiles to nothing
and renders unstyled, silently.

Both take a batch — link everything a section needs in one call.

Never `create_variable` a copy of something a library already publishes. That
mints a second token with a near-identical slug, and the document then has two
sources of truth for one color.

`insert_library_component` places an instance of a published component. Prefer
it over hand-writing markup that imitates one: the instance stays linked, so it
picks up the library's updates. Components made in this file are separate:
`list_components` lists them and `insert_component` places one, at one of its
variant values with `variant`. Versions of one part (a logo on light and on
dark, mark only) are ONE such component with variants, made with
`add_variants` (→ `fountible-edit-design`).

## Fonts

`list_variables_and_fonts` also reports the document's uploaded fonts. They
can be read and used in class strings but **cannot be uploaded over MCP** — the
user adds font files in the Fountible UI. If a design needs a font that isn't
there, say so rather than silently substituting.

A `font` **variable** is different: it names a family list, so retyping every
layer that uses `font-<slug>` is one `edit_variable` value change instead of a
find-and-replace across the file.

## Why this pays off later

Variables survive the handoff to code: they render as `var(--color-<slug>)` in
exported CSS, which maps one-to-one onto a project's own `@theme` block. A
document styled with tokens produces code that fits the codebase; one styled
with raw hexes produces code someone has to clean up. See `fountible-to-code`.
