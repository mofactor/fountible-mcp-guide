---
name: fountible-edit-design
description: "Change existing Fountible layers — restyle, retext, recolour, reparent, duplicate, delete — batched into single undo steps with edit_nodes."
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

**Images**
- `remove_image_fill` removes real image entries while preserving other fills.
  Never fake this by writing `backgroundImage`: `read_node` *renders* structured
  fills as derived `backgroundImage` CSS for readability, but that is output,
  not input.
- `set_prop` **cannot write an image source.** `src`/`srcFull` are refused. Use
  the image tools; an image fill needs a real `asset:`, `data:`, or `https:`
  source.

**Structure**
- `rename`, `set_visible`, `duplicate`
- `reparent` `{parentId, index?}`
- `delete`

`reparent` and `delete` are the destructive ones — they are what makes
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
