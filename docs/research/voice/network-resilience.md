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
  (`network-g3/netsim.mjs`, §6.1). It reproduces delay, jitter, loss-driven retransmit stalls with head-of-line blocking, and
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
| 6 | **On a reconnect, mint a fresh 60 s ephemeral key per connection** and treat keys as single-use in our own SDP/relay proxy. An `Ephemeral token expired` error after the socket opens is a re-mint trigger, not a failure. | Measured: an expired key never ends a live session (3/3); a still-valid key opened a second working session (3/3); an expired key still **opens the socket** and fails only on the first request (3/3) [M, §6.4]. |
| 7 | **The WebSocket rung plays out what it already holds.** A WS reply arrives in a burst (median 3.2-5.0 s of audio inside the first 1 s, for replies of 7.5-9.5 s) [M], so jitter and 2-5% loss produced **0 audible gaps** at a ≥150 ms buffer in 54 turns. The cost lands on TTFA instead (§6.2). | This is a reason the L1 relay is a strong rung on lossy networks, not only a UDP fallback. |
| 9 | **A failed response is a stall.** `response.done` with `status:failed` (`inference_rate_limit_exceeded`) hit **28/112** responses in this session's runs, and one maths reply ended `incomplete: content_filter` mid-sentence [M]. Each is silence or a half-played reply to the child, so each enters the same ladder (§3.5). | The spec treated the network as the only cause of dead air. The deployment's token quota is a second cause, and it was the larger one today. |
| 10 | **The naive client is measurably wrong.** With auto-response left on through a 5 s outage, the server replied to the child's stale "are you there" audio in **4/4** cases, and every one of those replies told the child to check their mic or volume. The interrupted reply resumed after a **~4-5 s** mid-sentence gap in 8/8 [M, P5n]. | That is the `unheard` rupture with the blame put on the child's device: the exact inversion of VOICE-TEACHER §7.4. |
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

### 1.4 Opensignal (crowdsourced, real phones) [S, via search snippets]

Opensignal's report pages return HTTP 403 / a bot challenge to direct fetches, so these figures come from the search
index of the reports, not from reading the pages, and are tagged accordingly.
- **Voice App Experience** (OTT voice such as WhatsApp; an ITU-derived model over RTT, jitter and packet loss, 0-100),
  India, February 2026: Airtel 79.5, Vi 79.2, Jio 78.2, BSNL 74. Opensignal's bands put 74-80 at "Acceptable" (some
  users satisfied) and 80-87 at "Good" (minor impairments, occasional clicks or distortion). **No Indian operator
  reaches "Good" for app voice**, which is the class of traffic a WebRTC lesson is.
- **Games Experience** (latency, jitter and loss for real-time play), June 2025: Airtel 71.7, Vi 70.6, Jio 68.0, BSNL
  54.8; February 2026: the three private operators "Fair" (responsive with a noticeable delay), BSNL "Poor".
- Opensignal does not publish the underlying RTT, jitter or loss values per operator, so these scores set the
  direction (app-level real-time audio is impaired on every operator) and §1.1-1.2 set the numbers.

`design/low-end-offline.md` §1 already carries Russell's India P75 (85 ms RTT, 2.1 Mbps up) [S]; that RTT is to a
nearby CDN, not to eastus2.

---

## 2. What the protocol gives us

