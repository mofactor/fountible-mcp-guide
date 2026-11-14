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
  prefer `bg-brand` over `bg-[#0ea5e9]`. If it reports enabled team libraries,
  their tokens are not in that list yet — search with `list_library_assets` and
  link what you need with `use_library_variable` (→ `fountible-tokens`).
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

Round a path's corners on its **points**, not with hand-placed bezier handles.
For a shape built from straight edges with rounded corners (most icons, badges,
arrows), draw the plain corner points and add `data-corner-radius` to the
`<path>`, `<polygon>` or `<polyline>`: one number rounds every corner, a list
gives one value per point in drawing order (`0` = sharp), in the svg's own
units. Each corner stays one point whose Corner radius the user can change.
Keep bezier curves for shapes that really curve.

```html
<svg viewBox="0 0 24 24" class="w-[72px] h-[72px] fill-none stroke-black stroke-2">
  <path d="M 4 3 L 10 3 L 12 16 L 21 15 L 21 21 L 6 21 Z" data-corner-radius="3 3 2 3 3 4" />
</svg>
```

Real CSS 3D (`transform-[perspective(...)_rotateX(...)]` with `transform-3d` on
a wrapper), gradients, shadows, blur, and blend modes all survive as editable
properties. Reach for those for depth rather than skewing artwork by hand. A
block with real thickness (an isometric slab, plate or card) takes
`data-thickness="10"`: its wall shades under the face and the face lifts 10 px
onto its parent. `data-thickness-wall="#hex"` picks the wall's color (otherwise
the face's own). Never build the walls by hand.

## Choosing among the insert tools

| Need | Tool | Why |
| --- | --- | --- |
| A whole section or screen | `insert_html` | Layout, text, and structure in one call |
| A known icon | `insert_icon` | Parametric — swappable in the inspector, stroke scales with resize |
| Not sure of the icon's name | `search_icons` first | ~1,700 icons; guessing wastes a call |
| A complete graphic you already have | `insert_svg` | Takes an SVG string |
| A primitive (rect, ellipse, polygon, star) | `insert_shape` | Stays parametric and re-editable |
| Lines between layers: a flowchart, user flow, site map, org chart | Build the boxes, then `connect_layers` | Each line stays stuck to both layers when either moves |
| Procedural texture | `insert_shader` | Mesh gradients, grain, halftone, liquid metal, ASCII |
| A part that repeats (cards, pricing tiers, list rows) | Build them, then `create_component` | One main and linked copies, each keeping its own text and images (→ `fountible-edit-design`) |
| Versions of one part (a logo on light and dark, mark only; a button's sizes) | Build the base once, `create_component`, then `add_variants` | ONE component with a value per version, never a component each (→ `fountible-edit-design`) |
| A component this file already has | `list_components`, then `insert_component` | A linked instance instead of a hand-built lookalike; `variant` places it at one of its values |
| A photo | `search_stock_images` | Put the returned URL straight into an `<img src>` in your next `insert_html` — cheaper than a separate insert |

A shader layer is an ordinary frame afterwards: resize it, stack things on it,
animate it.

Inside `insert_html`, `data-icon="lucide:<name>"` on a sized element resolves
to a parametric icon layer — cheaper than hand-writing the paths.

## Diagrams: lines that stay stuck, `connect_layers`

A line that joins two layers is a connector, FigJam's kind: build the boxes
first (`insert_html`, with a `data-layer-name` on each), then join them by the
ids the insert returned.

```json
{"connections": [
  {"from": "<Sign up id>", "to": "<Welcome id>"},
  {"from": "<Welcome id>", "to": "<Pay id>", "text": "Upgrade", "kind": "curved"}
]}
```

- The line runs between the two layers' nearest sides with an arrowhead at
  `to`, and follows them whenever either one moves or resizes. Never draw
  those lines as SVG: they come apart the first time a box moves.
- Per connection: `text` (words on the line; it leaves a gap for them), `kind`
  (`bent` with rounded corners by default, `straight`, `curved`), `fromSide` /
  `toSide` (`top`, `right`, `bottom`, `left`, default auto), `arrows` (`end`,
  `start`, `both`, `none`), `color` (hex), `weight` (px), `dashed`.
- To change a line, pass its `id` (the outline marks lines as `connector`,
  with what they join); `text: ""` takes its words off. A pair already joined
  in the same direction is changed, not drawn twice.
- A line goes in the nearest frame that holds both layers, else their section,
  else the page. A diagram drawn inside one frame moves and exports with it.
- The reply names any layer a line runs across. Move a box, or set a side, to
  clear it. Delete a line with `edit_nodes` `delete`; deleting a layer deletes
  the lines stuck to it.
- Arrows that join nothing (a callout, a decorative swoosh) stay inline SVG
  with `marker-end`.

## Finish the job

`screenshot_node` to confirm it looks right, then `select_nodes` so the user's
selection lands on what you just made. Fix what the screenshot shows before
reporting done — an unchecked insert is half the work.
