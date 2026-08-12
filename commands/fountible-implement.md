---
description: Implement the current Fountible selection (or a named frame) as real components in this codebase.
argument-hint: [optional target path or component name]
---

The user wants the design they have selected in Fountible built in this
repository.

Target: $ARGUMENTS

1. Call `read_selection`. If nothing is selected, call `read_canvas_outline`
   and ask which frame they mean.
2. Call `list_variables_and_fonts` and reconcile the document's tokens with
   this project's own — its `@theme` block, `tailwind.config`, or CSS custom
   properties. Write the mapping down before generating anything.
3. Invoke the **`fountible-to-code`** skill, and delegate the implementation to
   the **`fountible-implementer`** sub-agent, passing it the frame id and the
   reconciled token map.
4. Report what was created, and anything you could not map faithfully —
   especially dropped animations or fonts the project doesn't have.
