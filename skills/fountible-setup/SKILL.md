---
name: fountible-setup
description: "Turn on Fountible's AI connectors and get the MCP tools working — the desktop-app requirement, the Settings toggle, opening a file, and every failure mode."
when_to_use: "TRIGGER whenever a Fountible tool returns \"Fountible isn't running, or AI connectors are disabled\", \"No files are open in Fountible\", a rejected connector token, or a port-in-use error. ALSO trigger on 'set up Fountible', 'connect Claude to Fountible', 'why can't you see my design', 'install the Fountible plugin'. SKIP once list_open_files has returned files — the connection is working."
---

# Getting Fountible connected

## Always start here

Call `list_open_files`. Exactly three things can come back.

| Result | Meaning | Go to |
| --- | --- | --- |
| A list of files | Working. Stop reading this skill. | — |
| `Fountible isn't running, or AI connectors are disabled (Fountible → Settings → AI).` | The endpoint isn't reachable. | [Not running](#not-running) |
| `No files are open in Fountible.` | Connected, but there's nothing to act on. | [No files open](#no-files-open) |

## Not running

Three things must all be true. Check them in this order — each is a common stopping point.

1. **The Fountible *desktop app* is running.** Connectors are desktop-only. The
   browser app at app.fountible.com cannot serve them, because the endpoint is
   a local process. Download: <https://fountible.com/download>
2. **AI connectors are on.** Fountible → Settings → AI → **AI connectors**.
   It is **off by default**; the first time it's switched on, Fountible mints a
   persistent token for this machine. The card should then read
   *"Serving open files at http://127.0.0.1:7800/mcp"*.
3. **A design file is open.** Tools act on open files; see below.

Tell the user which step to do. Do not ask them for a token — see
[Never ask for the token](#never-ask-for-the-token).

## No files open

The connection is fine; there is just nothing to target. Ask the user to open
or create a design file in Fountible, then call `list_open_files` again.

Every file comes back with `file_key`, `name`, `active`, `read_only`, and
`loaded`. Tools default to the **focused** file; pass `file_key` to target
another. A file that is open in a background tab but not `loaded` cannot accept
calls until the user visits that tab.

## Never ask for the token

This plugin runs `fountible-mcp`, which reads the endpoint and token from
`~/.fountible/connector.json` on its own. There is nothing for the user to
paste. If they offer a token, decline and point them at the Settings toggle.

This is also why **regenerating the token in Settings is safe here** — it
invalidates hand-pasted configs in other tools, but this plugin keeps working.

## Diagnostics, in order

Run these only if the steps above didn't resolve it.

```sh
# 1. Has the app ever published an endpoint?
cat ~/.fountible/connector.json
```
A `url` and `token` should be there. Missing file → connectors have never been
enabled, or were switched off (Fountible deletes it on disable).

```sh
# 2. Is something actually listening, and is auth working?
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:7800/mcp
```
**`401` is the healthy answer** — it means the server is up and rejected an
unauthenticated request. Anything else (`000`, connection refused) means it
isn't listening.

```sh
# 3. The shim needs Node 18.17+
node --version
```

### Specific errors

- **"Ports 7800–7809 are all in use by other apps."** Another app took the
  range. Quit it, or set `FOUNTIBLE_CONNECTOR_PORT` and restart Fountible —
  this plugin follows automatically, because the shim reads the real URL from
  the discovery file.
- **"Fountible rejected the connector token."** Something is pointing at a
  stale hand-pasted config. This plugin doesn't use one; check for a `fountible`
  entry in `~/.claude.json`, `~/.cursor/mcp.json`, or `~/.codex/config.toml`
  left over from a manual setup.
- **A tool times out.** `screenshot_node` and page imports need the file to be
  on screen — a backgrounded browser tab throttles rendering. Ask the user to
  bring the Fountible window forward, or skip visual checks for that turn.

## Read-only files

A file the user only has view access to exposes just six tools:
`list_open_files`, `read_canvas_outline`, `read_node`, `read_selection`,
`list_variables_and_fonts`, `screenshot_node`, and `search_icons`. Every write
tool answers `Unknown tool "…" for this file. File "…" is read-only.`

That is not a retryable error. Tell the user they need edit access.

## Installing this plugin

```sh
/plugin marketplace add mofactor/fountible-mcp-guide
/plugin install fountible@fountible
```
