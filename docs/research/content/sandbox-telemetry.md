# Sandbox, bridge v2 and telemetry for live and generated learning modules

**Date:** 2026-10-02 · **Scope:** every module the app renders: T0 hand-built engines, T1 LLM-filled specs, T2 Forge
games and `scene@1` scenes, T3 live drafts. Covers the iframe sandbox, CSP, the postMessage protocol (bridge v2), how
events are debounced into teacher observations, the headless validation harness, and content safety.

**Builds on, does not repeat:**
- `tech-and-market.md` §3.4 (sandbox and bridge v1) and §1.7 (quiet observations)
- `maths-engines.md` §3.1–3.3 (ModuleSpec, MathValue, probe events)
- `science-engines.md` §2.2–2.4 (seq, cause, salience, facts)
- `game-mechanics.md` §3 (VerifiedAct) and `factory/llm-game-generation.md` §7 (game telemetry)
- `factory/coding-agent-harnesses.md` S4–S6 (Forge verify and publish)
- `learner/dialogue-affect.md` §3 (TurnEvent timing features) and `design/kids-ux-ages.md` (target sizes)
- `genui-scene-dsl.mjs` (`scene@1`: pure solver and expression evaluator)
- The shipped code: `shared/contracts.ts`, `src/modules/{host.tsx,frame/*}`, `src/lesson/moduleEvents.ts`,
  `server/serve.mjs`, `server/director/classify.js`

**Evidence tags:**
- **[M]** measured here by `sandbox-probe.mjs`, raw data in `sandbox-probe-2026-10-02.json`. Chromium 141.0.7390.37 headless, Playwright 1.63.
- **[V]** checked this session against a primary source or the repository code.
- **[S]** secondary source or general knowledge, not re-verified this session.
- **[U]** a design choice or assumption that still has to be measured.

---

## 0. TL;DR (decisions)

1. **The CSP that ships today leaks.** Under the `modules.html` meta policy, a module reached a foreign origin through
   **8 channels**: `<img>`, stylesheet, `@font-face`, `<audio>`, `<script>`, `import()`, `<link rel=prefetch>` and a nested iframe.
   The strict policy in §3.1 closes all 8, whether it is sent as a header or as a meta tag **[M, 3 runs]**.
2. **Production does not boot the module frame.** `server/serve.mjs` sends no `Access-Control-Allow-Origin`.
   - A frame with `sandbox="allow-scripts"` has origin `null`, so its `type=module` scripts and its `crossorigin` CSS are fetched with CORS.
   - Chromium blocked all 4 assets ("from origin 'null' has been blocked by CORS policy"), and the frame never said `ready`.
   - Adding `Access-Control-Allow-Origin: *` fixes it **[M]**.
   - Vite dev allows origin `null` (`vite.config.ts` line 15), and `tests/client-e2e.mjs` runs against Vite. That is why no test caught this **[V]**.
   - The live ACA URL returned 503 today, so the live headers could not be checked **[U]**.
3. **Two exfiltration channels survive any CSP.**
   - **Self-navigation.** CSP3 has no `navigate-to` **[V]**. The leak server saw the request, and the iframe fired `load` a second time, which makes it detectable **[M]**.
   - **WebRTC STUN.** UDP left the frame under every policy, including `webrtc 'block'`, which Chromium 141 does not enforce **[M]**.
   - Mitigations:
     - kill the frame on its 2nd `load` event;
     - the bootstrap deletes the `RTC*` constructors before engine code runs. The obvious recovery route (an `about:blank` child) then threw `SecurityError`, and 0 packets left **[M]**;
     - AST bans for T2/T3;
     - an Android native request allowlist;
     - keep the frame data-poor (no personal data enters it).
4. **Android WebView has no Site Isolation** **[V, chromium.org]**, so a module shares the host's main thread.
   - A 1,500 ms busy loop in the frame froze a host timer for **1,501–1,503 ms** with isolation off, versus **14–50 ms** with desktop isolation on **[M, n=9 each]**.
   - A watchdog cannot run on a frozen thread, so this is solved by prevention: budgets, loop guards, and Workers. Blob Workers do run inside the sandbox **[M]**.
5. **Capacitor grants the microphone and camera to any frame.** `BridgeWebChromeClient.onPermissionRequest` never checks `request.getOrigin()` **[V, source]**.
   - In Chromium, Blink's Permissions Policy denied `getUserMedia` to the sandboxed frame (`SecurityError`) while the host held mic permission **[M]**.
   - On WebView this is **[U]**. Override the callback to grant only to the app origin.
6. **Zod v4's JIT probe fires a CSP violation under strict CSP even though the error is caught** **[M; V, zod `v4/core/util.js:219`]**.
   - The full bundle also costs 24.1 kB gz.
   - The frame keeps the hand-written parsers. Anything that must use zod in the frame sets `z.config({ jitless: true })` (0 violations **[M]**).
7. **One bridge.** There are currently four dialects: v1 in code, plus the tech-and-market, maths and science proposals. Bridge v2 (§4) is one envelope that maps all of them.
   - It uses a window handshake, then a `MessagePort`.
   - Facts only: at most 12 primitive keys, drawn from the manifest's vocabulary.
   - Free text from a module never reaches the voice model. This is the prompt-injection firewall.
8. **The host grades; the module claims.** `classify.js:167` currently turns `moduleAnswer.correct` straight into evidence **[V]**. Under v2:
   - the host re-grades every answer against the key it already holds (`expect`, or `scene@1` `probe.correct` re-evaluated on the reported vars);
   - a module's `claim` is accepted only for T0/T1 and only when it agrees with the host.
9. **Observations use three lanes plus a talk gate.**
   - **log** (raw events), **fold** (quiet `conversation.item.create` lines at most every 2.5 s), **milestone** (Director call plus a spoken response).
   - Milestones are held while the teacher speaks, attached to the child's turn while the child speaks, and rate-limited to one per 4 s and at most 3 per minute **[U, tune by A/B]**.
10. **Harness gates V1–V15** (§6). The shipped `fraction-bars@1` already fails one: axe `nested-interactive` (serious), because `<svg role="img">` wraps `role="button"` parts that TalkBack cannot reach **[M]**.
    - Baseline: mount to first engine DOM is 46 / 119 / 148 ms at 1× / 4× / 6× CPU.
    - About 1.0 MB JS heap per live frame; postMessage round trip p90 ≤ 11.2 ms at 6× **[M]**.

---

## 1. Measured baseline (`sandbox-probe.mjs`)

