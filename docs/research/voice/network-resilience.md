# Network resilience for the live voice teacher (gap-fill G3-network-degradation, 2026-10-02)

**Scope.** What the child hears and sees, and what the director does, when the network between an Indian phone and
`taxila-realtime` (gpt-realtime-2.1, eastus2) is degraded, stalls or drops during a lesson. This file is binding on
the voice client (`src/lesson/link.ts`, the `LinkSupervisor` of `design/low-end-offline.md` §7.4), on the director's
resume path and on VOICE-TEACHER §1.3 and §11. It **adds a per-call state machine inside a rung**. It does not
replace the transport ladder L0-L4 in `low-end-offline.md` §7, and it is reconciled with that ladder in §3.4.

**Evidence tags** follow VOICE-TEACHER: **[M]** measured this session (n given), **[T]** measured earlier in Taxila,
**[H]** inherited, **[S]** published source, **[I]** invented starting value, **[U]** unverified. No [I] number is a
ship gate.

**Authoring law.** Nothing below is a line the teacher or the app voice could say. Notices are named by function. The
wording of the app-voice notices is pre-rendered, vetted copy owned by the copy gate, never written into a prompt.

**What could and could not be measured here (read first).**
- **tc-netem could not run.** This container's kernel is built without `CONFIG_NET_SCH_NETEM` (`/proc/config.gz`:
  `# CONFIG_NET_SCH_NETEM is not set`), and `iproute2` is absent. The sandbox also carries no UDP (the 2026-10-02
  `evals/webrtc/` run reached `/realtime/calls` 201 and then failed ICE [T]).
- **The WebSocket path was measured** through a user-space TCP impairment layer that every TLS byte passes through
  (`netsim.mjs`, §6.1). It reproduces delay, jitter, loss-driven retransmit stalls with head-of-line blocking, and
  outages, as TCP experiences them. It is a model of the kernel's behaviour, not the kernel, and it is labelled so.
- **The WebRTC path was not measured.** Its rules below are from the protocol and published semantics [S] and are
  [U] until VT-11 (§8) runs netem on a Linux router in front of real Android phones.

---

## 0. On one screen

