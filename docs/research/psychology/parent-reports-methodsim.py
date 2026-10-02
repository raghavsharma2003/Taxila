"""Methodologist checks for parent-reports.md (2026-10-02).

Reproduces the numbers quoted in parent-reports.md "## Methodologist review".
Pure numpy/scipy; deterministic seeds.  Run: python3 parent-reports-methodsim.py
"""
import numpy as np
from scipy import stats

rng = np.random.default_rng(20261002)

# ---------------------------------------------------------------- 1. §5.2 vocabulary feasibility
print("== 1. Frequency-word rules (§5.2): can they fire at the stated min n? ==")
def post(k, n, a0, b0):
    return stats.beta(a0 + k, b0 + n - k)
for (a0, b0) in [(1, 1), (2, 2)]:
    print(f"prior Beta({a0},{b0})")
    for n in (10, 20, 30, 40):
        usual = [k for k in range(n + 1) if 1 - post(k, n, a0, b0).cdf(.6) >= .9]
        half = [k for k in range(n + 1) if (post(k, n, a0, b0).cdf(.65) - post(k, n, a0, b0).cdf(.35)) >= .8]
        some = [k for k in range(n + 1) if (post(k, n, a0, b0).cdf(.5) - post(k, n, a0, b0).cdf(.1)) >= .8]
        both = sorted(set(half) & set(some))
        print(f"  n={n:2d}  usually k>={min(usual) if usual else '-'}  "
              f"about-half k in {half if half else 'NONE'}  sometimes k in {some if some else 'NONE'}  "
              f"half&sometimes overlap {both if both else 'none'}")

# ---------------------------------------------------------------- 2. PR-D5 budget under screening
print("\n== 2. False-claim budget (PR-D5) when many null candidates are screened ==")
# Each candidate: within-child two-proportion contrast (e.g. retry after question vs after explanation),
# n=12 per arm, independent Beta(1,1) priors (no hierarchical shrinkage), claim if P(p1>p2)>=.9.
def screen(n_cand=30, frac_true=0.1, true_delta=0.2, n=12, base=0.5, reps=4000, eps=0.3):
    false_adm, adm, budget_said = 0, 0, 0.0
    for _ in range(reps):
        is_true = rng.random(n_cand) < frac_true
        p2 = np.full(n_cand, base)
        p1 = np.where(is_true, base + true_delta, base)
        k1 = rng.binomial(n, p1); k2 = rng.binomial(n, p2)
        s1 = rng.beta(1 + k1[:, None], 1 + n - k1[:, None], size=(n_cand, 800))
        s2 = rng.beta(1 + k2[:, None], 1 + n - k2[:, None], size=(n_cand, 800))
        P = (s1 > s2).mean(1)
        elig = np.where(P >= .9)[0]
        order = elig[np.argsort(-P[elig])]
        tot = 0.0
        for i in order:
            if tot + (1 - P[i]) > eps: break
            tot += 1 - P[i]; adm += 1; false_adm += (not is_true[i])
        budget_said += tot
    return adm / reps, false_adm / reps, budget_said / reps
for fr in (0.0, 0.1, 0.3):
    a, f, s = screen(frac_true=fr)
    print(f"  30 candidates, {int(fr*100):2d}% real (+.20): admitted/report {a:.2f}, "
          f"actually false {f:.2f}, budget believed {s:.2f}")

# ---------------------------------------------------------------- 3. n-of-1 time-of-day power (§6.3)
print("\n== 3. n-of-1 slot alternation (§6.3): chance of reaching P(|delta|>delta_min)>=.9 ==")
# 8 one-week blocks (4 per slot), 4 sessions/week, 20 items/session, p ~ .7.
# Week-level random effect sd_w (school-week variation), session-level sd_s (logits).
def n_of_1(delta, sd_w=0.25, sd_s=0.35, sessions=4, items=20, blocks=8, dmin=0.1, reps=3000, directional=False):
    hits = 0
    for _ in range(reps):
        slot = rng.permutation([0, 1] * (blocks // 2))
        week = rng.normal(0, sd_w, blocks)
        diffs = []
        y = []; x = []
        for b in range(blocks):
            for s in range(sessions):
                eta = 0.85 + week[b] + rng.normal(0, sd_s) + delta * slot[b]
                k = rng.binomial(items, 1 / (1 + np.exp(-eta)))
                y.append(np.log((k + .5) / (items - k + .5))); x.append(slot[b])
        y = np.array(y); x = np.array(x)
        # analyse at the block level (the randomised unit): block means, Welch-type t
        bm = np.array([y[i*sessions:(i+1)*sessions].mean() for i in range(blocks)])
        a, c = bm[slot == 1], bm[slot == 0]
        d = a.mean() - c.mean(); se = np.sqrt(a.var(ddof=1)/len(a) + c.var(ddof=1)/len(c))
        # flat-prior posterior ~ t(df) centred at d
        df = blocks - 2
        p = (1 - stats.t.cdf((dmin - d) / se, df)) + stats.t.cdf((-dmin - d) / se, df)
        if directional:
            p = 1 - stats.t.cdf((dmin - d) / se, df)          # P(delta > dmin), correct direction only
        hits += p >= .9
    return hits / reps
# Sievertsen: -0.9% SD per hour. A 4-hour slot gap ~ 3.6% SD; on a logit scale with
# between-child sd ~1.5 logits this is ~0.05 logits. Show 0.05, 0.2, 0.5 logits.
for dl in (0.0, 0.05, 0.2, 0.5):
    print(f"  true delta {dl:.2f} logits -> P(two-sided |delta|>dmin rule fires) {n_of_1(dl):.2f}; "
          f"P(directional delta>dmin >=.9) {n_of_1(dl, directional=True):.2f}")

# ---------------------------------------------------------------- 4. difference-score reliability
print("\n== 4. Reliability of within-child contrasts (Spearman-Brown on a mean does not apply) ==")
def rel_diff(rxx, ryy, rxy):
    return (0.5 * (rxx + ryy) - rxy) / (1 - rxy)
for rxy in (0.3, 0.5, 0.7):
    print(f"  components rho=.80/.80, corr {rxy:.1f} -> difference reliability {rel_diff(.8, .8, rxy):.2f}")

# ---------------------------------------------------------------- 5. Brier 'not sure' = 0.5
print("\n== 5. Parent Brier with f in {1,0,.5} ==")
for q in (0.6, 0.7, 0.8):
    print(f"  parent's true belief p={q}: commit -> expected Brier {q*(1-1)**2*0+ (1-q):.2f} "
          f"vs 'not sure' -> 0.25")

# ---------------------------------------------------------------- 6. RCT sample size
print("\n== 6. RCT per-arm n for 80% power, two-sided alpha .05 ==")
for d in (0.03, 0.05, 0.10):
    n = 2 * (stats.norm.ppf(.975) + stats.norm.ppf(.8)) ** 2 / d ** 2
    print(f"  d={d:.2f}: n per arm ~ {n:,.0f} (before clustering / attrition)")
