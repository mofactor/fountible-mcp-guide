# Security

## Reporting a vulnerability

Email **security@fountible.com**. Please don't open a public issue for a
security report.

We aim to acknowledge within 3 working days and to disclose coordinated fixes
within 90 days.

## What this plugin is

`fountible-mcp` is a zero-dependency stdio shim. It forwards JSON-RPC messages
to a loopback HTTP endpoint that the Fountible desktop app runs, and writes the
response back. It has no network access beyond `127.0.0.1`, and reads exactly
one file: `~/.fountible/connector.json`, mode 0600, written by the app.

## The endpoint's trust model

The Fountible app's connector endpoint:

- binds `127.0.0.1` only,
- requires `Authorization: Bearer <token>`, where the token is generated on the
  user's machine on first enable and never leaves it,
- validates the `Host` header (DNS-rebinding guard) and rejects a
  present-but-invalid `Origin` with 403, per the MCP specification's
  requirements for local servers,
- serves exactly one path, `/mcp`,
- is **off by default** and runs only while the desktop app runs.

The token is stored in plaintext at mode 0600 rather than in a keychain,
deliberately: the shim is a separate process that must read it, so encrypting
it at rest would buy nothing. The defense is loopback binding plus the Host and
Origin guards plus the bearer token — the same trust model as the credentials
other local CLI tools keep in the home directory.
