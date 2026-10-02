"""adaptation-hysteresis-sim.py: picks the hysteresis constants for the cross-day adaptation rules in
adaptation-policy.md (R1 shorten-on-strain, R2 late-sitting, R6 pace) and sizes the plan-level MRTs (§9).

Generative assumptions are [U]; the arithmetic is reproducible: numpy, seed 11, < 5 s.
Run: python3 docs/research/conductor/adaptation-hysteresis-sim.py
"""
import numpy as np
from math import sqrt
rng = np.random.default_rng(11)

N_CHILD, WEEKS, PER_WEEK = 2000, 8, 5           # 40 lessons per simulated child
L = WEEKS * PER_WEEK

def personas():
    """p(close in {strained, tired}) per lesson and the lesson's local start hour."""
    out = {}
    hours = rng.choice([17, 18, 19, 20, 21], size=(N_CHILD, L), p=[.2, .3, .25, .15, .1])
    out['steady'] = (np.full((N_CHILD, L), .15), hours)                       # base rate [U]
    late = hours >= 20
    out['tired_evening'] = (np.where(late, .70, .15), hours)                 # tired only late
    # every sitting is late for this variant (tuition till 19:30)
    h2 = rng.choice([20, 21], size=(N_CHILD, L), p=[.6, .4])
    out['tired_every_evening'] = (np.full((N_CHILD, L), .65), h2)
    rec = np.full((N_CHILD, L), .60); rec[:, L // 2:] = .10                 # strained month, then fine
    out['recovering'] = (rec, hours)
    return out

def rule_on_off(bad, k, m, r):
    """ON after >= k bad closes in the last m; OFF after r consecutive fine closes. Returns state per lesson."""
    st = np.zeros_like(bad, dtype=bool)
    on = np.zeros(bad.shape[0], dtype=bool); fine_run = np.zeros(bad.shape[0], dtype=int)
    for t in range(bad.shape[1]):
        lo = max(0, t - m + 1)
        nbad = bad[:, lo:t + 1].sum(1)
        fine_run = np.where(bad[:, t], 0, fine_run + 1)
        on = np.where(~on & (nbad >= k) & (t + 1 >= m), True, on)
        on = np.where(on & (fine_run >= r), False, on)
        st[:, t] = on
    return st

def flips(st):
    return (np.diff(st.astype(int), axis=1) != 0).sum(1)

P = personas()
draws = {k: rng.random((N_CHILD, L)) < p for k, (p, h) in P.items()}
print('R1 shorten-on-strain: share of lessons with the rule ON, flips per 8 weeks (median, p90), detection latency')
print(f"{'k/m, r':10s} {'steady on':>10s} {'steady flips':>13s} {'tired on':>9s} {'tired lat':>10s} {'recov off-lat':>14s}")
for k, m, r in [(1, 1, 1), (2, 3, 2), (2, 3, 3), (3, 4, 3), (3, 5, 3), (3, 5, 4)]:
    s = rule_on_off(draws['steady'], k, m, r)
    t = rule_on_off(draws['tired_every_evening'], k, m, r)
    rv = rule_on_off(draws['recovering'], k, m, r)
    first_on = np.argmax(t, axis=1).astype(float); first_on[~t.any(1)] = np.nan
    half = L // 2
    after = rv[:, half:]
    # lessons after recovery until the rule is first OFF (if it was ON at the change point)
    was_on = rv[:, half - 1]
    lat_off = np.where(was_on, np.argmax(~after, axis=1), np.nan)
    fl = flips(s)
    print(f"{k}/{m}, r={r:<3d} {s.mean():10.3f} {np.median(fl):6.0f} / {np.percentile(fl, 90):<5.0f} "
          f"{t.mean():9.3f} {np.nanmedian(first_on) + 1:10.1f} {np.nanmedian(lat_off) + 1:14.1f}")

# R2 late-sitting rule: compare tired-close rate late (>= 20:00) vs early, per child, needs n per arm
print('\nR2 late-sitting: P(rule fires) by persona when it needs >= n late AND >= n early closes, late-early gap >= .30')
for n in [3, 4, 5, 6]:
    row = []
    for name in ['steady', 'tired_evening']:
        p, h = P[name]; bad = draws[name]; late = h >= 20
        nl, ne = late.sum(1), (~late).sum(1)
        bl = (bad & late).sum(1) / np.maximum(nl, 1); be = (bad & ~late).sum(1) / np.maximum(ne, 1)
        fire = (nl >= n) & (ne >= n) & (bl - be >= .30)
        row.append(fire.mean())
    print(f"  n={n}: steady (false fire) {row[0]:.3f}   tired_evening (hit) {row[1]:.3f}")

# Power for plan-level micro-randomised trials (two proportions, alpha .05 two-sided, power .80)
def n_per_arm(p0, p1, z_a=1.959964, z_b=0.841621):
    pb = (p0 + p1) / 2
    return ((z_a * sqrt(2 * pb * (1 - pb)) + z_b * sqrt(p0 * (1 - p0) + p1 * (1 - p1))) / (p1 - p0)) ** 2

print('\nPlan-level MRT sizing (decisions, both arms; child-months at 20 eligible decisions per child-month)')
print('  design effect 1 + (m - 1) * rho, m = 20 decisions per child; lower bound rho = 0 (within-child gain ignored)')
for p0, d in [(.70, .05), (.70, .08), (.70, .10), (.55, .08)]:
    n = 2 * n_per_arm(p0, p0 + d)
    for rho in [0.0, 0.05, 0.10]:
        de = 1 + 19 * rho
        print(f"  base {p0:.2f} +{d*100:.0f} pp, rho {rho:.2f}: {n*de:7.0f} decisions = {n*de/20:6.0f} child-months")