| fact | source | consequence |
|---|---|---|
| WebRTC: "the server manages a buffer of output audio … will automatically truncate unplayed audio when there's a user interruption." WS: "the client manages audio playback, and thus must stop playback and handle truncation." | OpenAI realtime-conversations guide [S] | On WS the client's playout clock is the only source of `audio_end_ms`. |
| "Truncating audio will delete the server-side text transcript to ensure there is not text in the context that hasn't been heard by the user." | OpenAI realtime reference, `conversation.item.truncate` [S] | Truncate is the heard-only mechanism on the same session. A new session needs heard-only text built by us. |
| `output_audio_buffer.clear` (WebRTC/SIP only) "should be preceded by a `response.cancel`". | OpenAI realtime reference [S] | WebRTC stall exit: cancel, then clear. |
| "The maximum duration of a Realtime session is 60 minutes." | OpenAI realtime-conversations guide [S]; Azure: `session_expired` at 60.01 min, §6.4 [M] | Rotation for 45-60 min lessons uses the same re-seed path as a reconnect. |
| Client secret `expires_after.seconds` 10-7200, default 600. "The session itself may continue after that time once started." | OpenAI client_secrets reference [S]; confirmed on Azure §6.4 [M] (7200 accepted, 7201 rejected 400) | Key expiry mid-lesson is harmless to the live call. A reconnect that reuses an expired key gets an open socket and then `Ephemeral token expired` on its first request, so the failure shows up late, after the client believes it is connected. |
| Truncate cuts the audio and drops the unplayed transcript, but the model "doesn't have enough information to precisely align transcript and audio"; a speech-start during an audio-less response can truncate the previous, fully heard item | OpenAI developer forum; openai-agents-python issue #5190 [S/U] | Our own heard-text estimate (§4.2 step 3) is required for re-seeding, and a truncate must never target an item whose playout already ended. |
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
| stall detect | 1.5 s without a byte while expecting | WS pings every 500 ms; under 2%, 5% and 1%-at-260 ms loss the longest normal byte gap stayed below it | 0 false stalls in 36 turns (P2, P3, P4) [M] |
| app-voice notice | stalled + 3 s (≈ 4.5 s of silence) | the child's own "hello?" comes at about 2-3 s of dead air [I]; a notice before ~3 s collides with a recovering link | fired 4.25-4.59 s after outage start in 25/25 outages; with TCP surviving, bytes came back 0.56 s after the network did [M] |
| stale threshold | > 2 s of total stall → truncate + resume | beyond ~2 s the unplayed remainder of the reply no longer follows on from what the child last heard [I] | P5n (played on) left a 4-5 s mid-sentence gap 8/8 [M] |
| reconnect attempt | stalled ≥ 2.5 s with 2 missed pings, or a closed socket, or `onAvailable` | a TCP session survives a 5 s outage; a new session costs 2.4-4.6 s after the network returns | P5p resume 2.6-4.2 s vs P6 reconnect 2.4-4.6 s (§6.3) [M] |
| fallback | 8 s | lesson-arc §11 | — |
| every timer | × (1 + RTT/1 s) in degraded | RTT 230-380 ms from India | §1.3 |

### 3.4 Reconciling with the transport ladder (`low-end-offline.md` §7)

The ladder says *which transport* (L0 WebRTC, L1 WS relay, L2 walkie-talkie, L3 text + clips, L4 offline). The state
machine says *what happens inside a call on any rung*. Mapping: §7.4 green = healthy; amber = degraded; red = degraded
plus "step down one rung at the next turn boundary"; dead = stalled → reconnect, where the reconnect may land on the
next rung down (L0 → L1) instead of the same one. Text/tap fallback = L3. Both documents' 8 s fallback agree.

### 3.5 Server-side stalls enter the same machine (measured cause, §6.5)

| event | treated as | action |
|---|---|---|
| `response.done` `status:failed`, code `inference_rate_limit_exceeded` | stalled, with the socket healthy | one retry `response.create` after 1 s [I] with the same compile; a second failure → app-voice notice, then text/tap fallback for this item. The child's turn is `no_evidence`, never a miss |
| `response.done` `status:incomplete`, reason `content_filter` | a half-played reply | truncate to the played point, then a director re-ask through the normal resume (§4.1 steps 1-7); log for kit review (a maths explanation tripped it) |
| `error` `Cancellation failed: no active response found` | benign | ignore; it means the stalled reply had already finished server-side (4/4 occurrences in P5p) |

Capacity is part of resilience: a rate-limited deployment produces silent turns exactly like a dead link. The
deployment's TPM must be sized for peak concurrent children with headroom, and the failure rate per 100 responses is a
dashboard metric (owner action O-G3-2).

### 3.6 Resume after a long drop (lesson-arc §11)

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

## 6. Measurements (2026-10-02, WebSocket path, `taxila-realtime`)

### 6.1 Method [M]

- **Harness:** `network-g3/netsim.mjs` (copied from the session scratchpad; results in `network-g3/results/*.json`,
  summary `network-g3/summary-2026-10-02.json`, analysis `network-g3/analyze.py`). One GA realtime WS session per
  profile, server VAD 0.6 / 900 ms, voice `marin`, a short class-4 fractions brief in Hinglish (a harness brief, not the
  §2 compile). The child is 12 pre-rendered child utterances (`network-g3/lines.json`) streamed as 40 ms PCM chunks
  with continuous silence between turns, as a real mic does.