| # | question | result | n / method |
|---|---|---|---|
| P1 | what leaves the frame under today's meta CSP (`connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'`) | foreign-origin requests via **img, css, font, media, script, import(), prefetch, nested iframe**; blocked: fetch, sendBeacon, WebSocket, Worker fetch | 3 runs; a leak server on a second origin is ground truth (an `img` "error" still delivered the request) |
| P2 | strict policy (§3.1) as header + `sandbox` | **0 of 8**; violations reported for connect/img/style-elem/script-elem/default/font/media/frame/script | 3 runs |
| P3 | strict policy as `<meta>` (Blob-hosted Forge games) | **0 of 8**, same as header | 3 runs |
| P4 | WebRTC `RTCPeerConnection` + STUN | **3 UDP packets left under all 4 policies**, incl. `webrtc 'block'` | 3 runs |
| P5 | delete `RTCPeerConnection`/`webkitRTCPeerConnection`/`RTCDataChannel`/… first, then try `about:blank` child | child access `SecurityError`; **0 packets** | 1 run × 2 policies |
| P6 | `location.href = <foreign>` (self-navigation) | allowed under every CSP; leak server saw it; **iframe `load` fired 2×** | 3 runs × 2 policies |
| P7 | storage, cookie, `top`/`parent` DOM, `window.open`, `getUserMedia` | all `SecurityError` / `null`; host had a granted mic | 3 runs |
| P8 | `eval` / `new Function` | allowed under today's meta; `EvalError` under strict | 3 runs |
| P9 | zod 4.6.5 `safeParse` under strict | parses, **1 `script-src` violation** (default); **0** with `jitless` | 3 runs |
| P10 | Blob `Worker` inside the sandbox | runs under `worker-src blob:`; its fetch is blocked (CSP inherited) | 3 runs |
| P11 | real `modules.html` with `serve.mjs` headers vs + `ACAO: *` | **never `ready`** (4 CORS blocks) vs `ready`; the real `serve.mjs` was also run and its headers inspected: no ACAO, no CSP | 2 runs + 1 traced run |
| P12 | host timer max gap while the frame busy-loops 1,500 ms | desktop isolation 14–50 ms; WebView-like (`--disable-site-isolation-trials`, `IsolateSandboxedIframes` off) **1,501–1,503 ms** | 3 runs × 3 |
| P13 | `fraction-bars@1` mount → `ready` / → first engine DOM (local server, WebView-like) | 1×: 30 / 46 ms; 4×: 73 / 119; 6×: 93 / 148 (p90 121 / 173). Earlier run 6×: 136 / 197 | n=10 per rate, medians, CDP `Emulation.setCPUThrottlingRate` |
| P14 | JS heap with 0 / 1 / 3 live frames | 0.83 / 1.81 / 2.88 MB → **≈1.0 MB per frame** | CDP `Performance.getMetrics` after GC; 2 runs agree |
| P15 | postMessage round trip host→frame→host | 1×: median 0.9–1.2 ms; 6×: median 1.1–8.0, p90 8.4–11.2, max 19.3 | 200 sequential × 3 runs |
| P16 | scripted solve (shade 3/4): 3rd tap → `goal_met` at host | 46 and 67 ms (upper bound: includes Playwright actionability) | 2 runs |
| P17 | axe-core 4.13 on `fraction-bars@1` | **nested-interactive (serious)**; landmark/heading/region (page-level, not applicable to a frame); `color-contrast` incomplete | 3 runs, identical |
| P18 | frame payload, gzip | React runtime 68.6 kB + bootstrap 2.0 + protocol 0.7 + engine 3.3 + CSS 1.2 = **75.8 kB**; full zod would add 24.1 kB | `gzip -c` on `dist/` |

**Limits of this evidence.**
- Desktop headless Chromium is a proxy. It is not a ₹8–10k Android phone, and it is not WebView. The isolation-off flags emulate WebView's process model but not its GPU or memory.
- CPU throttling is uncalibrated. DevTools can calibrate "low-tier" and "mid-tier mobile" presets against the host machine **[V]**; that calibration has not been done.
- Every number marked as WebView needs the real-device pass V15 (§6).

---

## 2. Threat model

The frame holds no personal data and no credentials, so the realistic harms are integrity, availability and content, not theft.

| threat | most likely source | layer that stops it | residual |
|---|---|---|---|
| data exfiltration (interaction stream, first name) | T2/T3 generated code; prompt-injected generator | strict CSP (P2/P3) · RTC deletion (P5) · nav kill (P6) · Android allowlist · data minimisation | the navigation URL itself, sent before the kill |
| phishing UI / external links / "ask your parent's number" | T2/T3 | sandbox (no popups, no top-navigation) · V13 content scan · no free-text inputs | text drawn on canvas (vision critique) |
| mic or camera capture | any code | `allow` + `Permissions-Policy` · Capacitor origin check · no grant token in `allow` | WebView path **[U]** |
| **false evidence** (wrong `correct`, premature `goal_met`) | buggy engine or generated code | host re-grades (§4.6) · V5 scripted solves · tier weights | goals with no machine-checkable key (stay low weight) |
| freeze / heat / memory blow-up | heavy sims, loops | budgets (V10) · loop guard (V14) · Workers · `freeze` on teacher speech · one live frame on Android | WebView shared thread (P12) |
| **prompt injection into the teacher** via module strings | T2/T3 strings, LLM-filled params | observations built from manifest vocabulary only (§5.4) | none if the rule holds |
| harmful or age-inappropriate content | generated text, images | §7 scans · T2 human review · T1 template-only | Hindi moderation quality (§7.3) |
| photosensitive seizures | animation bugs | V9 flash test, `prefers-reduced-motion` in `ctx` | — |
| supply chain (a CDN library) | engines | everything bundled under `'self'`; no CDNs | — |

---

## 3. Isolation layers

### 3.1 Response headers (app-served `modules.html` and Container App origin)

```http
# modules.html (any path that serves the frame document)
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
  font-src 'self'; media-src 'none'; connect-src 'none'; frame-src 'none'; worker-src blob:; form-action 'none';
  base-uri 'none'; object-src 'none'; manifest-src 'none'; frame-ancestors 'self' https://localhost <web app origins>;
  sandbox allow-scripts
Permissions-Policy: camera=(), microphone=(), geolocation=(), display-capture=(), fullscreen=(), payment=(), usb=(),
  serial=(), hid=(), bluetooth=(), clipboard-read=(), clipboard-write=(), autoplay=(), screen-wake-lock=(),
  accelerometer=(), gyroscope=(), magnetometer=(), xr-spatial-tracking=()
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Cache-Control: no-cache

# /assets/* (hashed; fetched with Origin: null by the opaque-origin frame)
Access-Control-Allow-Origin: *
Cross-Origin-Resource-Policy: cross-origin
X-Content-Type-Options: nosniff
Cache-Control: public, max-age=31536000, immutable
```

- **`sandbox allow-scripts` in the header** keeps the document sandboxed even when someone opens `/modules.html` top-level. In the probe, `'self'` still matched the URL's origin for the opaque document: `script-src 'self'` loaded the probe script **[M]**. The spec keeps a self-origin for this case **[V, CSP3]**.
- **`media-src 'none'`.** The host owns audio, as decided in `language-sst-engines`. Modules ask for sound with `request{what:"sound", ref}` and the host plays it from its own bundle. That keeps ducking, echo cancellation and the spoken-turn clock in one place.
- **`style-src 'unsafe-inline'`** is kept because CSS can only exfiltrate through `url()` loads, which `img-src` and `font-src` already block.
- **Trusted Types** (`require-trusted-types-for 'script'`) is the next step after V3 proves React 19 and the engines raise no TT violations **[U]**.
- **Meta-only hosts.** A `<meta>` policy cannot carry `frame-ancestors`, `sandbox` or `report-uri` **[V, CSP3]**. Blob Storage cannot set headers: you need a CDN or Front Door rules engine **[V, Azure docs]**.
  - Forge games on Blob therefore embed the same policy minus those three directives. P3 shows it blocks the same 8 channels.
  - The iframe's `sandbox` attribute then supplies the sandbox.
  - Blob CORS must allow `GET` from `*`, as already decided in `forge-infra-azure`.

### 3.2 Iframe attributes (host side)

```html
<iframe sandbox="allow-scripts" allow="camera 'none'; microphone 'none'; geolocation 'none'; fullscreen 'none'; autoplay 'none'"
        referrerpolicy="no-referrer" loading="eager" title="<engine title, child language>"
        src="<sandbox-origin>/modules.html#mid=m_ab12&host=<app-origin>&boot=<128-bit nonce>"></iframe>
```

- **Never add any other sandbox token.** That includes `allow-same-origin` (with `allow-scripts`, the frame can remove its own sandbox **[V, MDN]**), `allow-popups`, `allow-forms`, `allow-modals`, `allow-top-navigation*` and `allow-downloads`.
- **Separate origin** (web): serve modules from their own origin, for example a second hostname on the ACA app. MCP Apps requires "The Host and the Sandbox MUST have different origins" **[V]**.
  - Today's frame posts to `location.origin`, which works only on the same origin. On a separate origin it must read `host=` from the hash and check it against an allowlist compiled into the frame bundle.
- **APK.** Capacitor serves the app from `https://localhost` **[S]**, and it is unknown whether its local server can add `ACAO` **[U]**. If it cannot (measurement S-M1):
  - build the frame entry as a **classic IIFE script** with no `type=module`. Classic scripts load from opaque origins without CORS: the probe's own script is classic and loaded with no ACAO **[M]**.
  - register engines as classic scripts (`window.__taxila.engines[id] = …`) instead of using `import()`.

### 3.3 Frame bootstrap hardening (runs before any engine code)

1. Delete `RTCPeerConnection`, `webkitRTCPeerConnection`, `RTCDataChannel`, `RTCSessionDescription` and `RTCIceCandidate` from `window` (P5).
2. Listen for `securitypolicyviolation` and report `error{code:"csp_violation"}` with the directive only, never URLs.
3. A `PerformanceObserver('longtask')` feeds `perf`. A task over 200 ms reports `error{code:"long_task", fatal:false}`.
4. `error` and `unhandledrejection` produce `error{code:"engine_crash"}`. The existing React `EngineBoundary` card stays.
5. `visibilitychange` and `freeze{on:true}` stop `requestAnimationFrame` loops and timers through the kit's scheduler.
6. If zod is ever imported in the frame, call `z.config({ jitless: true })` (P9).
7. T2/T3 only: wrap the generated code in the loop-guard transform (V14) and run sims over 4 ms per step in a Blob Worker (P10).

### 3.4 Host enforcement (`ModuleHost` → `module-gate@1`)

| rule | value | on breach |
|---|---|---|
| source routing | `e.source === iframe.contentWindow` and `e.origin === "null"` for the window channel; after the handshake, the `MessagePort` only | drop |
| navigation | count iframe `load` events; the 2nd one means the frame navigated (P6) | unmount, `error{code:"navigated", fatal}`, incident, denylist `engine@ver` for the session |
| message size | `JSON.stringify(m).length ≤ 8192` | drop and count |
| rate | token bucket 20/s, burst 40 per module | drop; over budget for 3 s → `error{code:"flood"}`, unmount |
| schema | §4 parsers; event `name` must be in the manifest `emits` | drop and count `protocol` |
| ready timeout | 8 s (P13 p90 ≈ 0.17 s at 6×, so 8 s only covers network) | the existing "could not load" card |
| heartbeat (isolated platforms) | `ping` every 2 s; `pong` within 1 s, 3 misses | unmount; on WebView a hang freezes the host too, so prevention (§3.3, V10) carries it |
| revocation | the lesson-start payload carries an `engine@ver` denylist | refuse to mount |
| one live frame on Android | pre-mount the next frame hidden (`lesson-arc`), but at most 1 animating | the host sends `freeze` to the hidden one |

