# Architect review of school-sync-homework.md: what one homework page and one homework sitting cost,
# as designed (§3.2 DAG, §4.3 keys, §8.1 night prep) versus the pick-first v1 in the review.
# Run: python3 school-sync-review-cost.py   (2026-10-02)
# Every token count below is a MODEL [I/U]. Prices: DI from the Azure Retail Prices API (eastus2 and centralindia,
# S0, queried 2026-10-02) [V]; text models from orchestration-architecture §9.1 [V there]; image tokens use the
# documented GPT-4-Turbo-vision tile rule (85 base + 170 per 512 tile at high) [V, MS Learn vision page]; whether
# gpt-5.6 tiles identically is [U]. Voice per-minute from realtime-cost-model.py output.

USD_PER_M = {"luna_in": 0.20, "luna_out": 1.20, "sol_in": 4.00, "sol_out": 20.00, "emb": 0.02}
DI = {"read_page": 1.50 / 1000, "layout_page": 10.00 / 1000}   # S0, first tier; Read drops to $0.60/1k after 1M pages
INR = 96
REVENUE = 299 / INR

def img_tokens(w, h, detail="high"):
    if detail == "low":
        return 85
    s = min(1.0, 2048 / max(w, h)); w, h = w * s, h * s
    s = min(1.0, 768 / min(w, h)); w, h = w * s, h * s
    tiles = -(-int(w) // 512) * -(-int(h) // 512)
    return 85 + 170 * tiles

def call(model, tin, tout):
    return tin * USD_PER_M[f"{model}_in"] / 1e6 + tout * USD_PER_M[f"{model}_out"] / 1e6

PAGE_ITEMS = 8          # items on a typical maths worksheet / diary page [U]
CROPS = 4               # S4 answer/maths crops per page, design says 2-6
CHOSEN = 1.5            # items a child actually works on per sitting [U]
COMPUTABLE = 0.6        # share of picked items a K2 code solver covers [U]
for reasoning_out in (400, 1500):                       # reasoning+answer tokens per sol solve [U]
    solve = call("sol", 450, reasoning_out)
    dual = 2 * solve
    print(f"\n=== sol solve output {reasoning_out} tok: one solve ${solve:.4f}, dual solve ${dual:.4f}")

    # A. as designed: full DAG on every page + night prep keys AND isomorphs for every item due tomorrow
    a = {
        "S1 luna classify (low)":    call("luna", img_tokens(2048, 1536, "low") + 300, 150),
        "S2 DI layout (page)":       DI["layout_page"],
        "S4 sol literal crops":      CROPS * call("sol", img_tokens(1024, 256) + 250, 180),
        "S4 DI read per crop (each crop bills a page)": CROPS * DI["read_page"],
        "S6 luna structure":         call("luna", 2500, 900),
        "S9 embed + luna enum/item": PAGE_ITEMS * (call("luna", 1500, 60) + 300 * USD_PER_M["emb"] / 1e6),
        "K3 dual solve, all items (night prep)": PAGE_ITEMS * (1 - COMPUTABLE) * dual,
        "isomorph gen + its own key, all items": PAGE_ITEMS * (1 - COMPUTABLE) * (call("sol", 600, 400) + dual),
    }
    tot_a = sum(a.values())
    for k, v in a.items():
        print(f"   A  {k:48s} ${v:.4f}")
    print(f"   A  TOTAL per page ${tot_a:.3f} = Rs {tot_a*INR:.1f}   (design target: < Rs 1)")

    # B. pick-first v1: DI Read on the whole page (lines + boxes), child taps ONE question, only it is processed
    b = {
        "DI read, whole page once":  DI["read_page"],
        "luna structure, picked item only": CHOSEN * call("luna", 900, 250),
        "luna enum pick, picked only": CHOSEN * call("luna", 1500, 60),
        "K3 dual solve, picked & non-computable": CHOSEN * (1 - COMPUTABLE) * dual,
        "isomorph: kit template (code) else gen+key": CHOSEN * (1 - COMPUTABLE) * (call("sol", 600, 400) + dual),
        "check-my-working, 30% of sittings": 0.3 * (DI["read_page"] + 2 * call("sol", img_tokens(1024, 256) + 250, 180)),
    }
    tot_b = sum(b.values())
    print(f"   B  pick-first TOTAL per sitting ${tot_b:.3f} = Rs {tot_b*INR:.1f}  ({tot_a/tot_b:.0f}x cheaper than A)")
    # B2. v1 floor: keys only from kits/code; non-computable items get ONE luna solve used solely as a leak-guard
    # blocklist candidate (false positives are cheap), no correctness talk; isomorphs only from kit templates
    b2 = (DI["read_page"] + CHOSEN * (call("luna", 900, 250) + call("luna", 1500, 60))
          + CHOSEN * (1 - COMPUTABLE) * call("luna", 450, 600)
          + 0.3 * (DI["read_page"] + 2 * call("sol", img_tokens(1024, 256) + 250, 180)))
    print(f"   B2 v1 floor (code keys + luna leak candidates) per sitting ${b2:.4f} = Rs {b2*INR:.2f}")
    for d in (12, 20):
        print(f"      {d} homework days/mo: A ${tot_a*d:5.2f} | B ${tot_b*d:5.2f} | B2 ${b2*d:5.2f} | revenue ${REVENUE:.2f}")

print("\nC. The conversation around the homework, 12 min/sitting [U], by lane (per-minute from realtime-cost-model.py)")
PER_MIN = {"rt-2.1 (SS7 as written: voice lane + post-check)": 3.93 / 45,
           "rt-2.1-mini": 0.96 / 45, "cascade (STT+luna+TTS, pre-checkable)": 0.35 / 45}
for k, p in PER_MIN.items():
    print(f"   {k:52s} ${12*p:.3f}/sitting  ${12*p*20:5.2f}/mo at 20 days")

print("\nD. Peak demand on the sol deployment, 17:00-19:00 IST, 60% of actives do homework, uniform over 120 min")
for actives in (1_000, 10_000, 100_000):
    per_min = actives * 0.6 / 120
    sol_calls_a = CROPS + CHOSEN * (1 - COMPUTABLE) * (2 + 1 + 2)   # crops + dual + isomorph gen + isomorph dual (inline)
    sol_calls_b = CHOSEN * (1 - COMPUTABLE) * (2 + 1 + 2) * 0.5 + 0.3 * 2   # half the isomorphs come from cache/library
    print(f"   {actives:>7,} actives: {per_min:6.0f} sittings/min -> sol RPM A {per_min*sol_calls_a:7.0f} | B {per_min*sol_calls_b:7.0f}")
