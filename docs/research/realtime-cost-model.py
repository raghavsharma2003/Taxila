# Reproduces the 45-min session table in tech-and-market.md section 1.9. Run: python3 realtime-cost-model.py
# 45-min session cost model for realtime S2S (assumptions documented in the report)
PRICES = {  # USD per 1M tokens, Azure Global, verified on azure pricing page 2026-10-02
 'rt-2.1':      dict(ai=32.0, aic=0.40, ao=64.0, ti=4.0, tic=0.40, to=24.0),
 'rt-2.1-mini': dict(ai=10.0, aic=0.30, ao=20.0, ti=0.60, tic=0.06, to=2.40),
}
MIN=45; TURNS=60
TEACH_MIN=18; STUD_MIN=6.75          # teacher speaks 40%, student 15%
U_TPS=10; A_TPS=20                     # tokens per second of audio (user, assistant)
SYS=2500; EXTRA=80                     # system prompt text tokens; per-turn text extras (tool results/observations)
u_turn = STUD_MIN*60*U_TPS/TURNS       # user audio tokens per turn
a_turn = TEACH_MIN*60*A_TPS/TURNS      # assistant audio tokens per turn
TXT_OUT_RATIO=0.25
def run(model, window=None, cache_hit=0.0, summary_cap=1500):
    p=PRICES[model]; ai=aic=ti=tic=0.0
    hist_audio=[]; hist_text=0; summary=0
    for i in range(TURNS):
        cur_audio = sum(hist_audio) + u_turn
        cur_text = SYS + hist_text + summary + EXTRA
        new_audio = u_turn + (a_turn if i>0 else 0)   # tokens not seen before this turn
        new_text = EXTRA
        cached_audio = max(0, (cur_audio-new_audio))*cache_hit
        cached_text = max(0,(cur_text-new_text))*cache_hit
        ai += cur_audio-cached_audio; aic += cached_audio
        ti += cur_text-cached_text; tic += cached_text
        hist_audio.append(u_turn+a_turn); hist_text += EXTRA
        if window and len(hist_audio)>window:
            hist_audio.pop(0); summary=min(summary_cap, summary+75)  # turn -> ~75 text tokens of transcript summary
    ao = TURNS*a_turn; to = ao*TXT_OUT_RATIO
    cost = (ai*p['ai']+aic*p['aic']+ao*p['ao']+ti*p['ti']+tic*p['tic']+to*p['to'])/1e6
    return cost, ai+aic, ao
for m in PRICES:
    for label,kw in [('no truncation, no cache',{}),
                     ('no truncation, 97% cache hit (OpenAI-direct-like)',dict(cache_hit=0.97)),
                     ('6-turn audio window + text summary, no cache',dict(window=6)),
                     ('6-turn window + summary, 70% cache hit',dict(window=6,cache_hit=0.7))]:
        c,ain,ao=run(m,**kw)
        print(f"{m:12s} | {label:48s} | ${c:6.2f}/45min | ${c/MIN:5.3f}/min | audio-in tokens billed {ain/1e3:7.0f}k | audio-out {ao/1e3:.0f}k")
print('per-turn user audio tok', u_turn, 'assistant audio tok', a_turn)

# Extra rows used in the report table
for m in PRICES:
    c,_,_ = run(m, window=1)
    print(f"{m:12s} | {'1-turn audio window + text summary, no cache':48s} | ${c:6.2f}/45min")
for m,p in PRICES.items():
    txt_in = sum(SYS + i*(EXTRA+20+75) for i in range(TURNS))   # user turns sent as text (external STT)
    ao = TURNS*a_turn; to = ao*TXT_OUT_RATIO
    c = (txt_in*p['ti'] + ao*p['ao'] + to*p['to'])/1e6
    print(f"{m:12s} | {'text-in (external STT) / audio-out, no cache':48s} | ${c:6.2f}/45min")
# Cascaded and GPT-Live comparators (Azure list prices; Sarvam at Rs96/USD)
chars = TEACH_MIN*140*6
print(f"TTS 18 min narration: Azure neural ${chars*15/1e6:.3f} | HD ${chars*22/1e6:.3f} | Sarvam ${chars*3/1000/96:.3f}")
print(f"STT 45 min: MAI-Transcribe-2 ${0.75*0.10:.3f} | Sarvam ${0.75*30/96:.3f} | gpt-live-transcribe ${0.75*1.02:.3f}")
luna = (TURNS*6000*0.1*0.2 + TURNS*6000*0.9*0.02 + TURNS*150*1.2)/1e6
print(f"LLM gpt-5.6-luna ${luna:.3f} | GPT-Live voice 45 min ${3*0.75:.2f} (+ backend)")