### 3.5 Android native layer (Capacitor)

- **`onPermissionRequest`.** Grant only when `request.getOrigin()` is the app origin. Capacitor's default grants any frame **[V, source]**.
- **`shouldInterceptRequest`.** Allow only the app origin, the sandbox origin, the API host and the Forge Blob host. Answer everything else with an empty 403.
  - This is the only layer that can stop the navigation channel, rather than detecting it after the fact.
  - Whether it sees every subframe navigation in Capacitor's WebView is **[U]** (S-M2).
- **Never call `WebView.setWebContentsDebuggingEnabled(true)` in release builds.** V15 needs it, so enable it only in a test flavour.

---

## 4. Bridge v2 protocol

### 4.1 Lifecycle

```
host                                                    frame (sandboxed, origin "null")
 mount: create iframe (#mid,&host,&boot) ── load #1 ─►  bootstrap hardening (§3.3)
                                           ◄─ window ── hello{mid, boot-echo, build}          (only window message)
 check source/origin/boot/load==1; new MessageChannel
 postMessage(init{spec, ctx, replay}, "*", [port2]) ─►  validate spec → resolve params → mount engine → apply replay
                                           ◄─ port ──── ready{caps, emits, state}
 commands (cseq++) ───────────────────────── port ──►  apply → ack{cseq} (state-changing commands only)
                                           ◄─ port ──── interaction | progress | answer | goal_met | stuck | state | perf | error
 verdict{answer_seq} (host-graded) ───────── port ──►  show feedback (T2/T3 wait for it; T0/T1 may show their own)
 teardown ────────────────────────────────── port ──►  stop loops; ◄─ bye; host removes iframe (500 ms max)
```

- **Why a port.** Once `port2` is transferred, nothing listens on `window`. A navigated or replaced document cannot reach the port, so injection needs the original document.
- **Why the first message goes to `"*"`.** An opaque origin cannot be named as a postMessage target **[S]**.
- **Re-mount and reload.** `init.replay` carries the command history, as `host.tsx` already does. The frame answers `ready` with the `state.hash` it reached.
  - The host compares that with the hash it expects (from a previous `state`). On a mismatch it sends `reset` and replays once; if that fails, `error{state_diverged}`.
  - The science engines' fixed-dt determinism (`science-engines` §2.6) makes this hash comparison possible.

### 4.2 Types (`shared/bridge.ts`, proposed)

```ts
// Bridge v2. Types + limits only. Parsers stay hand-written (no eval, no zod JIT) in src/modules/frame/protocol.ts,
// shared by frame, host and Node tests. MathValue/ProbeSpec come from maths-engines §3.1 (packages/engines/core/types.ts).
export const BRIDGE_V = 2 as const;
export const LIMITS = { msgBytes: 8192, factKeys: 12, keyLen: 24, strLen: 64, detailLen: 120, emitsMax: 40,
  ratePerSec: 20, burst: 40, floodMs: 3000, readyTimeoutMs: 8000, pingEveryMs: 2000, pongTimeoutMs: 1000 } as const;
export const NAME_RE = /^[a-z][a-z0-9_]{0,23}(\.[a-z0-9_]{1,24}){0,2}$/;          // "fr.cut", "probe.open", "misc.signal"
export const KEY_RE = /^[a-z][a-z0-9_]{0,23}$/;

export type Prim = string | number | boolean | null;
export type Facts = Record<string, Prim>;            // ≤ 12 keys (KEY_RE), strings ≤ 64 chars, numbers finite
export type Tier = "T0" | "T1" | "T2" | "T3";
export type Band = "B1" | "B2" | "B3" | "B4";       // kids-ux-ages §0.2
export type Stage = "concrete" | "pictorial" | "abstract";
export type Lang = "en" | "hi" | "hi-Latn+en";
export type EngineId = `${string}@${number}`;
export type MiscId = `MC.${string}`;
export type Outcome = "correct" | "incorrect" | "misc" | "partial";
export type AnswerValue =
  | import("../packages/engines/core/types").MathValue
  | { t: "choice"; id: string } | { t: "set"; ids: string[] } | { t: "order"; ids: string[] }
  | { t: "label"; target: string; id: string }
  | { t: "vars"; vars: Facts };                      // scene@1: host re-evaluates probe.correct / traps on these
export interface StateSnap { hash: string; facts: Facts; stage?: Stage }   // hash = FNV-1a of canonical engine state
export type Cap = "set_param" | "highlight" | "reveal" | "reset" | "set_stage" | "open_probe" | "record_answer"
  | "demo" | "lock" | "freeze" | "snapshot" | "restore" | "ghost" | "focus" | "set_scene";
export type ErrorCode =
  | "bad_params" | "unreachable_goal" | "engine_crash" | "unknown_engine" | "load_failed" | "csp_violation" | "long_task"
  | /* host-only: */ "navigated" | "flood" | "protocol" | "not_ready" | "no_pong" | "state_diverged" | "revoked";

// ── module → host ── seq starts at 1, +1 per message; t = ms since init on the frame clock
interface MBase { v: 2; mid: string; seq: number; t: number }
export type ModuleMsg =
  | (MBase & { k: "hello"; boot: string; build: string })                                   // window channel only
  | (MBase & { k: "ready"; caps: Cap[]; emits: string[]; state: StateSnap })
  | (MBase & { k: "interaction"; name: string; facts: Facts; src: "child" | "host" | "engine";
               cause?: number /* cseq if src=host, seq if src=engine */; salience: 0 | 1 })
  | (MBase & { k: "progress"; goal: string; distance: number })                             // 0..1, 0 = met
  | (MBase & { k: "answer"; probe?: string; item?: string; value: AnswerValue; latency_ms: number; attempt: number;
               changes: number; via: "tap" | "drag" | "keys" | "voice"; claim?: Outcome; misc?: MiscId; state: StateSnap })
  | (MBase & { k: "goal_met"; goal: string; attempts: number; hints: number; ms: number; state: StateSnap })
  | (MBase & { k: "stuck"; reason: `eng.${string}`; facts?: Facts })                       // generic stuck is host-derived (§5.3)
  | (MBase & { k: "state"; reply_to?: number; snap: StateSnap })
  | (MBase & { k: "request"; what: "sound" | "hint" | "attention"; ref?: string })          // the host decides
  | (MBase & { k: "ack"; cseq: number; ok: boolean; reason?: string })
  | (MBase & { k: "error"; code: ErrorCode; fatal: boolean; detail?: string })              // detail never reaches a model
  | (MBase & { k: "perf"; long_tasks: number; max_task_ms: number; fps_p10?: number })      // every 10 s while visible
  | (MBase & { k: "pong"; n: number })
  | (MBase & { k: "bye" });

// ── host → module ── cseq starts at 1; state-changing commands are acked
interface HBase { v: 2; mid: string; cseq: number }
export interface InitCtx {
  lang: Lang; numerals: "latn" | "deva"; band: Band; reducedMotion: boolean; theme: "light" | "dark";
  displayName?: string;        // first name only, for display; never emitted back, never a surname/school/id
  hostNow: number;             // epoch ms at init: host time = hostNow + t (drift re-anchored on every pong)
}
export type HostMsg =
  | (HBase & { k: "init"; engine: EngineId; tier: Tier; spec: unknown; ctx: InitCtx; replay: HostMsg[] })
  | (HBase & { k: "set_param"; name: string; value: Prim | Prim[]; by: "teacher" | "director" })
  | (HBase & { k: "highlight"; target: string; ms?: number })
  | (HBase & { k: "reveal"; what: "answer" | "hint"; rung?: 1 | 2 | 3 | 4 })
  | (HBase & { k: "reset" }) | (HBase & { k: "snapshot" }) | (HBase & { k: "restore"; hash: string })
  | (HBase & { k: "set_stage"; stage: Stage })
  | (HBase & { k: "open_probe"; probe: string }) | (HBase & { k: "record_answer"; probe: string; value: AnswerValue })
  | (HBase & { k: "verdict"; answer_seq: number; outcome: Outcome; misc?: MiscId })
  | (HBase & { k: "demo"; moves: string[] }) | (HBase & { k: "lock"; actions: string[] })
  | (HBase & { k: "freeze"; on: boolean })
  | (HBase & { k: "ghost"; on: boolean }) | (HBase & { k: "focus"; target: string }) | (HBase & { k: "set_scene"; scene: string })
  | (HBase & { k: "ping"; n: number }) | (HBase & { k: "teardown" });

// ── what the Director receives (replaces ModuleEvent; one per observation, §5) ──
export interface ModuleEventV2 {
  mid: string; engine: EngineId; tier: Tier; at: number /* host epoch ms */; lane: "fold" | "milestone";
  kind: "interaction" | "answer" | "goal_met" | "stuck" | "state" | "error" | "stage";
  facts: Facts; line: string;
  evidence?: { item?: string; probe?: string; outcome: Outcome; by: "host"; claimAgreed?: boolean; misc?: MiscId;
               latency_ms: number; attempt: number; hints: number; rapid: boolean; dwell_after_hint_ms?: number;
               via: "tap" | "drag" | "keys" | "voice" };
}
```

