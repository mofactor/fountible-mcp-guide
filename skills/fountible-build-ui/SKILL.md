---
name: fountible-build-ui
description: "Create new screens, sections, and components on the Fountible canvas from a brief — Tailwind HTML, inline SVG, icons, shapes, shaders, and stock photography."
when_to_use: "TRIGGER on 'design a…', 'build a landing page / dashboard / pricing section', 'add a hero to my Fountible file', 'mock up…' when the target is Fountible or a design canvas. ALSO when the user describes UI in prose and expects to see it. SKIP for changes to something that already exists — use fountible-edit-design."
---

# Building on the canvas

`insert_html` is the main tool. You write plain semantic HTML with Tailwind
classes; Fountible converts it into native, fully editable layers.

## The `insert_html` contract

- **Use the document's own theme.** Call `list_variables_and_fonts` first and
  prefer `bg-brand` over `bg-[#0ea5e9]`.
- **Desktop-first, around 1280px.** `md:` and `lg:` variants are fine and are
  preserved as authored.
- **No `<script>`, no `<style>`.** Styling is classes.
- **Every absolute/fixed full-cover layer must declare `pointer-events-none`
  (decorative) or `pointer-events-auto` (interactive).** The tool *rejects* the
  insert otherwise. Backgrounds, glows, and gradient overlays belong on their
  owning container with `pointer-events-none`.
- **Placement:** omit `x`/`y` to auto-place in free space. Pass them only for
  deliberate composition, after reading top-level positions from
  `read_canvas_outline`.
- **Name your layers.** They become the user's layer panel, and later the
  component names in code.

## Inline `<svg>` becomes editable vectors

This is the capability most easily missed. An `<svg>` inside `insert_html`
converts to real editable vector layers — paths, gradients, strokes — not a
flattened image.

So: draw charts, decorative art, logos, and custom icons as inline SVG instead
of faking them with stacked divs. The user can then edit the points.

Real CSS 3D (`transform-[perspective(...)_rotateX(...)]` with `transform-3d` on
a wrapper), gradients, shadows, blur, and blend modes all survive as editable
properties. Reach for those for depth rather than skewing artwork by hand.

## Choosing among the insert tools

| Need | Tool | Why |
| --- | --- | --- |
| A whole section or screen | `insert_html` | Layout, text, and structure in one call |
| A known icon | `insert_icon` | Parametric — swappable in the inspector, stroke scales with resize |
| Not sure of the icon's name | `search_icons` first | ~1,700 icons; guessing wastes a call |
| A complete graphic you already have | `insert_svg` | Takes an SVG string |
| A primitive (rect, ellipse, polygon, star) | `insert_shape` | Stays parametric and re-editable |
| Procedural texture | `insert_shader` | Mesh gradients, grain, voronoi, halftone, liquid metal, ASCII |
| A photo | `search_stock_images` | Put the returned URL straight into an `<img src>` in your next `insert_html` — cheaper than a separate insert |

A shader layer is an ordinary frame afterwards: resize it, stack things on it,
animate it.

Inside `insert_html`, `data-icon="lucide:<name>"` on a sized element resolves
to a parametric icon layer — cheaper than hand-writing the paths.

## Finish the job

`screenshot_node` to confirm it looks right, then `select_nodes` so the user's
selection lands on what you just made. Fix what the screenshot shows before
reporting done — an unchecked insert is half the work.
