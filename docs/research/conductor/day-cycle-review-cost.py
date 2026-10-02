# Architect review of day-cycle.md: what the default day plan costs, and what it does to realtime capacity.
# Run: python3 day-cycle-review-cost.py   (2026-10-02; prices from realtime-cost-model.py, Azure list, verified there)
# Every number below is a MODEL, tagged [I]/[U] in day-cycle.md "Architect review". Measure before relying on it.

PER_MIN = {  # USD per voice minute, from realtime-cost-model.py output (45-min session)
    "rt-2.1, 1-turn window":        3.93 / 45,
    "rt-2.1, text-in/audio-out":    3.35 / 45,
    "rt-2.1-mini, 1-turn window":   0.96 / 45,
    "cascade (STT+luna+TTS)":       0.35 / 45,
}
REVENUE_USD = 299 / 96          # Rs 299/month at Rs 96/$ (orchestration-architecture §9.1)
CAP = {"B1": 30, "B2": 40, "B3": 60, "B4": 75}          # day-cycle §3.2 daily cap
LESSON = {"B1": 20, "B2": 25, "B3": 35, "B4": 45}       # DC4
PLAN_FRACTION = 0.7                                     # §8: plan aims at 70% of cap
DAYS = {"habit-forming (12 d/mo)": 12, "target (20 d/mo)": 20}

print("A. Monthly voice cost if every planned minute is a realtime/voice minute (plannedMin = 0.7 x cap)")
for band, cap in CAP.items():
    m = cap * PLAN_FRACTION
    row = [f"{band} {m:4.1f} min/d"]
    for d_label, d in DAYS.items():
        for k, p in PER_MIN.items():
            if d == 20:
                row.append(f"{k[:14]:14s} ${m*d*p:6.2f}")
    print(" | ".join(row))
print(f"   revenue line: ${REVENUE_USD:.2f}/child/month")

print("\nB. Same, but only the live lesson's teach+transfer segments are realtime (~45% of lesson), rest is tap/TTS-cached")
TEACH_SHARE = {"B1": 8/20, "B2": 11/25, "B3": 16/35, "B4": 22/45}   # teach + teach-back/transfer from §5.1 table
for band in CAP:
    rt = LESSON[band] * TEACH_SHARE[band]
    for d_label, d in DAYS.items():
        c = rt * d * PER_MIN["rt-2.1, 1-turn window"]
        cm = rt * d * PER_MIN["rt-2.1-mini, 1-turn window"]
        print(f"{band} {d_label:24s} realtime {rt:4.1f} min/d -> rt-2.1 ${c:6.2f}/mo, mini ${cm:5.2f}/mo")

print("\nC. Realtime capacity at the after-school peak (Tier-1 gpt-realtime GlobalStandard: 200 RPM, 100k TPM [V, quotas page];")
print("   Taxila's own deployment was created at 10 RPM [V, decisions.md])")
TOK_PER_TURN_IN = 2500 + 1500 + 430 + 70   # SYS + summary cap + 1-turn audio window + user audio (cost model)
TOK_PER_TURN_OUT = 360 + 90
TURNS_PER_MIN = 60 / 45
tpm_session = (TOK_PER_TURN_IN + TOK_PER_TURN_OUT) * TURNS_PER_MIN
print(f"   ~{tpm_session:,.0f} tokens/min per live session [I: assumes TPM counts cached+audio tokens; U]")
for tpm in (100_000, 1_000_000):
    conc = tpm / tpm_session
    # children per peak: anchor windows cluster in a ~3 h band (16:00-19:00); avg voice minutes per child in band
    for band_min in (25, 50):
        kids = conc * 180 / band_min
        print(f"   TPM {tpm:>9,}: ~{conc:5.0f} concurrent sessions -> ~{kids:6.0f} children/peak at {band_min} voice-min each")
SESSIONS_PER_CHILD = {"day-cycle as written (homework, lesson, reflection, preview = separate calls)": 3.5,
                      "one call per sitting (homework+lesson+wrap-reflection)": 1.2}
for k, s in SESSIONS_PER_CHILD.items():
    print(f"   at 10 RPM session-start cap, {k}: ~{10*180/s:,.0f} children per 3-h peak")
