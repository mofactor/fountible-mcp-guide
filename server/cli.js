#!/usr/bin/env node
/**
 * fountible-mcp — stdio ⇄ HTTP shim for Fountible's AI connectors.
 *
 * MCP clients that only speak stdio (Claude Desktop's `command` servers, the
 * .mcpb desktop extension, …) launch this binary; it forwards each
 * newline-delimited JSON-RPC message to the Fountible app's local
 * Streamable-HTTP MCP endpoint and writes the JSON response back to stdout.
 * Stateless pass-through: the endpoint answers every request independently,
 * and no server→client requests exist.
 *
 * Endpoint resolution, first match wins (see endpoint.ts):
 *   1. --url <url> --token <token> flags
 *   2. FOUNTIBLE_MCP_URL / FOUNTIBLE_MCP_TOKEN env
 *   3. ~/.fountible/connector.json — written by the Fountible app while AI
 *      connectors are enabled (Settings → AI). Re-read per request, so a shim
 *      launched before the app starts working the moment Fountible is up, and
 *      regenerating the token in Settings never breaks this client.
 *
 * Zero runtime dependencies (Node ≥ 18: global fetch).
 */
import { createInterface } from "node:readline";
import { defaultDiscoveryFile, extractSseJson, flagValue, idsOf, NOT_RUNNING_HINT, resolveEndpoint, } from "./endpoint.js";
const overrides = {
    url: flagValue(process.argv, "--url") ?? process.env.FOUNTIBLE_MCP_URL,
    token: flagValue(process.argv, "--token") ?? process.env.FOUNTIBLE_MCP_TOKEN,
};
const discoveryFile = defaultDiscoveryFile();
function writeOut(text) {
    process.stdout.write(`${text}\n`);
}
function writeError(ids, message) {
    for (const id of ids) {
        writeOut(JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: { code: -32000, message },
        }));
    }
}
let warnedOnce = false;
function warn(message) {
    if (warnedOnce)
        return;
    warnedOnce = true;
    process.stderr.write(`[fountible-mcp] ${message}\n`);
}
async function forward(line) {
    let parsed;
    try {
        parsed = JSON.parse(line);
    }
    catch {
        return; // Not JSON-RPC; nothing useful to answer.
    }
    const ids = idsOf(parsed);
    const endpoint = resolveEndpoint(overrides, discoveryFile);
    if ("error" in endpoint) {
        warn(endpoint.error);
        writeError(ids, endpoint.error);
        return;
    }
    let response;
    try {
        response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                accept: "application/json, text/event-stream",
                authorization: `Bearer ${endpoint.token}`,
            },
            body: line,
        });
    }
    catch {
        warn(NOT_RUNNING_HINT);
        writeError(ids, NOT_RUNNING_HINT);
        return;
    }
    if (response.status === 202 || response.status === 204)
        return; // notification ack
    const body = await response.text();
    if (!response.ok) {
        const message = response.status === 401
            ? "Fountible rejected the connector token — copy a fresh setup snippet from Settings → AI."
            : `Fountible's connector endpoint answered ${response.status}. ${NOT_RUNNING_HINT}`;
        warn(message);
        writeError(ids, message);
        return;
    }
    if (body.trim().length === 0)
        return;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
        const json = extractSseJson(body);
        if (json !== null)
            writeOut(json);
        return;
    }
    writeOut(body.trim());
}
// Serialize forwarding so responses keep request order — MCP clients correlate
// by id, but ordered output keeps logs sane and avoids interleaved writes.
let chain = Promise.resolve();
const rl = createInterface({ input: process.stdin, terminal: false });
rl.on("line", (line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0)
        return;
    chain = chain.then(() => forward(trimmed));
});
rl.on("close", () => {
    void chain.finally(() => process.exit(0));
});