**Manifest additions** (to `EngineManifest` in maths §3.1 and the science §2.1 manifests):
- `caps: Cap[]`
- `emits: string[]`, each matching `NAME_RE`
- `facts: Record<key, { type: "num" | "int" | "bool" | "enum" | "id" | "frac"; enum?: string[]; unit?: string }>`. This is the observation vocabulary (§5.4).
- `budget: { gzipKB, maxNodes, heapMB, fps }`
- `solve(spec): Script | null` and `lint(spec): Issue[]`. Both are pure (no DOM) and back V5 and the live T1 reachability check.
- `grade(spec, value): Outcome`. Pure, and imported by the host for T0/T1.

### 4.3 Validation rules (both directions, before any effect)

- **Envelope.**
  - `v === 2` (a v1 message has no `v`; see §4.5).
  - `mid` equals the slot's id.
  - `k` is in the enum.
  - `seq` is strictly greater than the last one: a duplicate is dropped, a gap is counted.
  - `t` never decreases.
- **Content.**
  - Plain JSON only: reject anything whose structured clone is not a plain object (`Blob`, `ArrayBuffer`, `Date`, `Map`).
  - Facts: ≤ 12 keys matching `KEY_RE`, strings ≤ 64 characters, finite numbers.
  - The `name` must be in `ready.emits`, and `ready.emits` must be a subset of `manifest.emits`.
- **Commands.**
  - The host never sends a `Cap` the module did not declare in `ready.caps`. The teacher's tool call receives `{ok:false, reason:"unsupported"}` instead, so she does not narrate a change that never happened.
  - `set_param` values are clamped by the engine (`resolveParams`). The engine acks the value it actually applied, `ack{ok:true, reason:"clamped:12"}`, so the teacher's next utterance can use the true value.
- **Coalescing teacher commands.** Repeated `set_param` calls on the same name within 100 ms collapse to the last one. A realtime model can fire several tool calls in a row.

### 4.4 Attribution: who did it

Every `interaction` carries `src`. When `set_param` or `demo` comes from the teacher, the module emits `src:"host", cause:<cseq>`. The reducer then never credits the child with the teacher's slider move, and never counts it as an action for idle, thrash or gaming detection.

A `goal_met` reached during a `demo`, or within 1 s of a teacher `set_param` that made it true, is a **demonstration, not evidence**. Its `evidence` field is omitted.

### 4.5 Mapping the existing dialects onto v2

| source | message | v2 |
|---|---|---|
| v1 code (`contracts.ts`) | `ready` / `interaction{name,data}` | `ready` (caps from manifest) / `interaction{name, facts: flatten(data), src:"child", salience:1}` |
| v1 code | `answer{value, correct}` | `answer{value, claim: correct ? "correct" : "incorrect"}` → host re-grades |
| v1 code | `goal_met{goal}` / `stuck{reason}` / `error{message}` | `goal_met` / `stuck{reason:"eng."+reason}` / `error{code:"engine_crash", detail}` |
| tech-and-market §3.4 | `param_change` / `idle` / `nonce` | `interaction{name:"param.set"}` / host-derived `stuck{idle}` / `boot` + port |
| maths §3.2 | `action{type}` / `probe_open` / `probe_commit` / `probe_result` | `interaction{name:type}` / `interaction{name:"probe.open"}` / `answer` / host `verdict` |
| maths §3.2 | `misc_signal` / `stage_change` / `state{summary}` | `interaction{name:"misc.signal", facts:{misc,strength}}` / `interaction{name:"stage.change"}` / `state{snap.facts}` (no prose summary) |
| science §2.2 | `salience 0/1/2` / `cause` / `src` | 0→`salience:0`, 1→`salience:1`, 2→derived by `k` (answer/goal_met/stuck/error are milestones) / `cause` / `src` (`model`→`engine`) |
| maths §3.3 / science §2.3 | `reveal_hint` / `start_poe` / `snapshot` | `reveal{what:"hint", rung}` / `open_probe` / `snapshot` |
| game-mechanics `VerifiedAct` | host-derived act | built by the host from `answer` + `verdict` (`src_seq` = the answer `seq`) |

During migration the host accepts v1 when `v` is absent. `ModuleEventBuffer` keeps its milestone flush. The v1 `correct` flag becomes a `claim`.

### 4.6 Correctness authority

| tier | who computes the outcome that becomes evidence | the module's `claim` | weight |
|---|---|---|---|
| T0 (bundled, reviewed TS) | the host runs the engine's pure `grade(spec, value)` from the same source | must agree, else `state_diverged` and no evidence | 1.0 |
| T1 (LLM-filled params) | same as T0. The key comes from the verified kit item (`expect`), never from the LLM fill | must agree | 1.0 (0.5 for an unverified mini-kit, `TopicKit.verified`) |
| T2 `scene@1` | the host re-evaluates `probe.correct` and `traps` on `value.vars` with the shared evaluator in `genui-scene-dsl.mjs` | ignored | 1.0 after review |
| T2 Forge game | the host grades `value` against `expect` (MathValue equivalence, maths §3.1) | ignored | 0.75 until 50 sessions show agreement ≥ 0.98 **[U]** |
| T3 draft | no evidence; the teacher may still talk about it | ignored | 0 |

The server applies the same rule. `TurnRequest.moduleEvents[].evidence.by` must be `"host"`, and `classify.js` must stop trusting `moduleAnswer.correct` (line 167). It uses `evidence.outcome` only when the engine id is in the registry with tier T0/T1/T2.

---

## 5. Telemetry → teacher observations (`observer@1`)

### 5.1 Pipeline

```
port msgs → gate (§3.4, §4.3) → ledger (ring buffer 2,000 events incl. salience 0; uploaded in batches, ids + facts only)
          → reducer (per module): coalesce · grade (§4.6) · derived detectors (§5.3) · timing features
          → Observation{lane, facts, line, evidence?}
          → lane router:  log ─► ledger only
                          fold ─► realtime conversation.item.create (no response.create) + next TurnRequest batch
                          milestone ─► talk gate (§5.5) ─► Director call (TurnRequest.moduleEvents) ─► instructions + response.create
```

### 5.2 Coalescing (raw → semantic)

| raw pattern | becomes | default |
|---|---|---|
| continuous `param.set` or drag on one control | one `drag{param, from, to, n, ms}` after a quiet gap | `coalesceQuietMs = 600` |
| repeated taps on the same target | one `tap{target, n}` | `tapMergeMs = 400` |
| A→B→A toggles | `flip{target, n}` | within 2 s |
| `progress` stream | kept for detectors only; the latest `distance` goes into facts | — |
| any fold content | at most one fold line per module | `foldEveryMs = 2500` (§1.7 said 1.5–3 s; v1 flush is 3 s) |

### 5.3 Derived detectors (host-side, engine-agnostic, child-sourced events only)

| detector | rule | lane | feeds |
|---|---|---|---|
| idle | no child event for `idleMs` while the module is visible, unfrozen and nobody is speaking | milestone, at most once per 60 s | `stuck{reason:"idle"}` |
| circling | `progress.distance` has ≥ 3 local minima without reaching 0 within 20 s | milestone | hint opportunity |
| thrash | ≥ 8 child actions in 5 s with no fall in `distance` | fold; repeated twice → milestone | dialogue-affect F-indicators |
| repeat_wrong | the same `value` graded wrong twice on one probe | milestone | misconception verify (science §2.5: evidence, not verdict) |
| rapid | answer `latency_ms` < 600 ms (tap floor, dialogue-affect §3.3) | a fact on the answer, never a milestone by itself (DA4) | `TurnEvent` |
| fast_retry | the next answer < 2 s after a wrong verdict | fact | gaming G1 |
| dwell_after_hint | time from host `reveal{hint}` to the next child action | fact | `TurnEvent.dwellAfterHintMs` |
| engine stuck | the module's own `stuck{eng.*}` (for example fraction-bars after 12 changes) | milestone | — |

`idleMs` is 15 s for B1–B2 and 20 s for B3–B4 **[U]**. Each detector is a pure function over the child event window, unit-tested with fake timers, as `moduleEvents.ts` already does.

The reducer also emits `childStartMs`, the first child action after the teacher's last played audio frame. That lets `TurnEvent` treat a tap as a turn (`modality:"tap"`, `attemptOnStep`, `hintRungBefore`).

### 5.4 Observation line: facts, never sentences

```
[mod m_12 fractions@1] answer=2/5 verdict=misc misc=MC.FRAC.ADD_ACROSS latency_ms=4100 attempt=1 stage=pictorial
[mod m_3 particles@1] drag=T_C from=25 to=100 n=14 ms=6200 phase=boiling plateau=true pred=air match=false
[mod m_9 optics@1] stuck=circling goal=g2 distance=0.18 hints=1
```