- **Impairment:** every TLS byte goes through two user-space lanes (up, down). Each 1,400-byte segment gets one-way
  delay RTT/2 ± jitter/2, order preserved; a lost segment adds a fast-retransmit (70%) or RTO (30%) penalty and blocks
  everything behind it (head-of-line). An outage either holds all bytes and releases them on the TCP backoff schedule
  (`hold`, the socket survives) or kills the connection (`blackhole`). **This is a model of TCP under netem, not netem
  on a kernel** (no `sch_netem` here), and the base path is US container → eastus2 (21 ms WS ping).
- **TTFA** = first audio delta at the client − the moment the child's last speech chunk was sent (it includes the
  900 ms VAD silence). **Audible gaps** = playout underruns ≥ 50 ms with jitter buffers of 0/150/300/600 ms applied
  to the measured arrival times. **Duplicates** = more than one response per child turn beyond the designed resume.
  **Orphans** = events arriving on a socket the client has replaced. **Recovery** = network back → first audible
  resume audio. **Heard repeat** = share of 3-grams of the heard part of the interrupted reply that recur in the resume.
- n is turns per profile; TTFA n counts only turns whose response completed (see §6.5 for the failures).

### 6.2 Jitter and loss (no outage)

| profile | added impairment | WS ping RTT p50 | TTFA p50 (range), n | gaps at 0 ms buffer | gaps at ≥150 ms | duplicates | failed / total responses |
|---|---|---|---|---|---|---|---|
| P0 | none | 21 ms | **1.91 s** (1.55-3.17), 12 | 0 | 0 | 0 | 0/12 |
| P1 | 150 ± 50 ms | 180 ms | **2.65 s** (2.47-3.71), 7 | 0 | 0 | 0 | 5/12 |
| P2 | 150 ± 50 ms, 2% loss | 184 ms | **2.59 s** (2.39-4.38), 11 | 0 | 0 | 0 | 1/12 |
| P3 | 150 ± 50 ms, 5% loss | 212 ms | **3.61 s** (2.41-4.65), 8 | 0 | 0 | 0 | 3/12 + 1 content_filter |
| P4 | 260 ± 50 ms, 1% loss (India centre, §1.3) | 288 ms | **3.60 s** (2.86-4.24), 7 | 2 turns, ≤150 ms | 0 | 0 | 5/12 |
| P1c | as P1, client sends `response.create` on `speech_stopped` | 180 ms | **4.79 s** (4.48-6.38), 5 | 0 | 0 | 0 | 5/10 |

**Read.**
1. **Downlink jitter and loss are inaudible on WS** at a ≥150 ms buffer (0 gaps in 54 turns): the reply arrives
   several times faster than real time, so the buffer fills ahead of playout. The 300 ms live buffer is enough; the
   600 ms degraded buffer is headroom, not a measured need.
2. **TTFA is where the network shows.** India-like RTT adds ~0.7 s (P0 → P1) and 5% loss or India-centre RTT adds
   ~1.7 s (P0 → P3/P4). **VT-2's ≤3 s answer-state bar fails at the median under P3 and P4**, before any
   think-time window is added. The 3 s bar must be re-set from India-measured data, or the latency must come off
   elsewhere (§7).
3. **P1c: client-created responses cost +2.1 s median over auto-response** at 180 ms RTT (n=5), against the earlier
   +300-500 ms [T] measured without added RTT. The cause is not isolated [U] (the client waits for `speech_stopped`,
   which carries the VAD hangover plus a downlink trip, then the create goes up). This directly hits the
   ANSWER_EXPECTED floor state (VOICE-TEACHER §1.3) and is the first thing VT-2 must re-measure from India.
4. Uplink loss could not be judged for ASR quality here: the child audio is pre-rendered and the transcripts are not
   scored in this run.

### 6.3 A 5 s outage mid-reply (150 ± 50 ms base)

