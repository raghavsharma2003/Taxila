# Face: what only a real low-end phone can tell us (round 7, stream D)

Everything below has been measured only in headless Chromium, using software GL (SwiftShader) and a CDP CPU throttle.
SwiftShader stands in for a weak GPU, not for a real Mali or PowerVR driver, a thermal limit or Android's memory killer.
This is the list to run on a real phone before we trust those numbers.

**Phone.** Pick the cheapest Android a family might hand a child (about ₹8–10k: a Mali-G52/G57 or PowerVR GE8320
class GPU, 3–4 GB RAM, Chrome stable). If an older iPhone is available, add Safari.

**Setup.** Connect the phone to a laptop and open `chrome://inspect` for remote DevTools. Use the deployed revision or
a tunnel to a production build. Add `?facerig=1` to any URL. That puts `window.__puppet` on the page, so you can read
`__puppet.log` (loaded, path, firstDraw, reveal, governor, fallback, stall) and `__puppet.snapshot()` (fps, work and
rig p95, dpr, fps cap, stalls).

## Checks

| # | Check | How | Pass | Desk number it confirms |
|---|---|---|---|---|
| 1 | **Lite gate decision** | Open Home with no flags, then read the `lite: …` reason in `__puppet.log`, or see that no canvas exists. | The decision matches the phone: a phone with real WebGL2 and no caveat gets the live stage, a phone with software raster gets the lite path. Record `staticTier` `why`. | The gate in `src/face-puppet/lite.ts` |
| 2 | **Worker rig path** | Look at the `loaded` event's `path`. | `worker-bitmap` for r8 (OffscreenCanvas WebGL2 in a worker). If it says `bitmap`, the main-thread path was used: write down why from the `fallback` log line. | Worker rig: long tasks 2.28 s → 1.30 s at CPU ×6 |
| 3 | **Hand-off on Start** | Let Home settle for at least 5 s, tap Start, and watch the lesson's face when her first line starts. | The face is already moving when she speaks (no still poster fading over her voice). `__puppet` is the same object before and after Start. | `docs/design/round7/face/handoff-start.json` |
| 4 | **Start → first sound, face on vs off** | Run `evals/latency/start-phone.mjs` against the phone with remote debugging, or time it by hand from the DevTools Performance panel. Compare `?puppet=1` with `?puppet=0`. | On within ~300 ms of off at p50 (PIPELINE §D). | Desk: worker −35 ms vs off |
| 5 | **Light mouth** | Use a lite phone (or `?puppet=0`) during a lesson. | The mouth moves with her voice, never flickers faster than the hold, and closes in word gaps. | `lite-mouth-strip.png` |
| 6 | **Governor and heat** | Run a 15-minute lesson and read `governor` events and `snapshot()` every few minutes. | Steps down at most once or twice and never oscillates. No `fallback: slow` while the phone is cool. Note the phone's temperature at the end. | Governor rules in `stage.ts` |
| 7 | **Turn POST behind a frame** | Answer with your voice 10 times and read the turn POST timing in the Network panel. | No turn POST waits behind a puppet frame. The worker path has no turn hold. | Turn-first, main-thread path only |
| 8 | **App switch / context loss** | During a lesson, switch to WhatsApp for 30 s and come back. | Her face comes back (rebuilt once, or her still). It never shows another face, never stays blank, and the tab is not reloaded by the OS. | Context-loss path |
| 9 | **Parked hand-off memory** | On Home, open Map (not Start) and stay there for 15 s. | The parked worker is let go after 10 s (memory drops in `chrome://inspect` → Memory). Nothing visible happens. | `HANDOFF_PARK_MS` |
| 10 | **Daily greeting** | Open Home for the first time today and tap anywhere. | She speaks once, her lips move with the clip, then she glances at Start. A reload stays silent. Clips play only once rendered (owner spend). | `home-greeting-result.json` |
| 11 | **Kill switch** | On the deployed revision, set `TAXILA_FACE_PUPPET2D=0` and reload. | Her own still shows everywhere, with no swap to another face. | Server config |
| 12 | **lamp2 in the owner's account** | After the re-key, sign in as the owner. | lamp2 shows, with the jaw only when `?jaw=1`. Everyone else gets r8. | OWNER.md row 3 |

## What to record per phone

The phone model, GPU, RAM, Chrome version, the lite gate `why`, the `loaded.path`, the reveal time, fps p50 and work p95
at 1 and 10 minutes, any governor steps, any stalls, and whether the hand-off was adopted. Put this in
`docs/design/round7/face/real-phone-<model>.json` so it sits next to the desk numbers it confirms or overturns.