| # | decision | why |
|---|---|---|
| 1 | **Five call states inside every rung:** healthy → degraded → stalled → reconnect → text/tap fallback. The client owns detection; the director owns every word said after a stall. | Nothing in the spec said what a child hears during a stall (G3). |
| 2 | **Silence never lasts unexplained.** Stall cue on screen at 1.5 s without expected bytes; an app-voice notice (pre-rendered, never the teacher) at stalled + 3 s; text/tap fallback at 8 s (lesson-arc §11). [I] | An unexplained gap is an `unheard` rupture (VOICE-TEACHER §7.4). Gaps over ~700 ms already read as trouble (HL §2) [S/U]. |
| 3 | **Heard-only context, always.** After any stall the interrupted teacher item is truncated to the audio the child actually heard (`conversation.item.truncate`, `audio_end_ms` from the playout clock), and a reconnect re-seeds only heard text. | The server deletes unheard transcript on truncate [S]. HL L2: never refer back to unheard words. |
| 4 | **After a stall the director, not server VAD, creates the next response.** `create_response:false` before anything else, `input_audio_buffer.clear`, then held child audio as one item, then one `response.create` with a resume note. Auto-response comes back after that response is done. | Stops the duplicate reply and the reply to stale audio (§6.3). |
| 5 | **Child audio captured during a stall is held locally, never graded, always safety-scanned.** It goes to both ASR lanes before the resume. A turn whose audio was lost or delayed is `unattributed`/`no_evidence`, never a miss. | Safety runs on the union of lanes (VOICE-TEACHER §0 #7). A lost answer is not a wrong answer. |
| 6 | **On a reconnect, mint a fresh 60 s ephemeral key per connection** and treat keys as single-use in our own SDP/relay proxy. | Measured: an expired key never ends a live session, but a valid key opened a second session (3/3) [M]. |
| 7 | **The WebSocket rung plays out what it already holds.** A WS reply arrives in a burst, far faster than real time [M], so an outage after the first ~1 s of a reply is inaudible downstream. Only the uplink suffers. | §6.2. This is a reason the L1 relay is a strong rung on lossy networks, not only a UDP fallback. |
| 8 | **India-to-eastus2 RTT is ~230-380 ms on mobile, not 21 ms.** Every think-time and stall timer is stretched by measured RTT, and VT-2's 3 s answer-state TTFA bar must be tested from India. | TRAI IDT access latency + RIPE Atlas India→Virginia [S/M] (§1). |

---

## 1. What Indian mobile networks look like

### 1.1 TRAI Independent Drive Tests (published May-September 2026) [S]

TRAI's IDT reports drive and walk-test every operator with instrumented handsets and publish per-LSA summary tables.
Eight recent reports were downloaded and read (Delhi July 2026, South Delhi July 2026, Mumbai June 2026, Tamil Nadu
July 2026, Madhya Pradesh June 2026, Bihar/Dumka June 2026, North East May 2026, Assam August 2026). Column order in
each table is Airtel · BSNL (MTNL in South Delhi) · Jio (RJIL) · Vi (VIL).

| metric (TRAI definition) | Airtel | BSNL/MTNL | Jio | Vi | across 8 LSAs |
|---|---|---|---|---|---|
| **Data latency, p50, ms** (TWAMP-UDP, 42-byte payload, to the operator's or a TRAI test server inside India) | 25.6-60.4 | 21.0-60.8 | 16.3-61.3 | 13.4-55.4 | **13-61 ms** |
| **VoLTE RTP jitter, ms** (RFC 3550 inter-arrival jitter, mobile-to-mobile calls, 4G/5G) | 3.4-6.1 | 5.0-11.4 | 7.7-18.0 | 4.5-17.3 | **3-18 ms** |
| **RTP packet loss, downlink %** | 0.25-1.80 | 1.77-7.41 | 0.34-3.38 | 0.36-5.79 | **0.25-7.4%** |
| **RTP packet loss, uplink %** | 0.21-2.14 | 1.35-4.12 | 0.16-2.28 | 0.32-8.17 | **0.16-8.2%** |
| **Calls with a silence > 3 s** (count per LSA drive) | 3-25 | 2-76 | 0-20 | 1-84 | silences of 3 s+ are routine on every operator |
| **Drop call rate %** (auto-select mode, where tabled) | 0.0-1.75 | 2.6-52.7 | 0.0-2.9 | 1.5-2.3 | private operators ≤ 2.9% |

Examples from single tables: Delhi July 2026 data latency p50 Airtel 48.2 / BSNL 28.9 / Jio 22.4 / Vi 32.8 ms, RTP
loss DL 1.70 / 5.43 / 1.89 / 1.66%; Bihar (Dumka) June 2026 Vi RTP uplink loss 8.17% and 84 silence instances over
3 s; North East May 2026 latency p50 53.6-61.3 ms on every operator.

**Read.** Access latency inside India is small (13-61 ms p50 to an in-country server). Loss is the problem: 1-2% is
normal on the private operators and 5-8% occurs in whole LSAs (Bihar, North East, BSNL everywhere). Multi-second
silences happen on every operator. These are carrier-grade VoLTE figures on good handsets, so app-level WebRTC on a
4 GB phone indoors will be worse, not better [U].

### 1.2 India → Northern Virginia (eastus2 is Boydton, VA) — RIPE Atlas, 24 h ending 2026-10-02 [M]

The RIPE Atlas anchoring mesh pings every anchor from every other anchor every 240 s. The 24 h of results from the
9 connected Indian anchors (Bangalore, Mumbai ×2, Delhi, Chennai, Guwahati (BSNL), Mangalore, Surathkal, Srinagar)
to 4 Ashburn/Herndon anchors were pulled from the public API (`atlas.py`; n ≈ 1,000-1,080 pings per probe-target pair).

| | value |
|---|---|
| median RTT per Indian anchor → Virginia anchors | **200-322 ms** (centre ~260 ms) |
| p95 − median | 0-60 ms (wired paths are stable) |
| loss | 0-0.4% on most; **1.0-3.7%** on the BSNL Guwahati anchor and on the Delhi/Mumbai/Srinagar ones in some hours |

**Caveat.** Anchors sit in data centres and on fixed lines. Of the 150 connected Indian Atlas probes, none is on a
mobile-only ASN (Airtel mobile AS45609 is absent; Jio AS55836 mixes fibre and mobile). So these are the
**backbone floor**, not phones.

### 1.3 The planning number [I, from §1.1 + §1.2]

India mobile → eastus2 RTT ≈ access p50 (13-61 ms) + backbone (200-320 ms) ≈ **230-380 ms**, with loss of 0.3-2%
typical and 5-8% in bad LSAs, multi-second silences, and handovers. That is 11-18× the 21 ms WS ping RTT measured from
the US build container (§6). The VT profiles (§6) bracket it: P1 adds 150 ms ± 50 ms (the brief's profile), P4 adds
260 ms ± 50 ms with 1% loss (the Atlas centre).

**Not obtained.** Opensignal's India reports (insights.opensignal.com) returned HTTP 403 / a bot challenge to every
fetch, and the web-search budget was exhausted by sibling workstreams, so no Opensignal or Ookla figure is cited.
`design/low-end-offline.md` §1 already carries Russell's India P75 (85 ms RTT, 2.1 Mbps up) [S]; that RTT is to a
nearby CDN, not to eastus2.

---

## 2. What the protocol gives us

| fact | source | consequence |
|---|---|---|
| WebRTC: "the server manages a buffer of output audio … will automatically truncate unplayed audio when there's a user interruption." WS: "the client manages audio playback, and thus must stop playback and handle truncation." | OpenAI realtime-conversations guide [S] | On WS the client's playout clock is the only source of `audio_end_ms`. |
| "Truncating audio will delete the server-side text transcript to ensure there is not text in the context that hasn't been heard by the user." | OpenAI realtime reference, `conversation.item.truncate` [S] | Truncate is the heard-only mechanism on the same session. A new session needs heard-only text built by us. |
| `output_audio_buffer.clear` (WebRTC/SIP only) "should be preceded by a `response.cancel`". | OpenAI realtime reference [S] | WebRTC stall exit: cancel, then clear. |
| "The maximum duration of a Realtime session is 60 minutes." | OpenAI realtime-conversations guide [S]; Azure measurement in §6.5 | Rotation for 45-60 min lessons uses the same re-seed path as a reconnect. |
| Client secret `expires_after.seconds` 10-7200, default 600. "The session itself may continue after that time once started." | OpenAI client_secrets reference [S]; confirmed on Azure §6.4 [M] | Key expiry mid-lesson is harmless to the live call and fatal to a reconnect that reuses the key. |
| "WebSockets aren't recommended for real-time audio streaming because they have higher latency than WebRTC." Realtime global deployments: East US 2 and Sweden Central. | Azure WebRTC how-to (updated 2026-09-23) [S] | No Indian region for this model. RTT is structural. |
| `restartIce()`: "Existing media transmissions continue uninterrupted during this process." | MDN [S] | First WebRTC repair is an ICE restart on the same session, not a new session. |
| No documented session resume. A new WS or peer connection is a new session with an empty conversation. | absence in the OpenAI and Azure references [S] | Continuity after a drop is entirely the director's re-seed. |
| Re-seeding works: `conversation.item.create` with user `input_text` and assistant `output_text` items, then `response.create`, on a fresh session minted from a new ephemeral key | §6.3, 10/10 [M] | The resume path is buildable today. |

---

## 3. The call state machine

### 3.1 States

Signals: `lastByte` (any downlink byte: events, audio, WS pong or data-channel message), `expecting` (a child turn has
ended or a response is in flight), the playout clock, `getStats()` on WebRTC (`roundTripTime`, `fractionLost`,
`jitter`, concealment ratio; the names and green/amber/red thresholds of `low-end-offline.md` §7.4), and Android
`ConnectivityManager` callbacks (`onLost`, `onAvailable`, a change of network handle = handover).

| state | enter when | the child hears | the child sees | mic | director / client actions |
|---|---|---|---|---|---|
| **healthy** | default; RTT, loss and concealment in §7.4 green | the teacher | the normal four states | open | none |
| **degraded** | §7.4 amber for a 6 s window, or ≥ 2 playout underruns ≥ 50 ms in a turn, or RTT p50 > 400 ms | the teacher, behind a larger jitter buffer (WS 300 → 600 ms; WebRTC is NetEQ-adaptive) | a quiet link cue (neutral colour, no `stop`/`turn` tokens; `low-end-offline` #15) | open | stretch every think-time window and the stall timer by measured RTT; pre-open the L1 relay socket; prefetch the item's L3 clips; mark any turn whose uplink concealment > 8% `low_confidence` |
| **stalled** | `expecting` and no downlink byte for **1.5 s** [I]; or `onLost`; or ICE `disconnected` | buffered teacher audio keeps playing to its end (it is real, heard speech), then silence | the stall cue (her face holds a listening pose; a neutral network glyph); after **stalled + 3 s** [I] the **app-voice notice** plays once | **held locally** (not sent), with the last 1.5 s of already-sent audio copied into the hold buffer | stop counting think time; no grading clock runs; no hint ladder advances |
| **reconnect** | stalled ≥ 2.5 s with 2 unanswered pings, or the socket/peer closes, or ICE `failed`, or `onAvailable` with a new network handle | silence or the notice; never a second teacher voice | the stall cue continues | held | WebRTC: `restartIce()` first (keeps the session). Otherwise: wait for `onAvailable`, mint a fresh key, open a new session with `create_response:false`, re-seed heard-only context (§4.2), resume |
| **text/tap fallback** | stalled or reconnect for **8 s** [I] (lesson-arc §11), or 3 reconnects in 5 min, or the reconnect fails twice | the L3 recorded clip for the current item in her voice (`low-end-offline` §7.6), never live speech | the item as chalk text with tap choices; the `recorded` badge | closed | the director continues the lesson on `TextLink`; the voice rung is retried at the next phase boundary under §7.4 `recover` rules |

**Exits.** Stalled → healthy if bytes return before 2 s total silence (playout continues; nothing is said). Stalled
→ resume-on-same-session if bytes return later (§4.1). Reconnect → healthy after the resume response is done.
Fallback → healthy only at a phase boundary after 60 s green (the §7.4 `recover` rule). There is no exit from any
state that re-plays a teacher turn in full.

### 3.2 Who speaks in a stall: the app voice, not the teacher

The notice is the **app voice** (the one that gives the AI disclosure at open and the session-cap notices,
VOICE-TEACHER §1.2), pre-rendered and played locally. This **refines** `low-end-offline.md` #15 ("said by a
pre-rendered clip in her voice") for the live-call case:
- while the link is down the teacher is not there, and a pre-rendered clip in her voice would claim a presence she
  does not have, then be followed by the live model, which never heard it;
- the app voice is the channel for facts about the call (disclosure, time, connection), so the teacher's voice stays
  the channel for teaching only;
- the L3/L4 rungs still use her recorded clips, because there she is the content's narrator, not a live presence.
- **Owner decision O-G3-1:** confirm this split, or keep the teacher-voice clip everywhere (reversal: a
  child-panel ABX in which children read the app-voice notice as "someone else took over").

The notice states one function: the line is weak, the teacher has not gone, nothing is the child's fault, and wait or
use the screen. It never names the family's phone or data pack. Its copy passes the copy gate in both scripts.

### 3.3 Timers and why [I]

| timer | value | reasoning | measured input (§6) |
|---|---|---|---|
| stall detect | 1.5 s without a byte while expecting | WS pings every 500 ms; at P3 (5% loss) the longest normal byte gap was below it (0 false stalls in 24 turns) | §6.2 false-stall row |
| app-voice notice | stalled + 3 s (≈ 4.5 s of silence) | the child's own "hello?" comes at about 2-3 s of dead air; a notice before ~3 s collides with a recovering link | P5 notice fired at 4.5 s after outage start in 20/20 outages; the link was back at 5.0-5.6 s |
| stale threshold | > 2 s of total stall → truncate + resume | beyond ~2 s the unplayed remainder of the reply no longer follows on from what the child last heard | P5n vs P5p |
| reconnect attempt | stalled ≥ 2.5 s with 2 missed pings, or a closed socket, or `onAvailable` | a TCP session survives a 5 s outage; reconnecting too early pays ~3 s of setup for nothing | P5p vs P6 recovery |
| fallback | 8 s | lesson-arc §11 | — |
| every timer | × (1 + RTT/1 s) in degraded | RTT 230-380 ms from India | §1.3 |

### 3.4 Reconciling with the transport ladder (`low-end-offline.md` §7)

The ladder says *which transport* (L0 WebRTC, L1 WS relay, L2 walkie-talkie, L3 text + clips, L4 offline). The state
machine says *what happens inside a call on any rung*. Mapping: §7.4 green = healthy; amber = degraded; red = degraded
plus "step down one rung at the next turn boundary"; dead = stalled → reconnect, where the reconnect may land on the
next rung down (L0 → L1) instead of the same one. Text/tap fallback = L3. Both documents' 8 s fallback agree.

### 3.5 Resume after a long drop (lesson-arc §11)

lesson-arc §11 says a dropped call "resumes at the current phase's start with one recap turn". That stays the rule
for a **long** drop (fallback reached, the app backgrounded, or the session gone more than 60 s). A **short** stall
(< 8 s, same item) resumes at the heard point (§4). The director picks by the measured stall length, and never both.

---

## 4. The resume protocol (what is re-sent, in order)

### 4.1 Same session (TCP survived, or WebRTC ICE restart succeeded)

1. `session.update` → `turn_detection.create_response:false` (before anything else, so stale child audio cannot
   trigger a reply).
2. `response.cancel` (harmless if the reply is already done).
3. WS: stop local playout of the stale remainder, then `conversation.item.truncate` {item_id, content_index 0,
   `audio_end_ms` = played ms from the playout clock}. WebRTC: `output_audio_buffer.clear` after the cancel; the
   server truncates itself.
4. `input_audio_buffer.clear`, so the fragment of child audio that reached the server before the stall cannot be
   committed twice.
5. If the held child audio contains speech: run it through both ASR lanes **first** (safety predicates, §5), then add
   it as one user `input_audio` item.
6. `response.create` with the **full** compile (VOICE-TEACHER §1.3) plus a RESUME note in the MOVE section. The note
   is a shape, not words: answer what the child said meanwhile first; otherwise continue from the last heard point in
   one short turn; never restart the turn or repeat heard words; at most one brief, blame-free acknowledgement; no
   mention of the child's device or data.
7. When that response is done: `session.update` restores the floor state's `create_response`.

### 4.2 New session (socket or peer dead, IP changed, session > 60 min)

1. Wait for `onAvailable` (or a 1 s backoff probe). Mint a fresh ephemeral key from our server (60 s TTL [I]) with the
   compile already inside, so the session starts with the floor and character.
2. Open the session with `create_response:false`.
3. Re-seed: the last 4-6 turns as text items (`low-end-offline` §7.4), child turns from the **agreed ASR lanes** only,
   teacher turns as **heard-only text**. For the interrupted turn, the heard text is the transcript cut at the playout
   clock: proportional to played/received audio when the reply was fully received, else played seconds ×
   words-per-second (estimator error median 372 ms [T teacher-visual-sync]). A trailing dash marks the cut.
4. Steps 5-7 of §4.1.
5. The old socket is terminated, and any event that arrives on it is dropped and logged as `orphan_event`.
6. Session-scoped flags (EA §7, emotion-attunement review item 7) are rebuilt from the director's state, never from the
   model's memory.

### 4.3 Duplicate and orphan guards

- **One in-flight response per child turn.** The director keeps `turnSeq`. A response created while another is in
  flight for the same `turnSeq` is cancelled unless it is the designed resume.
- **A response is "heard" only by the playout clock.** A `response.done` never marks a turn as delivered. Audio the
  client discarded counts as unheard everywhere (relationship, grading and the said-ledger).
- **No replay.** A reply is never re-played in full after a stall. Its remainder is either played on directly
  (stall < 2 s) or replaced by the resume.

---

## 5. Lost child audio: never a miss, never a missed safety turn

| case | how it is detected | grading | safety | what the teacher does |
|---|---|---|---|---|
| child spoke during a stall (held locally) | local energy VAD on the hold buffer | **ungraded** (`no_evidence`) | both ASR lanes on the held clip **before** the resume; any predicate → SAFETY floor state (VOICE-TEACHER §1.3) and the crisis route, not the resume | the resume answers it first (§4.1 step 5) |
| child audio delayed but delivered (TCP backlog) | the server commit arrives after `stalled` | ungraded | runs as normal on both lanes | no reply to stale audio: auto-response is off (§4.1 step 1) |
| WebRTC uplink loss burst during an answer | `getStats` uplink concealment > 8% or a gap in `packetsReceived` during the turn [U] | `unattributed` / `low_confidence`, never mastery evidence | union of lanes on whatever arrived; partial safety words still route | a teacher-owned re-ask: the line is blamed, never the child ("unheard" rupture prevention, VOICE-TEACHER §7.4) |
| speech_started with no usable transcript on either lane | lane disagreement or empty transcript | ungraded | a safety lexicon hit on either partial still routes | one re-ask. A second loss → the tap/text answer for this item |
| typed or tapped input during a stall | `TextLink` | graded as normal (it is real evidence) | the predicate runs on the typed text | the resume acknowledges the typed answer |

**Rule.** A turn lost to the network is the network's error. It never lowers mastery, never counts toward the
re-entry ladder, never feeds `safety` (safe-to-be-wrong) downward, and is logged as `net_loss` in `vy_rel_event` so an
`unheard` rupture can be attributed to the line, not to the teacher or the child.

---
