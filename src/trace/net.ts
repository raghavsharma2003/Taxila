// The flight recorder's network hooks (release 12): every same-origin /api call carries X-Taxila-Rid (the server echoes it
// on srv.* events, so one request reads as one line across client and server) and is recorded as net.req / net.res /
// net.err with method, path, rid, status, ms, bytes and the JSON bodies (masked, capped). /api/trace/* is never recorded
// (the recorder does not record itself). EventSource streams are recorded as net.sse (EventSource cannot set a header,
// so the rid rides as the `_rid` query parameter). Any fault inside a wrapper falls back to the ORIGINAL call untouched.
import { TRACE_RID_HEADER } from "../../shared/trace.ts";
import { busy, emit, nextRid, noteServerDate, setTier } from "./bus.ts";
import { maskBody, maskString } from "./mask.ts";

const BODY_CAP = 6000;

function apiPath(raw: string): URL | null {
  try {
    const u = new URL(raw, location.href);
    if (u.origin !== location.origin || !u.pathname.startsWith("/api/") || u.pathname.startsWith("/api/trace/")) return null;
    return u;
  } catch { return null; }
}

const pathOf = (u: URL) => u.pathname + (u.search ? maskString(u.search, 300) : "");

/** The request body as recorded: JSON text masked; FormData/Blob/stream only described. */
function reqBody(b: BodyInit | null | undefined): unknown {
  if (b == null) return undefined;
  if (typeof b === "string") return maskBody(b, BODY_CAP);
  if (typeof Blob !== "undefined" && b instanceof Blob) return { blob: b.type || "bytes", bytes: b.size };
  if (typeof FormData !== "undefined" && b instanceof FormData) return { form: [...b.keys()] };
  if (b instanceof ArrayBuffer) return { bytes: b.byteLength };
  return { body: typeof b };
}

/** Learn the trace tier from the me/boot reads the app already makes (no extra request). */
function readTier(path: string, j: unknown): void {
  if (!/^\/api\/(me|child\/boot)\b/.test(path) || !j || typeof j !== "object") return;
  const o = j as { trace?: { tier?: unknown }; me?: { trace?: { tier?: unknown } } };
  const tier = o.trace?.tier ?? o.me?.trace?.tier;
  if (tier !== undefined) setTier(tier);
}

export function wrapFetch(orig: typeof fetch): typeof fetch {
  const wrapped = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let u: URL | null = null, rid = "", t0 = 0, method = "GET", call: [RequestInfo | URL, RequestInit | undefined] = [input, init];
    try {
      u = apiPath(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      if (u) {
        rid = nextRid();
        method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        headers.set(TRACE_RID_HEADER, rid);
        call = [input, { ...init, headers }];
        const p = pathOf(u);
        busy(() => emit("net.req", { method, path: p, body: reqBody(init?.body) }, { rid }));
        t0 = performance.now();
      }
    } catch { u = null; call = [input, init]; }
    const res = orig(...call);
    if (!u) return res;
    const path = pathOf(u);
    return res.then((r) => {
      busy(() => {
        const ms = Math.round(performance.now() - t0);
        noteServerDate(r.headers.get("date"));
        const type = r.headers.get("content-type") ?? "";
        const bytes = Number(r.headers.get("content-length")) || undefined;
        if (/event-stream|audio|video|octet-stream|image/.test(type)) { emit("net.res", { method, path, status: r.status, ms, bytes, type }, { rid }); return; }
        // the body is read from a clone, after the app has it; reading never delays or changes the app's response
        void r.clone().text().then((text) => busy(() => {
          let parsed: unknown;
          try { parsed = JSON.parse(text); readTier(u!.pathname, parsed); } catch { /* not JSON */ }
          emit("net.res", { method, path, status: r.status, ms, bytes: bytes ?? text.length, type, body: text.length <= BODY_CAP * 4 ? maskBody(text, BODY_CAP) : { bytes: text.length } }, { rid });
        }), () => emit("net.res", { method, path, status: r.status, ms, bytes, type, body: "[unreadable]" }, { rid }));
      });
      return r;
    }, (err: unknown) => {
      busy(() => emit("net.err", { method, path, ms: Math.round(performance.now() - t0), error: maskString(String((err as Error)?.name === "AbortError" ? "aborted" : (err as Error)?.message ?? err), 300) }, { rid }));
      throw err;
    });
  };
  return wrapped as typeof fetch;
}

/** EventSource: the stream's open, errors and every named event (type, bytes, a masked head of the data). */
export function wrapEventSource(Orig: typeof EventSource): typeof EventSource {
  class Traced extends Orig {
    constructor(url: string | URL, cfg?: EventSourceInit) {
      let target = url, rid = "", path = "";
      try {
        const u = apiPath(typeof url === "string" ? url : url.href);
        if (u) { rid = nextRid(); u.searchParams.set("_rid", rid); target = u.href.replace(location.origin, ""); path = u.pathname; }
      } catch { target = url; }
      super(target, cfg);
      if (!path) return;
      try {
        emit("net.sse", { path, phase: "open-request" }, { rid });
        super.addEventListener("open", () => emit("net.sse", { path, phase: "open" }, { rid }));
        super.addEventListener("error", () => emit("net.sse", { path, phase: "error", state: this.readyState }, { rid }));
        const add = this.addEventListener.bind(this);
        const seen = new Set<string>();
        // record each event type the app listens to, once per type per message
        this.addEventListener = ((type: string, l: EventListenerOrEventListenerObject, o?: boolean | AddEventListenerOptions) => {
          try {
            if (!seen.has(type) && type !== "open" && type !== "error") {
              seen.add(type);
              add(type, (e: Event) => busy(() => { const d = String((e as MessageEvent).data ?? ""); emit("net.sse", { path, phase: "event", type, bytes: d.length, data: maskBody(d.slice(0, 1500)) }, { rid }); }));
            }
          } catch { /* never in the way */ }
          return add(type, l, o);
        }) as typeof this.addEventListener;
      } catch { /* the stream works untraced */ }
    }
  }
  return Traced as unknown as typeof EventSource;
}

/** WebSocket: open, close (code), error, and message counts/bytes (never the payload). */
export function wrapWebSocket(Orig: typeof WebSocket): typeof WebSocket {
  class Traced extends Orig {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      try {
        const path = maskString(new URL(String(url), location.href).pathname, 200);
        let n = 0, bytes = 0;
        super.addEventListener("open", () => emit("net.ws", { path, phase: "open" }));
        super.addEventListener("message", (e) => { n++; bytes += typeof e.data === "string" ? e.data.length : (e.data?.byteLength ?? e.data?.size ?? 0); });
        super.addEventListener("error", () => emit("net.ws", { path, phase: "error" }));
        super.addEventListener("close", (e) => emit("net.ws", { path, phase: "close", code: e.code, messages: n, bytes }));
      } catch { /* untraced */ }
    }
  }
  return Traced as unknown as typeof WebSocket;
}
