---
name: fountible-canvas
description: "How a Fountible document is modelled and how to work on it safely: file discovery, HTML-tag node types, Tailwind-class styling, design-token variables, batching, and the read-verify loop."
when_to_use: "MANDATORY before the first Fountible canvas tool call in a session — read it before insert_html, edit_nodes, set_timeline, or any read_* tool. TRIGGER on any request to look at, build, change, animate, or export something in Fountible, or when the user mentions a Fountible file, frame, layer, or canvas."
---

# The Fountible document model

Read this before touching a canvas. Most mistakes come from assuming Fountible
works like other design tools; it does not.

## 1. Find the file

`list_open_files` → `{file_key, name, active, read_only, loaded}`.

Every canvas tool takes an optional `file_key`. Omit it to hit the **focused**
file. Only `loaded` files accept calls. Call `list_open_files` again whenever
the user says "the other file" — focus moves.

## 2. A node's type IS an HTML tag

`div`, `section`, `h1`, `p`, `img`, `svg`, `path`, `button`. There is no
proprietary Frame/Rectangle/Group vocabulary to translate into. What you would
write as markup is what the document actually is.

## 3. Styling IS Tailwind v4 utility classes

Classes live on the node's `className`, projected per breakpoint. There is no
separate style model to reconcile — `read_node` returns a subtree as **exported
Tailwind JSX**, and that string is the truth.

This is the single most useful fact about Fountible: the design and its
implementation are the same artifact. See `fountible-to-code`.

## 4. Variables are design tokens that mint utilities

`list_variables_and_fonts` returns each as `name (type) = value`. A color
variable named `brand` renders as `var(--color-brand)` and gives you
`bg-brand`, `text-brand`, `border-brand`.

**Always prefer an existing variable to a raw hex.** A design tool that
hardcodes `#3B82F6` when `--color-brand` exists has failed at its job. See
`fountible-tokens`.

## 5. One tool call = one undo step = one live change

Every external call lands as exactly one entry in the user's undo stack and
appears live on their canvas, attributed like a collaborator's edit.

The consequence is the most important behavioral rule in this plugin:
**batch**. Twenty separate `edit_nodes` calls is twenty undo steps and twenty
visible flickers on someone's screen. One call carrying twenty ops is one of
each. Never loop a tool where a batch would do.

## 6. The loop

```
read_canvas_outline   → ids, names, types, sizes, positions; [selected] marks selection
read_node <id>        → that subtree as Tailwind JSX
…mutate…
screenshot_node <id>  → confirm it looks right
select_nodes <id>     → hand focus back to the user
```

Read before you write. `edit_nodes` `set_classes` **replaces the entire class
list** — writing it from memory instead of from a fresh `read_node` is the
fastest way to destroy someone's design.

## 7. The user is a live co-editor

Edit ops can come back `skipped — edited by the user (at <id>)`. That is not a
transient failure to retry; it means a human touched that subtree while you
were working. Report it and ask.

Results are **per-op**. Read all of them — a batch can partly apply.

## 8. `screenshot_node` can legitimately decline

If the user has switched to another file tab, it returns a message saying the
file is not on screen. Rendering is throttled in a background tab; this is
structurally impossible, not slow. Skip visual checks for the rest of the turn
and keep working rather than retrying.

## 9. Read-only files

Six read tools only; every write answers `Unknown tool "…" for this file.`
Don't retry — the user needs edit access.

## Which tool

| Want to | Use |
| --- | --- |
| See what's on the canvas | `read_canvas_outline`, then `read_node` |
| Build something new | `insert_html` (→ `fountible-build-ui`) |
| A vector shape / icon / graphic | `insert_shape`, `insert_icon`, `insert_svg` |
| Change something that exists | `edit_nodes` (→ `fountible-edit-design`) |
| Colors and spacing as tokens | `list_variables_and_fonts`, `create_variable` |
| A token or component from a team library | `list_library_assets`, then `use_library_variable` / `insert_library_component` (→ `fountible-tokens`) |
| Motion | `set_animation`, `set_timeline`, `follow_path` (→ `fountible-motion`) |
| Pull in a real web page | `import_url` (→ `fountible-import`) |
| Turn a design into code | `read_selection` (→ `fountible-to-code`) |
