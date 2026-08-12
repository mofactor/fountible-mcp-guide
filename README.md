# Fountible for Claude Code, Cursor, and other MCP clients

Design and edit on the [Fountible](https://fountible.com) canvas from your
editor. Read the design files you have open as Tailwind JSX, build screens from
HTML, edit layers, author motion, and implement a design in your codebase.

Every change lands **live** on the canvas, attributed like a collaborator's
edit, and undoes as a single step.

> **Requires the Fountible desktop app**, running, with
> **Settings → AI → AI connectors** switched on. The MCP server talks to
> Fountible over `127.0.0.1` — it cannot reach the browser app, and it does
> nothing at all when Fountible isn't running.
> Download: <https://fountible.com/download>

**Where this works:** Claude Code and Claude Desktop, plus Cursor and other
MCP clients that run on your own machine. It does **not** work on claude.ai,
Claude mobile, or Cowork — those run in the cloud and cannot reach a server
listening on your laptop's `127.0.0.1`.

## Install

**Claude Code**

```sh
/plugin marketplace add mofactor/fountible-mcp-guide
/plugin install fountible@fountible
```

**Cursor** — `/add-plugin fountible` in agent chat, or point it at this repo.

**Anything else** — the MCP server is the npm package
[`fountible-mcp`](https://www.npmjs.com/package/fountible-mcp):

```json
{ "mcpServers": { "fountible": { "command": "npx", "args": ["-y", "fountible-mcp"] } } }
```

There is no token to configure. The shim reads the endpoint from
`~/.fountible/connector.json`, which the app maintains while connectors are
enabled — so regenerating the token in Settings never breaks this plugin.

## What it can do

**Read** — `list_open_files`, `read_canvas_outline`, `read_node`,
`read_selection`, `list_variables_and_fonts`, `screenshot_node`, `search_icons`

**Create** — `insert_html`, `insert_svg`, `insert_shape`, `insert_icon`,
`insert_shader`, `import_url`, `search_stock_images`, `insert_stock_image`

**Edit** — `edit_nodes`, `create_variable`, `select_nodes`, `remove_background`

**Motion** — `set_animation`, `set_timeline`, `follow_path`, `text_on_path`

A file you only have view access to exposes the read tools and nothing else.

## Skills

| Skill | For |
| --- | --- |
| `fountible-setup` | Getting connected, and every failure mode |
| `fountible-canvas` | The document model — read this before any canvas work |
| `fountible-build-ui` | Building new screens and sections |
| `fountible-edit-design` | Changing what's already there |
| `fountible-tokens` | Design tokens and the utilities they mint |
| `fountible-motion` | Presets, keyframe timelines, motion paths |
| `fountible-import` | Web pages, SVG, stock photos, background removal |
| `fountible-to-code` | Implementing a design in your codebase |

Plus `/fountible-status`, `/fountible-implement`, and a `fountible-implementer`
sub-agent for larger design-to-code work.

## Why the design-to-code path is different here

A Fountible document *is* HTML plus Tailwind v4 classes — a node's type is an
HTML tag, its styling is a class list, and its variables are CSS custom
properties. So `read_node` returns the implementation rather than an
approximation of it, and there is no lossy translation step.

## Privacy Policy

<https://fountible.com/privacy#ai-connectors>

In short: the MCP server binds to `127.0.0.1` only, requires a bearer token
generated on your machine, and is off until you enable it. **The MCP client you
connect is the third party** — when you use this with Claude, your design
content goes to Anthropic under your agreement with them; Fountible neither
routes nor stores it.

Three tools do reach the network through Fountible or a provider, and are
called out in the `fountible-import` skill: `import_url` (fetched via
Fountible's proxy), the stock-image tools, and `remove_background`.

The bundled MCP server (`fountible-mcp`) reads exactly one file outside this
plugin's directory: `~/.fountible/connector.json`, the endpoint descriptor the
Fountible app writes.

## Support

- Issues: <https://github.com/mofactor/fountible-mcp-guide/issues>
- Docs: <https://fountible.com/docs/mcp>
- Email: support@fountible.com

MIT licensed.
