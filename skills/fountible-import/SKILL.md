---
name: fountible-import
description: "Bring outside material onto the Fountible canvas: import a live web page 1:1 as editable nodes, place SVG, find stock photography, and cut backgrounds out of images."
when_to_use: "TRIGGER whenever the user references a real website as a source — 'recreate the header from example.com', 'pull in this landing page', 'match that site's nav' — or asks for a photo, a logo SVG, or a background removed."
---

# Importing

## `import_url` — a live page as editable layers

Fetches the page through Fountible's own server-side proxy and imports it as
native, editable nodes — the same pipeline as pasting a URL into the app. Not a
screenshot.

Public `http(s)` only; private and internal hosts are blocked. Large pages take
several seconds. A URL that resolves to an image inserts as an image layer.

**The workflow is import → read → keep → delete the rest:**

1. `import_url`
2. `read_canvas_outline` to see what actually came in
3. `read_node` on the part the user wanted
4. `edit_nodes` delete everything else

Never treat the raw import as the deliverable. The user asked for the header,
not the whole homepage sitting on their canvas.

## The other sources

- **`insert_svg`** — a complete SVG string you already have, as editable
  vectors.
- **`search_stock_images`** → put the returned URL straight into an `<img src>`
  in your next `insert_html` (it gets re-hosted automatically). Use
  **`insert_stock_image`** with a `nodeId` when you're filling an existing
  empty image layer instead.
- **`remove_background`** — cuts the subject out of an image. Destructive: it
  rewrites that image's pixels.

Also remember that inline `<svg>` inside `insert_html` becomes editable vectors
— often you don't need an import at all. See `fountible-build-ui`.

## What leaves the machine

Worth being straight with the user about, because these are the only canvas
tools that reach the network:

- `import_url` fetches through **Fountible's proxy** — Fountible's backend sees
  the URL being imported.
- `search_stock_images` / `insert_stock_image` query a third-party stock
  provider.
- `remove_background` runs a matting model.

Everything else in this plugin talks only to `127.0.0.1`. Full detail:
<https://fountible.com/privacy#ai-connectors>
