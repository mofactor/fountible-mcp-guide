---
name: fountible-tokens
description: "Fountible design tokens: list existing variables and fonts, create colour / number / radius / opacity tokens, and use the Tailwind utilities they mint."
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
| `number` | a length | `p-<slug>`, `w-<slug>`, `gap-<slug>` |
| `radius` | a radius | `rounded-<slug>` |
| `opacity` | 0–1 | `opacity-<slug>` |

So a `brand` colour variable is used as `bg-brand`, not `bg-[var(--color-brand)]`
and certainly not `bg-[#0ea5e9]`.

## Creating one

`create_variable` `{name, type, value}`:

- `color` → `#rrggbb` or `#rrggbbaa`
- `number` → integer px
- `radius` → integer px
- `opacity` → decimal 0–1

Create the variable *before* the restyle that uses it, so the very first write
already references the token.

Good reasons to create one: the user names a brand colour; the same literal
appears in three or more places; the user says "our blue" / "the card radius".
Not a good reason: a one-off value used once.

## Fonts

`list_variables_and_fonts` also reports the document's fonts. They can be read
and used in class strings but **cannot be created over MCP** — the user adds
fonts in the Fountible UI. If a design needs a font that isn't there, say so
rather than silently substituting.

## Why this pays off later

Variables survive the handoff to code: they render as `var(--color-<slug>)` in
exported CSS, which maps one-to-one onto a project's own `@theme` block. A
document styled with tokens produces code that fits the codebase; one styled
with raw hexes produces code someone has to clean up. See `fountible-to-code`.
