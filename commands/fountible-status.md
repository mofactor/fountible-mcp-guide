---
description: Check the Fountible connection — which files are open, which is focused or read-only, and how to fix it if nothing is connected.
---

Call `list_open_files`.

- **If it returns files**, report them as a short table: name, `file_key`,
  focused, read-only, loaded. Say which one tools will target by default. Stop
  there.
- **If it errors, or reports no files open**, invoke the **`fountible-setup`**
  skill and walk the user through it. Do not ask them for a token — this plugin
  reads it from `~/.fountible/connector.json` itself.
