/**
 * Endpoint resolution + wire helpers for the `fountible-mcp` stdio shim.
 *
 * Split out of cli.ts so it can be unit-tested: importing cli.ts runs its
 * top-level readline wiring and would hang a test process.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
export const NOT_RUNNING_HINT = "Fountible isn't running, or AI connectors are disabled (Fountible → Settings → AI).";
/**
 * Treat blank as absent. MCPB substitutes an unset `${user_config.KEY}` as an
 * EMPTY STRING, so a plain `!== undefined` check would see both overrides as
 * "provided", skip the discovery file, and fetch("") — every install would
 * report NOT_RUNNING_HINT forever against a Fountible that is running.
 */
export function nonEmpty(value) {
    return value !== undefined && value.trim().length > 0 ? value : undefined;
}
/** `--url <value>`; ignores a following flag so `--url --token x` reads as unset. */
export function flagValue(argv, name) {
    const index = argv.indexOf(name);
    const value = index >= 0 ? argv[index + 1] : undefined;
    return value !== undefined && !value.startsWith("--") ? value : undefined;
}
export function defaultDiscoveryFile() {
    return join(homedir(), ".fountible", "connector.json");
}
/**
 * First match wins: explicit overrides → the app's discovery file. A partial
 * override (url only, say) still consults the file for the other half.
 */
export function resolveEndpoint(overrides, discoveryFile, readFile = (path) => readFileSync(path, "utf8")) {
    const url = nonEmpty(overrides.url);
    const token = nonEmpty(overrides.token);
    if (url !== undefined && token !== undefined)
        return { url, token };
    try {
        const parsed = JSON.parse(readFile(discoveryFile));
        if (typeof parsed.url === "string" && typeof parsed.token === "string") {
            return { url: url ?? parsed.url, token: token ?? parsed.token };
        }
        return { error: `${discoveryFile} is malformed. ${NOT_RUNNING_HINT}` };
    }
    catch {
        return { error: NOT_RUNNING_HINT };
    }
}
/** Every id in a request or batch, so an error can be answered per-id. */
export function idsOf(message) {
    const single = (value) => {
        if (value === null || typeof value !== "object")
            return null;
        const id = value.id;
        return typeof id === "string" || typeof id === "number" ? id : null;
    };
    if (Array.isArray(message)) {
        return message.map(single).filter((id) => id !== null);
    }
    const id = single(message);
    return id === null ? [] : [id];
}
/** The endpoint answers JSON in stateless mode; tolerate an SSE body anyway. */
export function extractSseJson(body) {
    const events = body
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .filter((line) => line.length > 0);
    return events.length > 0 ? (events.at(-1) ?? null) : null;
}
