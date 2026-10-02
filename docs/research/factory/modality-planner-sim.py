#!/usr/bin/env python3
"""
modality-planner-sim.py: Monte-Carlo model for docs/research/factory/multimodal-orchestration.md (2026-10-02).

What it estimates (all [U]-input, [sim]-output; the inputs are priors, not measurements):
  S1  Library reuse: hit rate and factory spend for three cache-key schemes, at 1k / 10k / 100k children, 30 days.
  S2  Anticipation: how often a child whose misconception surfaces gets a ready, bespoke remediation asset,
      under four pre-build policies, and what it costs.
  S3  Cost governor: per-child-day marginal content spend for the default day, and the share of children
      who would hit a given cap.

Run:  python3 docs/research/factory/modality-planner-sim.py         (stdlib only; deterministic seeds)

Inputs that come from the repo (counted 2026-10-02 from data/curriculum/c*-*.json):
  742 topics in total (maths 304, science 146, english 118, sst 65, evs 64, hindi 45);
  601 misconception strings (maths 344, science 180, evs 68, sst 9).
Prices come from conductor/orchestration-architecture.md §9.1 and factory/llm-game-generation.md §8.
"""
import random, math, statistics as st

SEED = 20261002
DAYS = 30
TOPICS_PER_CLASS = 742 // 9            # ≈ 82
ACTIVE_WINDOW = 15                     # topics of a class "live" in a 30-day window (school sync concentrates it) [U]
ZIPF_TOPIC = 1.0                       # popularity skew among active topics [U]
MISC_PER_TOPIC = (0.5, 0.3, 0.2)       # prevalence split among a topic's top-3 misconceptions [U]
P_MISC_SURFACES = 0.40                 # P(some misconception surfaces in a lesson on the topic) [U]
INTERESTS = 8                          # skin packs: cricket, food, animals, vehicles, films/music, festivals, space, generic
ZIPF_INTEREST = 1.0
LANGS = (("hinglish", .70), ("hindi", .20), ("english", .10))
MECHANICS_PER_OBJECTIVE = 2            # game families per objective (llm-game-generation §8)

PRICE = {  # USD
    "g2_build": 2.5,       # kit-extended agentic build, mid of $1.5-3.5 [U]
    "g1_fill": 0.003,      # spec/level fill on taxila-fast: 4k in x $0.20/M + 1.5k out x $1.20/M = $0.0026 [V prices, U tokens]
    "image_med": 0.053,    # gpt-image-2 medium 1024^2 [S]
    "tts_min": 0.015,      # gpt-4o-mini-tts per minute of audio [S, list price; Azure parity U]
    "luna_call": 0.002,    # ~4k in / 1k out on luna ($0.20/$1.20 per M) [V prices]
    "svg_dsl": 0.003,      # scene DSL diagram on luna, incl. one repair [U]
    "sora_8s": 0.80,       # sora-2 $0.10/s [S]
}

def zipf_weights(n, s):
    w = [1 / (k ** s) for k in range(1, n + 1)]
    z = sum(w)
    return [x / z for x in w]

def pick(rng, items, weights):
    r, acc = rng.random(), 0.0
    for it, w in zip(items, weights):
        acc += w
        if r <= acc:
            return it
    return items[-1]