| profile | policy | outages | what the child got | recovery (net back → first resume audio) | dead air | duplicates / stale replies | heard repeat | app-voice notice |
|---|---|---|---|---|---|---|---|---|
| **P5n** | naive: socket survives, auto-response on, no truncate | 8 | the half-received reply resumed after a **4-5 s** mid-sentence gap (8/8, max 5.2 s at 300 ms buffer); then on every turn where the child spoke during the outage, a **second reply to the stale audio (4/4)**, each telling the child to check mic/volume | bytes back 0.56 s; stale reply audio 2.6-4.2 s | 3.7-3.9 s measured where computable, plus the mid-reply gap | **4 stale replies** | n/a | 4.25-4.58 s after outage start, 8/8 |
| **P5p** | resume (§4.1): socket survives; auto-response off, cancel, clear, truncate to played ms, held audio as one item, one resume | 7 | the reply cut at the heard point (1.2-3.2 s played; 3.0-12.8 s of received audio discarded unplayed); then one resume | **2.6-4.2 s** (median ~3.0 s) in the 4 resumes that completed; 3 resumes **failed on the rate limit** and left silence until the next turn | ≈ 5 s outage + ~3 s | 1 extra (a failed retry) | 0.00-0.04 | 7/7 |
| **P6** | reconnect (§4.2): socket dead; fresh 60 s key, new session `create_response:false`, re-seed heard-only text, held audio, one resume | 10 | the cut reply (heard text ends mid-phrase), then one resume on a new session | **2.4-4.6 s** (median ~3.6 s): mint 0.23-0.52 s, WS open 0.49-0.74 s, re-seed done 0.92-1.25 s after net back, model ~1.4-3.4 s | **6.1-8.4 s** (median ~6.9 s) | **0 duplicates, 0 orphan events** (10/10) | 0.00 in 9/10, 0.14 in 1 | 10/10 |

**Read.**
- The naive client produces all three failure shapes the gap named: a half-played reply, a reply to stale audio, and
  a repair that blames the child. The resume and reconnect policies removed the stale replies and the duplicates and
  did not repeat heard words (3-gram repeat ≤ 0.04 in 13/14 completed resumes).
- Resumes still **re-explained the item from the top** in several P6 cases (the same equal-parts framing again).
  Verbatim repetition is gone; content-level restart is not. The RESUME note is a harness shape, and VT-11 must score
  "continued from the heard point" by listener, not by n-grams.
- Several resumes opened with a presence claim ("I'm here / main sun rahi hoon" shape). That is acceptable only when
  the app voice has not already said the link dropped; the director should pass `notice_played` into the resume note
  so the teacher does not repeat it [I].
- With a 5 s outage, **the child hears 6-8 s of silence on reconnect and ~8 s on resume**, so the app-voice notice at
  ~4.5 s is the only thing that fills it. The notice timing held in 25/25 outages.

### 6.4 Ephemeral keys and the 60-minute cap [M]

| test | n | result |
|---|---|---|
| live session continues past its key's expiry (10 s key, request at 20 s) | 3 | 3/3 `completed` |
| new connection with an expired key | 3+3 | socket **opens** 3/3; the first request returns `Ephemeral token expired` 3/3 |
| second connection with a still-valid key | 3 | 3/3 opens a second working session (the key is not single-use) |
| `expires_after.seconds` 7200 / 7201 | 1 / 1 | 200 (TTL 7199 s) / 400 |
| one idle WS session held open | 1 | `session_expired` "maximum duration of 60 minutes" at 60.01 min, close 1001 |

### 6.5 Rate limits and filters (a confound and a finding)

28 of 112 responses across the nine runs failed with `inference_rate_limit_exceeded` ("too many tokens"), and one P3
reply ended `incomplete: content_filter`. The deployment was shared with sibling workstreams running at the same time,
so the failure rate is **not** a property of the network profiles, and TTFA medians are over completed turns only
(n 5-12). It is a property of production: a child on a quota-starved deployment hears exactly the silence of a dead
link. §3.5 handles it.

### 6.6 What was not measured

- **WebRTC.** No UDP in this sandbox. NetEQ concealment, ICE restart timing, `output_audio_buffer` behaviour on a stall,
  and uplink loss's effect on ASR are all [U].
- **Real netem and real phones.** No 3G/4G handover, no NAT rebinding, no Android Doze, no WebView backgrounding.
- **India origin.** All runs leave from a US container with added delay. India RTT is §1's estimate, not a probe.
- **Child-side perception.** "Dead air reads as being ignored" and the 3 s notice point are [I] until the child panel.