- **Grammar.** `[mod <mid> <engine>]` followed by `key=value` pairs in manifest order, at most 240 characters.
  - Values are numbers (at most 4 significant figures), manifest enums, ids or `n/d`.
  - Sentence templates are banned. Sentence-shaped prompt text gets recited: html-portfolio measured 4/5 recited, falling to 0 after removal (`science-engines` §2.4).
- **Firewall.** A fact passes only if its key is in `manifest.facts` and its value type-checks against that entry.
  - String values must be a declared enum member or match the id pattern.
  - T2/T3 modules can never place free text into the voice model's context.
  - Labels the child sees can be LLM-written (T1 `say`, scene text). The teacher's context gets their ids, never their text.

### 5.5 Lanes and the talk gate

| condition when a milestone is ready | action |
|---|---|
| teacher audio is playing (between `output_audio_buffer.started` and `stopped` **[S]**) | hold. Deliver on stop. If held over 6 s, deliver at the next stop anyway. B1–B2 modules are also sent `freeze{on:true}` while she speaks (`lesson-arc`) |
| the child is speaking (`speech_started` to the end of the turn) | attach to that turn's `TurnRequest.moduleEvents`. No separate response |
| quiet | wait `childSpeechHoldMs = 1200` (children often exclaim on success), then call the Director and `response.create` |
| less than 4 s since the last module-triggered response, or 3 already this minute | merge into the next milestone. A `goal_met` is never dropped, only merged |
| `goal_met` and `answer` arrive in the same 300 ms | one milestone |

- **GPT-Live.** Fold lines go to `session.thinking.append` (quiet context, ≤ 500 tokens **[V, tech-and-market §1.7]**). Milestones still go through the Director. `commentary.append` is never used for module events, because it is spoken verbatim.
- **Ownership.** The talk gate sits beside `ModuleEventBuffer`: same timers abstraction, and the milestone flush stays the trigger.

### 5.6 Config (defaults; every value is a tunable, logged per lesson)

```ts
export interface ObserverConfig {
  coalesceQuietMs: 600; tapMergeMs: 400; foldEveryMs: 2500;
  idleMs: Record<Band, number>;                    // { B1: 15000, B2: 15000, B3: 20000, B4: 20000 }
  thrash: { actions: 8; windowMs: 5000 }; circling: { minima: 3; windowMs: 20000 };
  repeatWrong: 2; rapidTapMs: 600; fastRetryMs: 2000; demoGraceMs: 1000;
  milestoneMinGapMs: 4000; maxTeacherPromptsPerMin: 3; childSpeechHoldMs: 1200; holdMaxMs: 6000;
  ledgerMax: 2000; lineMaxChars: 240;
}
```

---

## 6. Headless validation harness (`harness@1`)

### 6.1 Where each gate runs

- **T0 engines.** CI on every build: about 20 golden specs per engine (tech-and-market §3.3), Playwright against `serve.mjs` headers rather than Vite (§0.2).
- **T1 live specs.** No browser; the latency budget is 1–3 s. The live path checks `safeParse`, then `resolveParams` issues, then pure `lint(spec)` and `solve(spec) !== null` (reachability), which is target < 5 ms **[U]**, then §7.1 string checks.
- **T2.** Forge S4 VERIFY in the egress-denied ACA sandbox runs all gates. `scene@1` lint S1–S7 and its solver run first, as they are cheaper.
- **T3.** V1–V4 and V13 only, with a "draft" badge. Never evidence.

### 6.2 Gates

| id | gate | method | pass threshold | tiers |
|---|---|---|---|---|
| V1 | boots | mount in a host page that speaks v2 | `ready` ≤ 2,000 ms at 6× CPU (P13: p90 173 ms) | all |
| V2 | protocol conformance | every message through §4 parsers; handshake order; `emits ⊆ manifest` | 0 rejects | all |
| V3 | clean console | `console` error, `pageerror`, `securitypolicyviolation` | 0 (would have caught zod P9) | all |
| V4 | no network | `page.route('**')`: only sandbox-origin assets; replay the P1 leak battery as a negative test; iframe `load` count | 0 foreign requests, 0 STUN packets, load == 1 | all |
| V5 | goals reachable | replay `solve(spec)` (or Forge `solution`, or the `scene@1` solver) as real pointer/keyboard input; each misconception path | every goal → `goal_met`; each trap → its `misc`; verdicts equal `grade()` | T0–T2 |
| V6 | keyboard / switch operable | the same script using Tab/Enter/arrows only | every goal reachable | T0–T2 |
| V7 | axe-core (frame rules) | `wcag2a/aa`, `wcag21aa`, `wcag22aa`, best-practice; disable `region`, `landmark-one-main`, `page-has-heading-one`, `bypass` | 0 serious or critical (fraction-bars fails today, P17) | T0–T2 |
| V8 | child target size | `getBoundingClientRect` at 360×640 CSS px | hit ≥ 64 dp (B1–B2) / 48 dp (B3–B4); answer tiles ≥ 96 / 64; gaps ≥ 16 / 8 (`kids-ux-ages` row 5) | T0–T2 |
| V9 | photosensitivity | CDP `Page.startScreencast` at 30 fps during the solve; relative luminance on a grid | ≤ 3 general flashes and ≤ 3 red flashes in any 1 s over any 25 % of a 10° field (≈ 11 % of the viewport) (WCAG 2.3.1 **[V]**); EA IRIS (BSD-3) on the recording for T2 **[V]** | all animated |
| V10 | low-end performance | WebView-like flags, `Emulation.setCPUThrottlingRate` 6×, longtask observer, rAF sampler | long tasks > 50 ms ≤ 2 per solve, none > 200 ms; frame-interval p50 ≤ 33 ms; input → event p90 ≤ 100 ms; nodes ≤ `budget.maxNodes`; engine chunk ≤ `budget.gzipKB` (P0 ≤ 120 kB, maths §3.1) | T0–T2 |
| V11 | memory and leaks | mount, solve, unmount ×20 | heap back within 1 MB of baseline (P14: 1 MB per live frame); a live frame ≤ `budget.heapMB` | T0–T2 |
| V12 | determinism | same spec and same script, twice | equal final `state.hash` | T0–T2 |
| V13 | content safety | §7 on spec strings, DOM text walk (text, `aria-label`, SVG `<text>`) and screenshots at start/mid/end | §7.4 thresholds | all |
| V14 | static code (generated) | acorn AST: tech-and-market §3.3 bans + `RTC*`, `location` writes, `document.domain`, `window.name`, `postMessage` outside the kit, `<a href>`, `setInterval` < 16 ms; loop-guard transform (throw after 50 ms in one loop, the JS Bin / CodePen approach **[S]**) | 0 bans; the guard is present | T2, T3 |
| V15 | real device (weekly, not per build) | Playwright `_android` (experimental; adb, Chrome ≥ 87 **[V]**) driving the debug APK's WebView on a ₹8–10k, 3 GB phone | V1 ≤ 1,500 ms; no long task > 200 ms; V4 under the native allowlist; mic denied to the frame | T0, sample of T2 |

### 6.3 Harness types and report

```ts
export type ScriptStep =
  | { do: "tap" | "focus"; target: string } | { do: "drag"; target: string; to: string; steps?: number }
  | { do: "key"; key: string } | { do: "wait"; ms: number } | { do: "cmd"; cmd: HostMsg };
export interface HarnessCase {
  engine: EngineId; tier: Tier; spec: unknown; band: Band; lang: Lang;
  script: ScriptStep[];                           // from engine.solve(spec), Forge `solution`, or the scene@1 solver
  expect: { goals: string[]; misc?: MiscId[]; events: string[] };
}
export interface GateResult { id: `V${number}`; pass: boolean; metric?: number; threshold?: number; detail?: string }
export interface ValidatorReport {
  engine: EngineId; specHash: string; tier: Tier; chromium: string; cpuRate: number; viewport: [number, number];
  isolation: "desktop" | "webview_like" | "device"; gates: GateResult[]; screenshots: string[]; durationMs: number;
}
```

`ValidatorReport` is stored next to the Forge manifest (`coding-agent-harnesses` §5.12), so a dashboard can show why a module shipped.

### 6.4 Playwright mechanics that matter (all exercised in `sandbox-probe.mjs`)

- **Process model.** Launch with `--disable-site-isolation-trials --disable-features=IsolateSandboxedIframes,site-per-process,IsolateOrigins` so the frame shares the host's process, as on WebView (P12). Default desktop isolation hides freezes.
- **CPU throttling.** Use a CDP session on the page: `Emulation.setCPUThrottlingRate {rate: 6}`. With isolation off it applies to the frame too.
- **Frame access.** `page.frames().find(f => f.url().endsWith('#'+mid))`. `frame.locator()` works inside opaque-origin frames. `frame.evaluate(axeSource)` injects axe, because DevTools evaluation is not subject to the page CSP **[M]**.
- **Timing.** `context.addInitScript` installs a MutationObserver, longtask observer and rAF sampler into every frame before engine code runs. That is how P13 measured first engine DOM.
- **Network.** A leak origin on a second port plus a UDP socket for STUN give ground truth that request interception alone misses (P4).

---

## 7. Content safety for module content

### 7.1 What is checked where

