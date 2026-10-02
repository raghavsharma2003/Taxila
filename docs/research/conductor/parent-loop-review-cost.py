# Architect review of parent-loop.md: what the parent loop costs per family, and what WhatsApp's sending tier allows.
# Run: python3 parent-loop-review-cost.py   (2026-10-02; prices from realtime-cost-model.py [V there] and
# tech-and-market.md §744 luna $0.20/$1.20 per M [V there]). Every output is a MODEL [I]/[U]. Measure before relying on it.

REVENUE = 299 / 96                       # Rs 299/month at Rs 96/$ (orchestration §9.1)
RT = dict(ai=32.0, aic=0.40, ao=64.0, ti=4.0, tic=0.40, to=24.0)       # gpt-realtime-2.1, $/M
RT_MINI = dict(ai=10.0, aic=0.30, ao=20.0, ti=0.60, tic=0.06, to=2.40) # gpt-realtime-2.1-mini, $/M
LUNA_IN, LUNA_OUT = 0.20, 1.20
U_TPS, A_TPS = 10, 20                    # audio tokens per second (cost model)

def ptm_voice_cost(p, minutes=10, teacher_share=0.50, parent_share=0.30, turns_per_min=3,
                   text_ctx=2500 + 900 + 600, tool_tokens_per_turn=400, cache_hit=0.0, audio_window=1):
    """One voice PTM. text_ctx = core + ParentBrief(<=900) + agenda; tool results accumulate unless pruned."""
    turns = int(minutes * turns_per_min)
    a_turn = minutes * 60 * teacher_share * A_TPS / turns
    u_turn = minutes * 60 * parent_share * U_TPS / turns
    cost = 0.0; tools = 0.0; hist = []
    for i in range(turns):
        tools += tool_tokens_per_turn * 0.5          # about every other turn calls a tool; results stay in context
        text_in = text_ctx + tools
        audio_in = sum(hist[-audio_window:]) + u_turn
        cost += (text_in * ((1 - cache_hit) * p['ti'] + cache_hit * p['tic']) + audio_in * p['ai']) / 1e6
        cost += a_turn * p['ao'] / 1e6
        hist.append(u_turn + a_turn)
    return cost

print("A. One 10-minute voice PTM (parent register, ParentBrief + agenda + accumulating tool results)")
for label, p, cache in [("rt-2.1, no text cache", RT, 0.0), ("rt-2.1, 70% text cache", RT, 0.7),
                        ("rt-2.1-mini, no cache", RT_MINI, 0.0)]:
    c = ptm_voice_cost(p, cache_hit=cache)
    print(f"   {label:24s} ${c:5.2f} per PTM  (${c/10:5.3f}/min)  -> 2 PTMs/month ${2*c:5.2f} = {2*c/REVENUE:4.0%} of revenue")
print("   doc §7.1 assumed ~$0.08/min -> $1.60 for 2 x 10 min")

print("\nB. Weekly voice note, 4 per month, 75 s each: pre-render every week vs render on the 'Suno' tap")
A_NOTE = 75 * A_TPS * RT['ao'] / 1e6 + 1500 * RT['ti'] / 1e6     # option A: realtime render, ~1.5k text tokens in
B_NOTE = 0.02                                                    # option B: gpt-4o-mini-tts (doc §5.4) [U]
STT_VERIFY = 75 / 60 * 0.075 / 45                                # MAI-Transcribe-2 at $0.075/45 min, re-transcribe to diff
for p_play in (0.2, 0.4, 0.7):
    print(f"   play rate {p_play:.0%}: option A pre-render ${4*(A_NOTE+STT_VERIFY):.2f}/mo, lazy ${4*p_play*(A_NOTE+STT_VERIFY):.2f}/mo"
          f" | option B pre-render ${4*B_NOTE:.2f}, lazy ${4*p_play*B_NOTE:.2f}")

print("\nC. Text PTM worst case at the doc's rate limit (30 turns/day/guardian), luna")
reply = 5000 * LUNA_IN / 1e6 + 300 * LUNA_OUT / 1e6     # brief + history + tools in, reply out
check = 2000 * LUNA_IN / 1e6 + 100 * LUNA_OUT / 1e6     # claim classifier / PX lint pass
safety = 500 * LUNA_IN / 1e6 + 20 * LUNA_OUT / 1e6
per_turn = reply + check + safety
for label, turns in [("typical 15 turns/mo", 15), ("1 guardian at cap, 30 d", 900), ("2 guardians at cap", 1800)]:
    print(f"   {label:26s} ${turns*per_turn:5.2f}/mo")

print("\nD. WhatsApp business-initiated sending: 250 unique users / 24 h at start, 2,000 after the scaling path [V Meta]")
for tier in (250, 2000, 10000):
    print(f"   tier {tier:6d}: all letters on Sunday -> max {tier:6d} families; spread over 7 weekdays -> {7*tier:6d} families/week")
print("   (utility templates and free-form replies inside an open 24 h service window are free [V Meta pricing])")

print("\nE. Parent loop per family per month, v1 recommendation vs doc")
doc_low, doc_high = 0.77, 1.80
v1 = 4 * 0.005 + 4 * 0.4 * B_NOTE + 0.01 + 15 * per_turn + 1 * ptm_voice_cost(RT, cache_hit=0.7)
print(f"   doc §13: ${doc_low:.2f}-{doc_high:.2f} ({doc_low/REVENUE:.0%}-{doc_high/REVENUE:.0%} of revenue)")
print(f"   v1 (letters + lazy TTS note + text PTM + 1 voice PTM/month, cached): ${v1:.2f} ({v1/REVENUE:.0%})")
