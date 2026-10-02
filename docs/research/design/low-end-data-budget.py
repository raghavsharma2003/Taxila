"""Data cost per lesson for each voice rung (low-end-offline.md section 6). 2026-10-02.

Arithmetic, not a measurement. Inputs marked [M] come from low-end-cascade-probe-2026-10-02.json
(n=5, US build container). Inputs marked [U] are assumptions the device lab must replace (M-LE-3).
Run: python3 docs/research/design/low-end-data-budget.py
"""

LESSON_MIN = 30
TEACHER_TALK = 0.45  # [U] share of lesson time the teacher is speaking
CHILD_TALK = 0.15    # [U] share of lesson time the child is speaking

# Per-packet overhead for RTP audio over IPv4: IP 20 + UDP 8 + RTP 12 + SRTP auth tag 10 bytes [I, header sizes].
OVERHEAD_BYTES = 20 + 8 + 12 + 10


def rtp_kbps(payload_kbps: float, ptime_ms: int) -> float:
    pps = 1000 / ptime_ms
    return payload_kbps + pps * OVERHEAD_BYTES * 8 / 1000


def mb(kbps: float, seconds: float) -> float:
    return kbps * 1000 * seconds / 8 / 1e6


secs = LESSON_MIN * 60
rows = []

# L0 realtime WebRTC, browser defaults: Opus ~32 kbps [U], 20 ms packets, uplink sent continuously
# (no DTX unless the answer SDP carries usedtx=1 [U]); downlink assumed continuous too [U].
up = mb(rtp_kbps(32, 20), secs)
down = mb(rtp_kbps(32, 20), secs)
rows.append(("L0 realtime, defaults (32 kbps, 20 ms, continuous both ways) [U]", up, down))

# L0 data saver: uplink capped at 16 kbps via RTCRtpSender.setParameters, 60 ms packets if honoured [U],
# downlink asks for maxaveragebitrate=16000 in the offer [U: whether Azure honours it is unmeasured].
up = mb(rtp_kbps(16, 60), secs)
down = mb(rtp_kbps(16, 60), secs)
rows.append(("L0 realtime, data saver (16 kbps, 60 ms) [U]", up, down))

# L2 walkie-talkie: child clip as Ogg-Opus 16k = 13,256 B for 6.95 s [M] -> 15.3 kbps;
# teacher turn as raw TTS opus 70.7 kbps [M] or server re-encoded at 20k target -> 18.5 kbps [M].
child_kbps = 13256 * 8 / 6.95 / 1000
up = mb(child_kbps, secs * CHILD_TALK)
down_raw = mb(70.7, secs * TEACHER_TALK)
down_re = mb(18.5, secs * TEACHER_TALK)
rows.append(("L2 walkie-talkie, TTS opus as served (70.7 kbps) [M]", up, down_raw))
rows.append(("L2 walkie-talkie, server re-encode 20k (18.5 kbps) [M]", up, down_re))

# L3 text + cached clips: transcripts and director JSON only; ~2 KB per turn, ~60 turns [U].
rows.append(("L3 text + tap (clips already in the pack) [U]", 0.06, 0.06))

print(f"Lesson {LESSON_MIN} min, teacher talk {TEACHER_TALK:.0%}, child talk {CHILD_TALK:.0%}")
print(f"{'rung':66} {'up MB':>7} {'down MB':>8} {'total':>7}")
for name, u, d in rows:
    print(f"{name:66} {u:7.1f} {d:8.1f} {u + d:7.1f}")

# Lesson pack (offline modules, item bank, clips): target ceiling, see section 5.
PACK_MB = 1.5
print(f"\nLesson pack ceiling {PACK_MB} MB, downloaded once, ideally on Wi-Fi or overnight.")