| content | live T1 (seconds) | T2 offline (minutes) |
|---|---|---|
| strings in the spec (`say`, labels, options, story context) | length/charset caps, URL/phone/email regex, Hindi + Hinglish blocklist, Azure Content Safety text API run in parallel with the teacher's spoken preamble; fail → drop the module and let the teacher carry on (existing fallback card) | the same, plus a rubric critique (gpt-5.6): age register, stereotypes, cultural fit |
| rendered text (DOM, `aria-label`, SVG `<text>`) | — (template engines render only spec strings) | DOM text walk in V13 |
| text drawn on canvas, images, sprites | — (images are never generated live) | Content Safety image API (≤ 4 MB, 50–7,200 px **[V]**) + vision critique on V13 screenshots |
| narration and TTS text | the safety predicate before synthesis (house rule: safety by predicate) | same |
| maps | only the bundled Survey of India boundary asset may render India; generic world GeoJSON is rejected (tech-and-market §3.2) | asset hash check |

### 7.2 Child-specific rules (lint, not judgement)

- No URLs or links.
- No free-text input outside engine-allowlisted tile and keypad inputs.
- No request for a name, school, phone, address or photo.
- No brands, no purchase prompts. Prices inside `money@1` are fine.
- No countdown pressure or punishing failure states (`game-mechanics` rules).
- No flashing (V9).
- B1–B2: no peril, injury or scary imagery.
- Names and roles in generated stories rotate across gender, region and religion. A stereotype rubric item uses an Indian-context checklist: caste, religion, region, gender-role and skin-tone cues **[U, rubric to be written with reviewers]**.

### 7.3 Hindi and Hinglish

- Content Safety's harm models were "trained and tested" on Chinese, English, French, German, Spanish, Italian, Japanese and Portuguese. Prompt Shields and custom categories were tested in English only. Microsoft says the models "can work in many other languages, but the quality might vary" **[V]**. Hindi is not in the list.
- Therefore:
  1. Run the original string and its English gloss (the bilingual `L10n` pair already exists) and take the maximum severity.
  2. Keep a Devanagari + romanised blocklist (abuse, sexual, caste slurs, self-harm terms), versioned in `data/`.
  3. Measure miss rates on a labelled Hinglish set before trusting the API (S-M5).
- Content Safety is available in `southindia` for content harms, Prompt Shields and blocklists **[V]**. Calls stay inside the Azure grant.

### 7.4 Thresholds

- Block at severity ≥ 2 (the API returns 0/2/4/6 **[S]**) in any category for child-facing strings. This is stricter than the usual default of 4 **[U, tune on false positives]**.
- Any blocklist hit, PII-request pattern or URL is a hard fail.
- T2 also needs human sign-off (tech-and-market §3.6).

---

## 8. Changes to the shipped code (in order)

1. **P0, `server/serve.mjs`.** Add `Access-Control-Allow-Origin: *` (and `nosniff`) to `/assets/*`; add the §3.1 headers to `modules.html`.
   - Add an e2e check that boots a module through `serve.mjs`, not Vite. Today's e2e passes only because of `vite.config.ts` line 15.
2. **P0, `modules.html`.** Replace the meta policy with the strict policy, minus `frame-ancestors`, `sandbox` and `report-uri`, as defence in depth beside the header.
3. **P0, `host.tsx`.** Count `load` events and kill on the 2nd. Set an explicit `allow`. Add the size and rate caps.
4. **P0, `frame/bootstrap.tsx`.** Delete the `RTC*` constructors. Report CSP violations and long tasks.
5. **P0, `server/director/classify.js:167`.** Accept a module outcome only when the host graded it (`evidence.by==="host"`) and the engine is a registered T0/T1/T2.
6. **P0, `fractionBars.tsx`.** Use `role="group"` and `aria-label` on the `<svg>` when parts are editable, so the axe `nested-interactive` failure clears.
7. **P1.** Bridge v2 envelope with a `MessagePort`; `observer@1` with the talk gate; manifest `facts`/`caps`/`solve`/`grade`; harness V1–V12 in CI.
8. **P2.** Capacitor `onPermissionRequest` origin check and `shouldInterceptRequest` allowlist; Forge V13–V14; weekly V15 on a device.

---

## 9. Measurements still to run

| id | question | method | decides |
|---|---|---|---|
| S-M1 | can the APK's local server send ACAO for opaque-origin module scripts? | debug APK, mount `fraction-bars` | header fix vs the classic-IIFE frame build (§3.2) |
| S-M2 | does `shouldInterceptRequest` see a subframe self-navigation, and does Blink deny `getUserMedia` to the sandboxed frame in WebView? | P5/P6 battery inside the APK | how much the native layer has to carry |
| S-M3 | calibrated CPU factor for a ₹8–10k phone | DevTools calibration plus V15 timings on the same engine | the 6× proxy in V1/V10 |
| S-M4 | React 19 + engines under `require-trusted-types-for 'script'` | V3 with the directive added | enable Trusted Types |
| S-M5 | Content Safety miss and false-positive rates on Hinglish strings | 300 labelled child-context strings | thresholds §7.4, blocklist scope |
| S-M6 | talk-gate settings | A/B on gap 4 s vs 8 s and hold 1.2 s vs 2 s; outcomes: barge-ins on the teacher, goal-to-next-action time, voluntary continuation | §5.6 defaults |
| S-M7 | Content Safety latency from India | p50/p90 of the text API from ACA eastus2 vs a southindia resource | whether the live T1 check fits inside the preamble |

---

## 10. Proposed context entries (for the main loop to merge)

- **measurement `sandbox-csp-leak-battery`** (2026-10-02, n=3, Chromium 141): today's meta CSP leaks via 8 channels; the strict policy (header or meta) leaks 0; STUN leaves under every policy; self-navigation is allowed and shows as a 2nd iframe `load`.
- **measurement `module-frame-webview-coupling`** (n=9): with isolation off, a 1,500 ms frame loop gives a 1,501–1,503 ms host gap; with desktop isolation, 14–50 ms.
- **measurement `module-frame-mount-cost`** (n=10 per rate): `fraction-bars` first engine DOM 46/119/148 ms at 1×/4×/6×; about 1.0 MB heap per frame; round trip p90 ≤ 11.2 ms at 6×.
- **rejection `serve-mjs-module-cors`**: `serve.mjs` has no ACAO, so the opaque-origin frame cannot load its module scripts. The bug was masked because the e2e test runs on Vite, which allows origin `null`.
- **decision `bridge-v2`**: one envelope (§4), port after the handshake, facts-only observations, host-graded evidence.
  - Reverse if a v2 field adds over 1 ms p50 per message at 6× (P15 baseline), or if engines cannot express their facts in 12 primitive keys.
- **decision `host-grades-module-answers`**: a module `claim` never becomes evidence alone.
  - Reverse if T2 claim-versus-host agreement is ≥ 0.99 over 500 answers and re-grading costs latency the child notices.

---

## Sources

- Chromium Site Isolation (Android ≥ 2 GB RAM for login sites; "not yet supported in Android WebView") — https://www.chromium.org/Home/chromium-security/site-isolation/ [V]
- MDN `<iframe>` (sandbox tokens, the `allow-scripts` + `allow-same-origin` warning, `allow`, `srcdoc`) — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe [V]
- W3C CSP Level 3 (directives unsupported in `<meta>`: `report-uri`, `frame-ancestors`, `sandbox`; self-origin for opaque-origin documents; `'wasm-unsafe-eval'`; no `navigate-to`) — https://www.w3.org/TR/CSP3/ [V]
- MCP Apps spec 2026-01-26 (double-iframe sandbox proxy, "Host and the Sandbox MUST have different origins", `ui/initialize` … `ui/resource-teardown`, `connectDomains`/`resourceDomains`, default CSP) — https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx [V]
- Capacitor `BridgeWebChromeClient.onPermissionRequest` (grants by resource, no origin check) — https://github.com/ionic-team/capacitor/blob/main/android/capacitor/src/main/java/com/getcapacitor/BridgeWebChromeClient.java [V]
- Azure Storage static website ("no way to configure headers"; use CDN or Front Door rules) — https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website [V]
- Azure AI Content Safety regions, limits and language availability — https://learn.microsoft.com/en-us/azure/ai-services/content-safety/region-availability (redirect target of `/language-support`) [V]
- WCAG 2.2 Understanding 2.3.1 (general and red flash thresholds; PEAT, Harding) — https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html [V]
- EA IRIS photosensitivity analysis (BSD-3-Clause; luminance, red and pattern detection on video) — https://github.com/electronicarts/IRIS [V]
- Chrome DevTools throttling (calibrated low-tier and mid-tier mobile CPU presets) — https://developer.chrome.com/docs/devtools/settings/throttling [V]
- Playwright Android (experimental; adb; Chrome ≥ 87; `device.webView()`) — https://playwright.dev/docs/api/class-android [V]
- PhET-iO data stream (`phetioID`, `type` user/model/wrapper, `index`, `children` causality; state get/set) — https://phet-io.colorado.edu/devguide/ [V]
- H5P xAPI (`H5P.externalDispatcher.on('xAPI')`; verbs attempted/answered/completed/progressed; no cross-origin tracking) — https://h5p.org/documentation/x-api [V]
- zod 4.6.5 source, `v4/core/util.js:218-230` (`allowsEval` probe; jitless note on CSP violations) — `node_modules/zod` [V]
- Repository code read this session: `shared/contracts.ts`, `src/modules/host.tsx`, `src/modules/frame/{bootstrap.tsx,protocol.ts,params.ts,registry.ts,engines/fractionBars.tsx}`, `src/lesson/{moduleChannel.ts,moduleEvents.ts}`, `server/serve.mjs`, `server/director/classify.js`, `server/routes/lesson.js`, `vite.config.ts`, `modules.html`, `tests/client-e2e.mjs` [V]
- Probe: `docs/research/content/sandbox-probe.mjs` → `sandbox-probe-2026-10-02.json` (run: `node docs/research/content/sandbox-probe.mjs --axe <axe.min.js>`) [M]


