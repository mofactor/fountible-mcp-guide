---
name: fountible-edit-design
description: "Change existing Fountible layers — restyle, retext, recolor, reparent, duplicate, delete — batched into single undo steps with edit_nodes."
when_to_use: "TRIGGER on 'change the heading', 'make this dark', 'move that into the card', 'fix the spacing', 'delete the third column', 'bold that word', 'swap the gradient' — any modification to something already on a Fountible canvas."
---

# Editing layers

Everything goes through `edit_nodes`, which takes a batch of `ops`.

## The rule that prevents the worst mistake

**`set_classes` replaces the WHOLE class list.** Not a merge, not a patch.

So: `read_node` first, take the current list, apply your change to it, and send
the complete intended result. Writing a class list from memory silently strips
every utility you didn't think to include — spacing, responsive variants,
hover states — and it looks like the design "broke for no reason".

## Batch, always

One call with twenty ops is one undo step and one live update on the user's
screen. Twenty calls is twenty of each. There is a per-call op cap; split only
when you actually hit it.

## The ops

**Text**
- `set_text` — replaces characters, preserving inline formatting where the diff
  anchors.
- `format_text_range` `{start, end, prop, token}` — styles a *character range*
  using UTF-16 offsets. Props: `fontWeight`, `fontStyle`, `textDecoration`,
  `textColor`, `fontSize`, `fontFamily`, `letterSpacing`, `textTransform`,
  `background`. An empty token clears the prop. This is how you bold one word.

**Style**
- `set_classes` — see above.
- `set_style` `{prop, token, bp?}` — one property, optionally per-breakpoint.
- `set_prop` — structured props, including the paint arrays: `fills` (on a text
  node this **is** the glyph paint) and `strokes` (gradient borders and vector
  strokes; solid/linear/radial, paired with width tokens).
- `set_shader_params` — merges validated shader knobs.
- `set_video` — merges a video layer's playback settings: `startAt` (ms into
  its film before it plays), `loop`, `muted`, `volume`, `autoplay`,
  `controls`. Never the clip itself.

**Images**
- `remove_image_fill` removes real image entries while preserving other fills.
  Never fake this by writing `backgroundImage`: `read_node` *renders* structured
  fills as derived `backgroundImage` CSS for readability, but that is output,
  not input.
- `set_prop` **cannot write an image source.** `src`/`srcFull` are refused. Use
  the image tools; an image fill needs a real `asset:`, `data:`, or `https:`
  source.

**Structure**
- `rename`, `set_visible`
- `reparent` `{parentId, index?}` — `index` reorders a child inside its parent.
- `move` `{id, x, y}` — the only way to reposition a top-level layer (one whose
  outline line shows `@ (x, y)`), in those same coordinates; a layer marked
  `in section` is relative to that section. `left-`/`top-` classes and
  `set_prop` do **not** move a top-level layer, and are refused or flagged.
- `duplicate` `{id, x?, y?}` — a top-level copy lands at `x`/`y`, or in free
  space to the right of its source. The reply prints where each copy landed.
- `group` `{ids, name?}` — ⌘G: puts layers that share a parent in a Group, in
  place. A Group has no fill or layout of its own and always hugs what it holds,
  so it beats a wrapper frame when layers only need to stay together (two
  vectors that form one mark, an icon and its badge, shapes that move as one).
  It takes `ids`, not `id`, and the reply gives the new Group's id. Send it in a
  call that does not also edit those layers.