# ───────────────────────── S1: reuse under three key schemes ─────────────────────────
def s1(n_children, rng):
    tw = zipf_weights(ACTIVE_WINDOW, ZIPF_TOPIC)
    iw = zipf_weights(INTERESTS, ZIPF_INTEREST)
    lang_items, lang_w = zip(*LANGS)
    children = [(rng.randrange(1, 10), pick(rng, range(INTERESTS), iw), pick(rng, lang_items, lang_w)) for _ in range(n_children)]
    # each class has its own active window of topics; a child does ~0.8 remediation-eligible lessons/day [U]
    keys = {"A_per_child": set(), "B_baked_skin_lang": set(), "C_core_plus_params": set()}
    misses = {k: 0 for k in keys}
    requests = 0
    for day in range(DAYS):
        for cid, (cls, interest, lang) in enumerate(children):
            if rng.random() > 0.8:
                continue
            if rng.random() > P_MISC_SURFACES:
                continue
            topic = (cls, pick(rng, range(ACTIVE_WINDOW), tw))
            misc = pick(rng, range(3), MISC_PER_TOPIC)
            mech = rng.randrange(MECHANICS_PER_OBJECTIVE)
            requests += 1
            ks = {
                "A_per_child": (cid, topic, misc, mech),
                "B_baked_skin_lang": (topic, misc, mech, interest, lang),
                "C_core_plus_params": (topic, misc, mech),
            }
            for name, k in ks.items():
                if k not in keys[name]:
                    keys[name].add(k)
                    misses[name] += 1
    out = {}
    for name in keys:
        hit = 1 - misses[name] / requests if requests else 0
        spend = misses[name] * PRICE["g2_build"]
        if name == "C_core_plus_params":   # every request still pays a per-child fill; skin packs are a one-off image set
            spend += requests * PRICE["g1_fill"] + INTERESTS * 6 * PRICE["image_med"]
        out[name] = (requests, misses[name], hit, spend, spend / (n_children * DAYS))
    return out

# ───────────────────────── S2: anticipation policies (moving syllabus) ─────────────────────────
# Each class has an ordered sequence of TOPICS_PER_CLASS topics. A child's syllabus position advances one topic
# every 2 school days, from a child-specific offset ~ N(0, OFFSET_SD) topics around the class calendar (school
# sync keeps cohorts together). Tomorrow's lesson is on the current position with p=.6, the previous with p=.25
# (revision), else the next (p=.15). If a misconception surfaces (P_MISC_SURFACES), it is drawn from a 5-long
# Zipf tail. The child is "served" if a remediation core for (class, topic, misc) is READY at practice time:
# already in the library, or built in-lesson in time (P_READY_INLESSON). Night prebuilds add library keys for
# predicted (class, topic, top-k misc), at most NIGHT_CAP builds per night (the governor's library fund).
P_READY_INLESSON = 0.60    # G2 P50 ~8 min, P90 ~15 min (llm-game-generation §8) -> ~60% by minute 10 [U]
OFFSET_SD = 3.0
MISC_TAIL = zipf_weights(5, 1.2)
def s2(n_children, rng, night_k, night_cap, inlesson=True, seed_library=False):
    r = random.Random(SEED + 7 * n_children + 31 * night_k + night_cap + (1000 if seed_library else 0))
    kids = [(r.randrange(1, 10), r.gauss(0, OFFSET_SD)) for _ in range(n_children)]
    library = set()
    if seed_library:   # one-off catalogue: every topic's top-2 misconceptions, built before launch
        for cls in range(1, 10):
            for t in range(TOPICS_PER_CLASS):
                for m in range(2):
                    library.add((cls, t, m))
    seeded = len(library)                       # one-off catalogue builds, reported separately (not in the 30-day spend)
    builds = surfaced = served = 0
    for day in range(DAYS):
        cal = 10 + day / 2.0                       # class calendar position (topic index), same for all classes
        if night_k:
            demand = {}
            for cls, off in kids:
                pos = int(round(cal + off))
                for t, p in ((pos, .6), (pos - 1, .25), (pos + 1, .15)):
                    if 0 <= t < TOPICS_PER_CLASS:
                        for m in range(night_k):
                            k = (cls, t, m)
                            if k not in library:
                                demand[k] = demand.get(k, 0) + p * P_MISC_SURFACES * MISC_TAIL[m]
            for k, _ in sorted(demand.items(), key=lambda kv: -kv[1])[:night_cap]:
                library.add(k); builds += 1
        for cls, off in kids:
            if r.random() > 0.8 or r.random() > P_MISC_SURFACES:
                continue
            pos = int(round(cal + off))
            x = r.random()
            t = pos if x < .6 else (pos - 1 if x < .85 else pos + 1)
            if not (0 <= t < TOPICS_PER_CLASS):
                continue
            m = pick(r, range(5), MISC_TAIL)
            surfaced += 1
            k = (cls, t, m)
            if k in library:
                served += 1
            elif inlesson:
                builds += 1; library.add(k)
                if r.random() < P_READY_INLESSON:
                    served += 1
    return surfaced, served / max(1, surfaced), builds, builds * PRICE["g2_build"], seeded