---

## Engineering review

**Reviewer stance:** senior frontend/game engineer. Scope: can each component and each engine this document names be built in React/TS + canvas/SVG in 2 days or less, does it hold 60 fps on a ₹10k Android (about 3 GB RAM, Helio G35 / Unisoc T606 class, Mali-G52 or PowerVR GE8320), are the params and events enough for the teacher, and is it safe. Evidence tags as above; **[R]** means checked in the repository during this review, **[U]** unverified. Nothing here was run on a device.

### E.1 Verdict

The security and protocol design is sound and mostly buildable. Five things need fixing before it is treated as a spec:

1. **Part of the document is already stale against the tree [R].** `server/serve.mjs` already sends `access-control-allow-origin: *` on `/assets/*`, and `host.tsx` already counts iframe `load` events and kills on the 2nd. `host.tsx` already creates a `MessageChannel`. TL;DR #2 ("production does not boot the module frame") and §8 P0 items 1 and 3 describe a past tree. What is still open from them: the §3.1 headers on `modules.html` (today the header is only `sandbox allow-scripts; frame-ancestors 'self'`), `Permissions-Policy`, an e2e check through `serve.mjs`, and the message size and rate caps.
2. **The CSP in §3.1 and the shipped meta CSP disagree.** `vite.config.ts` has `media-src 'self' blob:` and `worker-src 'none'`. §3.1 has `media-src 'none'` and `worker-src blob:`. Decide per tier. Use `worker-src 'none'` for T0/T1, which need no workers. Use `blob:` only for the T2 frame variant that runs heavy sims. Keep `media-src 'none'` only if no engine plays its own sound; the host-owns-audio decision supports that.
3. **The residual "keep the frame data-poor" is contradicted by `InitCtx.displayName`.** The navigation channel (P6) is the one exfiltration path no CSP closes, and the request is sent before the kill. Do not pass `displayName` into T2/T3 frames. The host draws the name in an overlay, or the frame receives a token that only the host substitutes.
4. **Line reference.** `classify.js:167` is now around line 213 (`moduleAnswer.correct` → `done(..., "module")`) **[R]**. The fix is still needed. T0/T1 are safe only after the host grades.
5. **`restore{hash}` cannot work as written.** An FNV hash is one-way. Restore needs a serialisable state blob that the host holds. That blob can exceed the 8,192-byte message cap, so the cap needs a per-kind exception (see E.3).

### E.2 Feasibility and cost per component (S ≤ 0.5 d, M = 1–2 d, L = 3–5 d, XL > 5 d)

| component | in 2 days? | estimate | notes |
|---|---|---|---|
| Headers on `modules.html`, `Permissions-Policy`, serve-through e2e | yes | **S** | Mostly done (E.1). Only the full CSP header and one e2e boot through `serve.mjs` remain. |
| `host.tsx` caps: size, token bucket, flood kill, denylist | yes | **S** | Load-kill already shipped **[R]**. Remaining logic is about 60 lines plus fake-timer tests. |
| Frame bootstrap hardening: `RTC*` deletion, `securitypolicyviolation`, longtask, `freeze` scheduler | yes | **S** | The kit scheduler wrapping rAF and timers is the only non-trivial part. Engines must use it, so enforce it with lint (V14). |
| Bridge v2: envelope, port, hello/ready/ack/seq, hand-written parsers shared by frame, host and Node, v1 compat, replay | borderline | **M** (2–3 d) | The parsers are small. The cost is the migration: four dialects to map (§4.5), the existing `fraction-bars@1` and `moduleEvents.ts` tests, plus the `state_diverged` path. Do not add a second protocol version beyond v2 while migrating. |
| `observer@1`: ledger, coalescing, 8 detectors, fold/milestone router | yes | **M** (2 d) | Pure functions over an event window. Cheap to test with fake timers. |
| Talk gate (§5.5) wired to the realtime session | no | **M–L** (2–3 d) | Depends on audio start/stop events **[S]**. They exist on the WebRTC transport. Check which transport the app really uses. On a WebSocket transport the client must track its own playback clock. Needs a spike first. |
| Manifest additions `facts`/`caps`/`emits`/`budget` | yes | **S** per engine | Declarative. |
| Manifest `solve(spec)` and `lint(spec)` per engine | **no, hidden cost** | **S–L per engine** | `solve` is a second implementation of each engine's goal logic. S for fractions, number-line and balance. L for geoboard, geo-construct, circuits, ecosystem and any exploratory sim with no unique solution. This is the biggest unbudgeted line in the document (about 42 engines across the maths and science maps). See E.5. |
| Harness V1–V4, V6, V7, V8, V10–V12 (Playwright) | yes | **M** (3 d total) | P13 and P15 measurement code can be reused. |
| V5 solver replay as real pointer input | depends on `solve` | **M** + per-engine | Drag replay on SVG is flaky without waiting on `ack`/state; script on facts, not on sleeps. |
| V9 photosensitivity | no | **M–L** | `Page.startScreencast` frame rate is not guaranteed under CPU throttling, and 30 fps sampling is the floor for a 3-per-second flash test. Either drive time deterministically (virtual time / `HeadlessExperimental.beginFrame`) or record at a fixed rate and discard runs whose frame timestamps have gaps. IRIS integration is extra. |
| V13 content safety incl. Hinglish blocklist data and image/vision critique | no | **L** | The API wiring is S. The labelled Hinglish set (S-M5) and the versioned Devanagari + romanised blocklist are the real work. |
| V14 acorn AST bans and loop-guard transform | yes | **M** | Loop guards must not wrap code inside the kit itself. Counting iterations rather than time avoids false kills on a slow phone. |
| V15 real-device lane (`_android`, adb) | no | **L** setup, then ongoing | Experimental API, device flakiness, debug-flavour APK. Budget a day per month of maintenance. |
| Capacitor `onPermissionRequest` origin check | borderline | **M** | `BridgeWebChromeClient` is created inside the Capacitor bridge. A subclass is not a one-line change: it means a custom `Bridge` hook, a plugin, or a patch of the library **[U, verify against the pinned Capacitor version]**. |
| Capacitor `shouldInterceptRequest` allowlist | borderline | **M** | Same constraint on `BridgeWebViewClient`. Whether it sees subframe navigation is S-M2. |

### E.3 Protocol corrections (params and events)

**Params (host to module)**

- **Add `set_params{values: Record<string, Prim | Prim[]>, atomic: true}`.** The 100 ms coalescing rule collapses repeats of one name only. A teacher tool call that sets up a scenario (mass, medium, start state) as several `set_param` calls produces intermediate states the child can see, and engines whose params are interdependent (clamps that depend on another param) can reject the first call. Atomic apply plus one `ack` fixes both.
- **`ack` needs the time the change became visible.** Add `applied_t` (frame clock after the next rAF) so teacher-visual sync (`teacher-visual.md`) can anchor speech to the actual paint, not the command send time. The ack already reports clamping.
- **`init.replay` needs compaction.** Replaying a long command history at 6× CPU on a re-mount is slow and diverges when any command was clamped differently. Replace history by `restore{blob}` once the history passes a threshold (suggest 50 commands or 4 KB), where `blob` is an engine-defined state snapshot, canonical JSON.
- **Message cap.** 8,192 bytes is fine for events. It is too small for `init` (a `scene@1` spec is routinely larger) and for state blobs. Keep 8 KB for module to host events and set a separate cap for `init`, `restore` and `state{blob}` (suggest 64 KB, still rate-limited and never forwarded to a model).
- **State hash tolerance.** `state_diverged` compares FNV hashes across a re-mount, possibly after a WebView update. Quantise floats (for example 1e-4) before hashing, or sims will report false divergence and reset needlessly.
- **Sufficiency of `set_param` for LLM control.** `Prim | Prim[]` with engine clamping is enough for T1, provided the manifest also exports each param's `min/max/step/enum` to the Director prompt as a compact shape (not sentences). The document defines clamping but not how the LLM learns the legal ranges. That belongs in the manifest `params` table, generated into the prompt.

**Events (module to host)**

