// The hash-CSP bundler for the child's frame (LIVE-STUDIO §5.1; BUILD-PLAN W2-H #1, from G2 bundle.js). The document a
// build mounts in is assembled HERE, in the host, from exactly the fragment bytes the gate passed (re-hashed against the
// build's sha256 first) plus the studio-kit@1 runtime with this child's params and strings. The page's only scripts are
// those two, pinned by sha256 in a meta CSP that also forbids every network channel:
//   default-src 'none'; script-src 'sha256-…' 'sha256-…'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none';
//   font-src / media-src / frame-src / worker-src / child-src / object-src / manifest-src 'none'; form-action 'none'; base-uri 'none'
// The same policy the gate renders under (server/studio/qa/page.js cspFor), so a build that passed there behaves the same.
// Pure apart from WebCrypto (crypto.subtle: browsers and node ≥ 20).
import { frameRuntimeSource, type RuntimeInput } from "./runtime.ts";

/** The build's script blocks, exactly as server/studio/fixers.js splitFragment reads them (the CSP hash must match). */
const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
export const scriptsOf = (fragment: string): string[] => [...String(fragment).matchAll(SCRIPT_RE)].map((m) => m[1]);

function bytes(s: string): Uint8Array<ArrayBuffer> { return new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>; }
function b64(buf: ArrayBuffer): string {
  const a = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s);
}
function hex(buf: ArrayBuffer): string { return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
const digest = (s: string) => crypto.subtle.digest("SHA-256", bytes(s));

/** sha256 hex of a string (the build id: server/studio/telemetry.js sha256 of the fragment, utf8). */
export async function sha256Hex(s: string): Promise<string> { return hex(await digest(s)); }
/** The CSP source for one inline script. */
export async function scriptHash(s: string): Promise<string> { return `'sha256-${b64(await digest(s))}'`; }

export function cspFor(hashes: string[]): string {
  return ["default-src 'none'", `script-src ${hashes.join(" ")}`, "style-src 'unsafe-inline'", "img-src data: blob:", "font-src 'none'", "connect-src 'none'",
    "media-src 'none'", "frame-src 'none'", "worker-src 'none'", "child-src 'none'", "form-action 'none'", "base-uri 'none'", "object-src 'none'", "manifest-src 'none'"].join("; ");
}

export interface FrameDoc { html: string; csp: string; scripts: number }

/**
 * The frame document for a gate-passed build, or null when the bytes do not match the build id (never mounted then).
 * The body is the design size exactly (the stage scales the frame to fit the box; nothing inside can scroll it).
 */
export async function frameDocument(o: RuntimeInput & { fragment: string; sha256: string; stage: { w: number; h: number } }): Promise<FrameDoc | null> {
  if ((await sha256Hex(o.fragment)) !== o.sha256) return null;
  const runtime = frameRuntimeSource(o);
  const build = scriptsOf(o.fragment);
  if (build.length > 1) return null;                       // the contract is ONE script (the gate refuses more)
  const hashes = await Promise.all([runtime, ...build].map(scriptHash));
  const csp = cspFor(hashes);
  const { w, h } = o.stage;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">` +
    `<meta name="viewport" content="width=${w},initial-scale=1"><style>html,body{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden}</style>` +
    `<script>${runtime}</script></head><body>${o.fragment}</body></html>`;
  return { html, csp, scripts: hashes.length };
}

/** The document for a streamed PARTIAL paint under the veil: sanitised markup, no script at all, no network. */
export function partialDocument(safeHtml: string, stage: { w: number; h: number }): string {
  const csp = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none'; connect-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'";
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">` +
    `<style>html,body{margin:0;padding:0;width:${stage.w}px;height:${stage.h}px;overflow:hidden;pointer-events:none}</style></head><body>${safeHtml}</body></html>`;
}