- `ungroup` `{id}` — ⌘⇧G: releases a group's or frame's layers in place and
  removes the container (a frame's own fill and border go with it).
- `delete`

To arrange frames in a row or grid, work out each `x`/`y` from the sizes in the
outline and send one `move` (or `duplicate` with `x`/`y`) per frame in a single
call. Never report a position you did not read in a reply or in the outline.

`reparent`, `ungroup` and `delete` are the destructive ones — they are what makes
`edit_nodes` report `destructiveHint: true`. Be sure before you send them, and
say what you removed.

## Things that will bite you

- **Per-op results.** A batch can partly apply. Read every result; don't assume
  success from the absence of an error.
- **`skipped — edited by the user`** means a human touched that subtree
  mid-flight. Not retryable. Report it.
- **The pointer-events policy applies to edits too.** A class batch that turns
  an absolute layer into a full-cover overlay must also declare
  `pointer-events-none` or `pointer-events-auto`.
- **Introducing a colour you'll reuse?** `create_variable` first, then use the
  utility it mints. See `fountible-tokens`.

## Making it work: `make_interactive`

Tabs, accordions / FAQs, dropdown menus, toggles / switches and hoverable
cards can actually work in Preview and while presenting. Build them as ONE
container frame — the triggers as plain layers, one panel per trigger, only the
active panel visible, the active trigger styled differently — then call
`make_interactive` with that frame's `nodeId` (and `pattern` if you know it).
For everything but hover, the frame becomes a component and a linked instance
with a **new id** takes its place: use the returned id afterwards. A refusal
says what to restructure.

## Reusable parts: `create_component`

`create_component` turns one container (`nodeId`: a frame, stack or grid; a
group is converted first, as ⌘⌥K does) into this file's own component, in
place. Pass `copies` with the ids of near-identical layers elsewhere and each
becomes a linked instance that keeps its own text, images, classes and
visibility as overrides. A copy whose structure differs is skipped, untouched,
with the reason. A lone text or image layer is refused, and a bare text link
or button imports as one text layer: build each repeated nav item or button
as a flex box with its label in an inner element
(`<a class="inline-flex items-center"><span>Home</span></a>`), then link
them. `name` names the component.

- **New ids.** The main keeps `nodeId` and moves to the component's own canvas;
  a linked instance with a **new id** takes its place, and each converted copy
  gets a new id too. The reply lists them as `old → new`: use those afterwards.
- **Main vs instance.** Editing the main, or layers inside it, changes every
  instance. Editing an instance's layers changes only that copy. A design
  duplicated with `duplicate` still shares the same mains, so to change one
  design only, edit its instances. `delete` inside an instance is skipped: hide
  the layer with `set_visible` instead. `delete` of a main is skipped too:
  delete its instances.
- **Structure first.** Layers can't be added inside an instance, only to the
  main. Finish adding and removing items before you componentize. Never
  componentize the tabs, accordion items, dropdown items, triggers or panels of
  a frame you will make interactive: `make_interactive` needs them as plain
  layers, an instance can't be detached, and it makes the frame a component
  itself. Repeats inside one panel may become components, before
  `make_interactive`. A part of a main that already has instances can't
  become a component (those instances would lose their own changes).
- **Reuse.** `list_components` lists this file's components (id, name, main,
  size, instance count, variants). `insert_component` places a linked instance
  by id or name, inside `parentId` (at `index`) or at `x`/`y`, and `variant`
  places it at one of the component's values (below). A team library's
  components go through `insert_library_component` instead (→ `fountible-tokens`).
- `read_canvas_outline` marks an instance root `of "<name>"` and a main
  `[main of "<name>"]`.

## Versions of one part: `add_variants`

Versions of ONE part (a logo on light and on dark, mark only, wordmark; a
button's sizes or states) are ONE component with variants, never a separate
component per version. Alternative designs to choose between (three hero
options) stay separate frames.

Build the base once with every layer any version needs, `create_component` it,
then call `add_variants` `{component, values}` with all the value names in
order, e.g. `["On light", "On dark", "Mark only", "Wordmark"]`. For a new
property the first value is the default: what the main shows now. `property`
names the property (default: its only variant property, else a new `Variant`;
a name it doesn't have yet adds that property, such as `Size`), and `rename`
takes `[{from, to}]` pairs for values it already has. Names it already has are
kept, so calling it again with them just lists the previews. One undo step.

- **Style a value through its preview.** Every value but the default gets a
  preview beside the main on the component's canvas, and the reply lists each
  preview's id and its layers' ids. `edit_nodes` on a preview or its layers
  (`set_classes`, `set_style`, `set_prop` fills and strokes, `set_text`)
  changes that value for every instance showing it. The preview's own classes
  set the value's size, background and radius.
- **Shared layers.** All values share the main's layers. `delete` or
  `set_visible` false on a layer inside a preview hides it in that value only
  (in an instance, `delete` is skipped). A layer only some values show goes in
  the main, hidden in the other previews. Editing the main changes every value.
- **Place and switch.** `insert_component` with `variant` places an instance at
  a value: `"Mark only"`, or `"Variant=On dark, Size=Large"` when the component
  has several properties (a boolean takes On or Off). `set_variant`
  `{ids, variant}` switches instances already placed. Each keeps its own
  overrides, and one placed on the canvas takes that value's size unless it
  was resized by hand. Previews, mains, plain layers and instances nested in
  another instance are skipped, with the reason.
- **Find them later.** `list_components` prints each property's values, its
  default, and the preview id for every other value. `read_canvas_outline`
  marks the value an instance shows (`[Variant=On dark]`) and a preview
  (`[preview of Variant=On dark]`). A preview is not one more copy: editing it
  restyles that value everywhere.
