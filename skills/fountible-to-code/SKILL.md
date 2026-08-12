---
name: fountible-to-code
description: "Implement a Fountible design in this codebase. Read frames as Tailwind JSX, map document variables onto the project's own tokens, and write real components."
when_to_use: "TRIGGER on 'implement this design', 'build this screen', 'code up what I just designed', 'turn the selection into a component', 'match the Fountible file', or when the user has a Fountible file open and is working in a code repository."
---

# Fountible → code

This is the workflow Fountible is structurally best at, and the reason to
install this plugin in a coding agent.

**Why it's different from other design tools:** a Fountible document *is* HTML
plus Tailwind v4 classes. `read_node` doesn't approximate the design as code —
it returns the implementation. There is no lossy translation step, no
"design intent" to infer from absolute-positioned rectangles.

## The workflow

### 1. Get the design

```
read_selection                  # what the user has selected right now
read_canvas_outline → read_node # or navigate to a named frame
```

Output is exported Tailwind JSX plus validated animation specs and structured
fill/shader props. It is capped on very large subtrees — read children
individually rather than fighting the cap.

### 2. Reconcile tokens ONCE, up front

```
list_variables_and_fonts
```

Map each `var(--color-<slug>)` onto the project's own token: its `@theme`
block, `tailwind.config`, or plain CSS custom properties. Do this once at the
top, write the mapping down, then translate mechanically.

Getting this wrong is what makes generated code look "nearly right" but drift
from the design system on the second screen. If the project has no token layer
and the document does, say so — proposing one is usually the right call.

### 3. Check anything ambiguous visually

`screenshot_node` when a long class string or a stacked fill leaves you unsure
what it actually looks like. Cheaper than guessing and rewriting.

### 4. Delegate anything larger than one component

Use the **`fountible-implementer`** sub-agent. A real frame's JSX runs to
thousands of characters and screenshots are images; that belongs in its own
context window, not in the middle of the conversation the user is having.

## Translation notes

- **Per-breakpoint classes are already correct.** `md:` and `lg:` variants come
  through as authored. Don't re-derive responsive behavior from pixel sizes.
- **Repeated sibling subtrees are a component.** Three cards with identical
  class strings and different text is a `<Card>` with props — extract it rather
  than emitting the markup three times.
- **Layer names are intent.** They are what the designer called the thing; they
  usually make better component and prop names than anything inferred from the
  content.
- **Animations export as anime.js.** Port them deliberately or drop them
  deliberately — say which. Silently losing motion is the most common
  complaint about design-to-code output.
- **Inline SVG is real vector data**, not a placeholder. Keep it as SVG.
- **Fills can be structured.** A gradient or multi-fill stack renders in the
  JSX as its CSS equivalent; that CSS is the truth for the implementation.

## Going the other way

If the user wants code turned INTO a design, that's `insert_html` — see
`fountible-build-ui`. The same equivalence works in both directions.