---

## 7. Implications for the rest of the spec

- **VT-2's 3 s bar is not reachable at the median from India-like links with client-created responses** (§6.2 rows
  P3, P4, P1c). Options, to be measured rather than argued: (a) keep auto-response on in ANSWER_EXPECTED and cancel it
  when the think-time window has not closed (the response is pre-generated, not pre-played); (b) the L1 relay in
  Central India placed next to the child so VAD and `response.create` run one hop from the model instead of two;
  (c) accept a 4 s bar for answer states with the listening cue on screen.
- **The L1 WS relay is the stronger rung on lossy 4G**, not only a UDP fallback: the WS burst makes downlink jitter
  and loss inaudible. Its uplink is still TCP and suffers head-of-line stalls, which the stall detector covers.
- **The deployment's TPM is a reliability parameter**, sized per concurrent child (O-G3-2).

---

## 8. VT-11 (the §11 row in VOICE-TEACHER) and open owner decisions

**VT-11, network resilience** (VT-10 was already taken by G1 spoken notation):
1. Re-run P0-P6 against the **real voice client** (`src/lesson/link.ts`) with the full §2 compile, on a dedicated
   deployment (no shared-quota failures), from an **India origin** (an Azure Central India VM as the client, or a
   real phone through a Linux router running `tc qdisc add dev <if> root netem delay 150ms 50ms loss 2%` and the
   other profiles), n ≥ 10 turns per profile, **both** WS and WebRTC.
2. Add the cases this run could not: Wi-Fi → 4G handover mid-reply, a NAT rebinding (IP change), app backgrounded
   for 10 s, an ICE `failed` forcing L0 → L1, and a lesson crossing the 60-minute cap.
3. Bars: 0 duplicate or orphaned replies; 0 replies to stale audio; 0 references to unheard words; no silence over
   5 s without the app-voice notice; resume continues from the heard point by listener judgement in ≥ 9/10 [I];
   lost child audio graded 0 times; held-audio safety recall 100% on a scripted battery spoken during outages.

**Owner decisions.** O-G3-1: the app voice, not the teacher's voice, gives the stall notice (§3.2). O-G3-2: a
dedicated realtime deployment or TPM reservation for live lessons, with the failed-response rate on the dashboard.
O-G3-3: whether to stand up the L1 relay in Central India for the first pilot (latency, §7).

---

## 9. Sources

- TRAI Independent Drive Test reports, Delhi, South Delhi, Mumbai, Tamil Nadu, Madhya Pradesh, Bihar (Dumka), North
  East and Assam LSAs, 2026 — https://www.trai.gov.in/release-publication/reports/drive-test-reports (PDFs read
  locally, `IDT_*.pdf`)
- RIPE Atlas anchoring mesh measurements, India anchors → Ashburn/Herndon anchors, 24 h to 2026-10-02 —
  https://atlas.ripe.net/ (API pull: `network-g3/atlas.py`, data `network-g3/atlas-india-ashburn.json`)
- Opensignal, India Mobile Network Experience Report, February 2026 —
  https://insights.opensignal.com/reports/2026/02/india/mobile-network-experience ; June 2025 —
  https://insights.opensignal.com/reports/2025/06/india/mobile-network-experience ; metric definitions —
  https://www.opensignal.com/our-approach/mobile-metrics (all via search index; direct fetch 403)
- OpenAI, Realtime conversations guide — https://platform.openai.com/docs/guides/realtime-conversations ; Realtime
  client events (`conversation.item.truncate`, `output_audio_buffer.clear`) —
  https://platform.openai.com/docs/api-reference/realtime-client-events ; client secrets reference
- OpenAI developer forum, truncate and transcript alignment —
  https://community.openai.com/t/when-truncate-is-received-are-we-really-meant-to-delete-the-entire-response-text-or-just-what-had-not-been-heard-by-the-client/1259022
- openai-agents-python issue #5190 (speech start during an audio-less response truncates the previous heard item) —
  https://github.com/openai/openai-agents-python/issues/5190
- Microsoft, Use the GPT Realtime API via WebRTC / audio how-to (regions East US 2, Sweden Central) —
  https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio
- MDN, `RTCPeerConnection.restartIce()` — https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/restartIce