- **`progress.distance` is not defined for exploratory engines.** The `circling` detector and the "hint opportunity" depend on a monotone distance to a goal. Optics, ecosystem, water-cycle and any open exploration have no goal distance. Make `progress` optional per goal and have the host skip `circling` when it is absent. Otherwise the detector is silently dead for roughly a third of the science engines.
- **Missing: missed-target taps.** Add a derived fact `miss` (taps that hit no interactive element, per window). For B1–B2 this separates motor or UI trouble from a concept error, and costs about 5 lines in the kit's pointer layer.
- **Missing: exposure.** The teacher may say "look at the left bar" while that region is off-screen or occluded. Add `visible{target, on}` from an IntersectionObserver-style check in the kit, folded, never a milestone. Without it the teacher can credit attention that did not happen.
- **Missing: hesitation before commit.** `latency_ms` and `changes` exist. Add `first_touch_ms` (first interaction after the probe opened) so deliberation time and reading time separate.
- **Facts budget.** 12 primitive keys of at most 24 characters are enough for the examples (`fractions`, `particles`, `optics`). Engines with vector state (geoboard polygons, circuits) must emit derived facts (`area`, `closed`, `loop_count`) and never positions. State this in the manifest guidelines, or authors will hit the cap and start packing JSON into strings (which the enum rule then correctly rejects).
- **Latency of the reaction.** Milestone path is hold (1.2 s) + Director + response, so 2–3 s after a success. Young children expect an instant reaction. T0 engines must give their own immediate non-verbal feedback (sound request + animation) and the teacher's speech follows. Say so in the engine contract, otherwise the engine will wait for `verdict`.

### E.4 Performance on a ₹10k Android

- **P13 and P15 are desktop numbers under uncalibrated 6× throttling.** They prove the protocol is cheap. They do not prove 60 fps. A Cortex-A53 class core is closer to 8–12× a modern laptop for JS parse and layout, and the GPU is far weaker; treat V10's p50 ≤ 33 ms frame interval as the real gate and expect it to fail first on SVG-heavy engines.
- **Do not render animated engines through React reconciliation.** Keep React for the frame shell and controls (tiles, buttons). Per-frame drawing for particles, optics rays, motion, water-cycle and ecosystem goes imperative into one `<canvas>` (2D) or a small fixed set of reused SVG nodes. Add this to the engine rules: no setState inside rAF.
- **Rules to add to `budget`:** cap `devicePixelRatio` at 2 (1.5 on low-memory devices) and cap the canvas backing store (for example 1.3 megapixels); at most about 300 live SVG nodes (clamped in `resolveParams`); no filters, blur or shadow on moving elements; cap particle count by `deviceMemory` / a one-off 100 ms calibration loop; fixed dt (already in science §2.6) with an accumulator so a slow frame does not explode the sim.
- **Per-frame JS cost of React.** Each frame loads the 68.6 kB gz React runtime (about 220 kB parsed). V8 code caching across same-URL frames helps but is not guaranteed in WebView. For simple T0 engines (fraction bars, balance, number line) a framework-free build of about 10 kB gz is cheaper in parse time on slow cores; the budget `gzipKB` in the manifest already allows it. Decide per engine, not globally.
- **Memory.** The 1.0 MB per frame is JS heap only. Each extra iframe adds a document, layer tree and compositor memory that CDP `Performance.getMetrics` does not show. The "one animating frame, others frozen" rule is right; also unmount (not just hide) any pre-mounted frame that waits more than about 30 s.
- **WebGL.** `solids@1` with three.js: the 120 kB P0 budget does not apply (P2, lazy). Mali-G52 handles simple solids at 60 fps, but a sandboxed `allow-scripts` frame still creates a WebGL context, and context loss on low-memory devices must be handled (render a static fallback image). Keep it P2.
- **Heat and battery.** A 60 fps canvas loop for a 20-minute lesson throttles a cheap phone. Idle sims should drop to a render-on-change loop (rAF only while something moves), which also supports `freeze`.

### E.5 Safety review

- **Realm sharing between the kit and generated code (T2/T3).** The bootstrap, the port and the kit live in the same JavaScript realm as the generated code. Generated code can monkeypatch `MessagePort.prototype.postMessage`, `JSON.stringify` or `Object.prototype`, read bootstrap globals, or send forged `answer`/`goal_met`/`interaction` messages. Host re-grading (§4.6) protects evidence, but forged `interaction` facts and `goal_met` timings are still accepted. Mitigations: capture the port and primitives in a closure before any generated code runs; freeze the intrinsics (`Object.freeze` of prototypes) in bootstrap; give the generated code only a narrow `emit(name, facts)` handle; treat all T2/T3 facts as untrusted weights (the document already sets T3 weight to 0).
- **Channels the leak battery did not cover.** Add to `sandbox-probe.mjs` before declaring "0 of 8" complete **[U, not tested here]**: `<link rel=dns-prefetch>` and `rel=preconnect` (DNS lookups of attacker-chosen subdomains carry a few hundred bytes and are not governed by `default-src`); a Blob Worker's own capabilities, since P5 only covered the window; `WebTransport`; `navigator.serviceWorker` registration (should be blocked by opaque origin, but measure). If dns-prefetch leaks under the strict policy, the V14 AST ban and a `<head>` mutation watcher are the remaining defences.
- **Name in the frame.** See E.1 item 3.
- **Hindi blocklist ownership.** The Content Safety limitation for Hindi (§7.3) means V13 is mostly the in-house blocklist for the first release. Treat it as a deliverable with an owner, a versioned file and a recall test, not a footnote.
- **Capacitor fallbacks.** If the APK serves `modules.html` from local assets, response headers (CSP, `Permissions-Policy`, `sandbox`) cannot be set. The APK build must therefore rely on the meta CSP, the iframe `sandbox`/`allow` attributes and the native allowlist together. Add a V4 variant that runs against the APK-style static server with no headers.
- **Photosensitivity** is correctly a hard gate, but T0 engines with confetti or particle bursts on success are the likely offenders. Cap burst animations by rule (for example no more than 2 full-frame luminance changes per second) in the kit, not only in review.

### E.6 Build-cost estimate per engine named in this document

| engine | estimate | 60 fps risk | params / events enough? | notes |
|---|---|---|---|---|
| `fraction-bars@1` | shipped; fix axe **S** | low | yes | Replace `role="img"` wrapper by `role="group"` with `aria-label`. Re-run V7. |
| `particles@1` (science) | **M** (about 2 d) | medium (canvas 2D, ≤ 300 particles is fine; SVG is not) | params yes (`T_C`, phase, `medium`); needs a canonical `phase` fact enum and `plateau` derived in the engine | A simple Brownian + spring model is enough. Do not try physical accuracy. |
| `optics@1` | **M** (about 2 d) | low (few rays, analytic geometry) | needs explicit `angle_i`, `angle_r` facts and a `law_met` bool so the teacher can see a prediction vs result | Keep to plane mirror, pinhole, shadow. Refraction in a medium doubles the cost. |
| `money@1` | **M** | low | yes | Cost is art (notes and coins as inline SVG, 6 denominations) and drag/snap targets at 64 dp for B1–B2, not logic. |
| `scene@1` (renderer + solver + lint) | **L** (4–6 d) | medium | `vars` answers are re-graded by the host evaluator, good; add a per-scene node cap and a step cap in the evaluator | The DSL and pure solver exist (`genui-scene-dsl.mjs`); the frame renderer, primitives, accessibility and V5 replay are the work. |
| `solids@1` (three.js) | **L** | high on low-end | n/a | Keep lazy P2. |
| Forge T2 games | **XL** (platform, not one engine) | variable | host-graded `expect` | Not buildable in 2 days; the verify pipeline (V1–V14) alone is the critical path. |

Totals for the infrastructure in §8: P0 about 1.5–2 days; P1 (bridge v2, observer, manifest changes, harness V1–V12) about 8–10 days; P2 (native layer, V13–V15) about 8–12 days, with the Hinglish blocklist and device lab dominating.

### E.7 Corrections to apply to the document

1. Rewrite TL;DR #2 and §8 P0 items 1 and 3 to the current tree: ACAO on assets and load-kill are shipped. Keep the open items (full header set, `Permissions-Policy`, serve-through e2e, caps).
2. Reconcile the §3.1 CSP with `vite.config.ts` (`media-src`, `worker-src`) per tier.
3. Remove `displayName` from T2/T3 `InitCtx`, or state that it is host-substituted.
4. Replace `restore{hash}` by `restore{blob}`; add a per-kind message cap; add replay compaction.
5. Add `set_params` (atomic) and `ack.applied_t`.
6. Make `progress` optional; add `miss`, `visible` and `first_touch_ms` facts.
7. Add the realm-hardening rule for T2/T3 (closure capture, frozen intrinsics).
8. Extend the P1 leak battery with `dns-prefetch`, `preconnect`, Worker, WebTransport and service worker, before the "0 of 8" claim is reused.
9. Add canvas-for-animation and node/pixel budgets to `budget`; forbid React state in rAF.
10. Budget `solve(spec)` per engine explicitly, and let V5 fall back to recorded golden scripts where no solver exists.
11. Correct the `classify.js` line reference (now about line 213). Keep the desktop-Chromium numbers labelled as proxies until S-M3 and V15 have run.