# ───────────────────────── S3: per-child-day marginal content spend ─────────────────────────
def s3(rng, n=20000):
    days = []
    for _ in range(n):
        fills = max(0, int(rng.gauss(8, 3)))             # T1/G1 fills per day (module mounts that miss the per-child cache) [U]
        diagrams = rng.choice([0, 0, 1, 1, 2, 3])        # live scene-DSL diagrams [U]
        tts_min = max(0.0, rng.gauss(2.0, 1.0)) if rng.random() < 0.5 else 0.0   # per-child narration not covered by shared clips [U]
        story = 1 if rng.random() < 0.3 else 0           # a personalised story text (luna) [U]
        worksheet = 1 if rng.random() < 0.2 else 0      # filled print template (luna) [U]
        miss_share = PRICE["g2_build"] * (1 if rng.random() < 0.02 else 0) * 0.2  # a child who triggers a library miss is charged 20% [policy U]
        cost = (fills * PRICE["g1_fill"] + diagrams * PRICE["svg_dsl"] + tts_min * PRICE["tts_min"]
                + story * PRICE["luna_call"] * 2 + worksheet * PRICE["luna_call"] + miss_share)
        days.append(cost)
    days.sort()
    q = lambda p: days[int(p * (len(days) - 1))]
    caps = {c: sum(1 for d in days if d > c) / len(days) for c in (0.10, 0.25, 0.60)}
    return st.mean(days), q(.5), q(.9), q(.99), caps

if __name__ == "__main__":
    rng = random.Random(SEED)
    print("S1 reuse, 30 days, remediation-game requests (misconception surfaced)")
    print(f"{'children':>9} {'scheme':<22} {'requests':>9} {'builds':>7} {'hit':>6} {'spend $':>10} {'$/child-day':>11}")
    for n in (1000, 10000, 100000):
        for name, (req, miss, hit, spend, pcd) in s1(n, random.Random(SEED + n)).items():
            print(f"{n:>9} {name:<22} {req:>9} {miss:>7} {hit:>6.1%} {spend:>10.0f} {pcd:>11.4f}")
    print("\nS2 anticipation, moving syllabus, 30 days")
    print(f"{'children':>9} {'policy':<44} {'surfaced':>9} {'served-ready':>12} {'builds':>7} {'spend $':>9} {'one-off seed builds':>20}")
    pols = [("P0 build-on-miss only", 0, 0, False), ("P1 night top-1 misc, cap 50/night", 1, 50, False),
            ("P2 night top-3 misc, cap 150/night", 3, 150, False), ("P3 night top-3, cap 400/night", 3, 400, False),
            ("P4 seeded catalogue (top-2) + P2", 3, 150, True)]
    for n in (300, 3000, 30000):
        for name, k, cap, seed in pols:
            sf, sv, b, sp, sd = s2(n, rng, k, cap, True, seed)
            print(f"{n:>9} {name:<44} {sf:>9} {sv:>12.1%} {b:>7} {sp:>9.0f} {sd:>9} (${sd * PRICE['g2_build']:.0f})")
    print("\nS3 marginal per-child content spend per day (excludes live voice)")
    mean, p50, p90, p99, caps = s3(random.Random(SEED + 3))
    print(f"mean ${mean:.3f}  p50 ${p50:.3f}  p90 ${p90:.3f}  p99 ${p99:.3f}")
    for c, share in caps.items():
        print(f"  share of child-days above ${c:.2f}: {share:.2%}")
