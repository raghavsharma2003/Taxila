#!/usr/bin/env python3
"""Per-topic lesson-image library hit rate (CM4-img) under three prefetch rankings and a nightly image quota.

content-orchestration.md §9 (gap-fill G2-content-orchestration-media, 2026-10-02). Stdlib only, seeded, ~20 s.
Every input is [U] (design assumption) unless marked; outputs are [sim], not measurements.

Model.
- 9 classes x 82 topics (742 curriculum topics / 9 [V repo count via animation-video §8]); each lesson topic uses
  ROLES = 3 library images (a scene, a story panel, a context still) [U].
- Two boards (CBSE, RBSE) whose calendars run the same topics in different chapter orders [U]; children split 70/30.
- The class calendar advances one topic every 2.5 school days [U]. Each child sits at an offset ~ N(0, 3 topics)
  from its board calendar (MO §7.4's assumption) and drifts +-1 with p = .1 a day [U]; opens on 70% of days [U].
- Nightly, the forge.prefetch job builds at most Q images (the lesson-image share of the 4 RPM quota: 4 RPM =
  240/h [V decisions], 22:30-05:30 = 1,680/night if nothing else used it).
- A lesson-image request is a HIT if that (topic, role) key is published before the lesson. Misses fall back to
  SVG/none (never generated live: AP1, MO R2).
Policies.
- calendar: the board calendars' next 14 days of topics, earliest first use first (what X10's "topic-level
  prefetch of the next two weeks of syllabus" means read literally).
- demand: score = sum over children of P(child is on that topic on day d) * gamma^d over 14 days, using each
  child's own observed offset (aggregate counts only: no child field reaches the key, V14/I-F2).
- demand+edf: demand score, but keys whose first expected use is <= 2 days away go first (the doc's ruling).
"""
import random, math, statistics

CLASSES, TOPICS, ROLES = 9, 82, 3
DAYS, HORIZON, GAMMA = 30, 14, 0.9
PACE = 2.5

def board_order(board, cls):
    order = list(range(TOPICS))
    if board == 1:                                    # RBSE: same chapters, blocks of 10 rotated
        rng = random.Random(1000 + cls)
        blocks = [order[i:i + 10] for i in range(0, TOPICS, 10)]
        rng.shuffle(blocks)
        order = [t for b in blocks for t in b]
    return order

def run(n_children, quota, policy, seed):
    rng = random.Random(seed)
    orders = {(b, c): board_order(b, c) for b in (0, 1) for c in range(CLASSES)}
    start = {c: rng.randrange(0, 20) for c in range(CLASSES)}            # where each class is on day 0
    kids = []
    for _ in range(n_children):
        c = rng.randrange(CLASSES); b = 0 if rng.random() < 0.7 else 1
        kids.append([c, b, round(rng.gauss(0, 3))])
    def topic_of(k, day):
        c, b, off = k
        pos = int(start[c] + day / PACE) + off
        pos = max(0, min(TOPICS - 1, pos))
        return (c, orders[(b, c)][pos])
    lib = set()
    hits = misses = 0; early = [0, 0]
    for day in range(DAYS):
        # night before `day`: build up to `quota` keys
        cand = {}
        if policy == 'calendar':
            for (b, c), order in orders.items():
                for d in range(HORIZON):
                    pos = max(0, min(TOPICS - 1, int(start[c] + (day + d) / PACE)))
                    t = (c, order[pos])
                    for r in range(ROLES):
                        k = (t, r)
                        if k not in lib: cand[k] = min(cand.get(k, 99), d)
            ranked = sorted(cand, key=lambda k: (cand[k], k))
        else:
            score, first = {}, {}
            for kd in kids:
                for d in range(HORIZON):
                    t = topic_of(kd, day + d)
                    for r in range(ROLES):
                        k = (t, r)
                        if k in lib: continue
                        score[k] = score.get(k, 0) + 0.7 * GAMMA ** d
                        first[k] = min(first.get(k, 99), d)
            if policy == 'demand':
                ranked = sorted(score, key=lambda k: (-score[k], k))
            else:
                ranked = sorted(score, key=lambda k: (first[k] > 2, -score[k], k))
        for k in ranked[:quota]: lib.add(k)
        # day: lessons
        for kd in kids:
            if rng.random() < 0.1: kd[2] += rng.choice((-1, 1))
            if rng.random() >= 0.7: continue
            t = topic_of(kd, day)
            for r in range(ROLES):
                h = (t, r) in lib
                hits += h; misses += (not h)
                if day < 3: early[0] += h; early[1] += 1
    return hits / (hits + misses), early[0] / max(1, early[1]), len(lib)

if __name__ == '__main__':
    print("children quota/night policy        CM4-img(30d)  days1-3   images built   (mean of 4 seeds)")
    for n in (300, 3000):
        for q in (100, 300, 1680):
            for pol in ('calendar', 'demand', 'demand+edf'):
                rs = [run(n, q, pol, s) for s in range(4)]
                print(f"{n:8d} {q:11d} {pol:12s} {statistics.mean(r[0] for r in rs):10.3f} {statistics.mean(r[1] for r in rs):10.3f} {statistics.mean(r[2] for r in rs):12.0f}")
