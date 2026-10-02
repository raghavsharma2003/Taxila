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

# ════════════════════════════════════════════════════════════════════════════════════════════════════════════
# G1 rerun (gap-fill G1-adaptation-policy, 2026-10-02). Everything above is unchanged and reproduces its seed-11
# tables. Below: 8 independent seeds (11..18), each with its own generator, N_CHILD children x 40 sittings.
#  - oscillation   = latch flips (on->off or off->on) per child per 8 weeks
#  - false latch   = share of children whose latch is EVER on in 8 weeks under a persona with no real change
#  - R2 is evaluated the way the Conductor will run it: at every night fold, over the last RING closes only
#    (the CloseLite ring), not once over all 40 sittings as the one-shot table above does.
#  - R6 pace: a nightly MAP eta refit (prior N(0, .5^2), kt §2.5) with per-opportunity Fisher information I_OPP [U].
# ════════════════════════════════════════════════════════════════════════════════════════════════════════════
import sys
SEEDS = list(range(11, 19))
RING = 16

def latch_kofm(bad, k, m, r):
    return rule_on_off(bad, k, m, r)

def r2_latch(bad, late, ring, n_min, gap_on, gap_off):
    """Night-fold R2 over the last `ring` closes. ON when >= n_min late AND >= n_min early closes in the ring and the
    late-minus-early bad-close rate >= gap_on. OFF when the gap < gap_off or either arm drops below n_min."""
    C, Ln = bad.shape
    st = np.zeros_like(bad, dtype=bool); on = np.zeros(C, dtype=bool)
    for t in range(Ln):
        lo = max(0, t - ring + 1)
        b, l = bad[:, lo:t + 1], late[:, lo:t + 1]
        nl, ne = l.sum(1), (~l).sum(1)
        bl = (b & l).sum(1) / np.maximum(nl, 1); be = (b & ~l).sum(1) / np.maximum(ne, 1)
        ok = (nl >= n_min) & (ne >= n_min)
        on = np.where(~on & ok & (bl - be >= gap_on), True, on)
        on = np.where(on & (~ok | (bl - be < gap_off)), False, on)
        st[:, t] = on
    return st

def summarise(st):
    fl = flips(st); ever = st.any(1)
    return fl.mean(), np.median(fl), np.percentile(fl, 90), ever.mean(), st.mean()

def pace_sim(g, eta_true, days=40, opps_per_day=8, i_opp=0.05, enter=0.5, exit_=0.25, agree=2, min_opps=30,
             naive=False):
    """Budget state per refit: 1 = default, 2 = up, 0 = down. Naive = single threshold +-enter, no agree, no band."""
    C = eta_true.shape[0]
    n = np.arange(1, days + 1) * opps_per_day
    score = np.cumsum(g.normal(eta_true[:, None] * i_opp * opps_per_day, np.sqrt(i_opp * opps_per_day),
                               size=(C, days)), axis=1)
    est = score / (n * i_opp + 1 / 0.25)                      # MAP posterior mean under N(0, .5^2)
    state = np.ones(C, dtype=int); run_up = np.zeros(C, int); run_dn = np.zeros(C, int); run_back = np.zeros(C, int)
    out = np.zeros((C, days), dtype=int)
    for d in range(days):
        e = est[:, d]; elig = n[d] >= min_opps
        if naive:
            state = np.where(~elig, 1, np.where(e >= enter, 2, np.where(e <= -enter, 0, 1)))
        else:
            run_up = np.where(elig & (e >= enter), run_up + 1, 0)
            run_dn = np.where(elig & (e <= -enter), run_dn + 1, 0)
            back = ((state == 2) & (e < exit_)) | ((state == 0) & (e > -exit_))
            run_back = np.where(back, run_back + 1, 0)
            new = state.copy()
            new = np.where((state == 1) & (run_up >= agree), 2, new)
            new = np.where((state == 1) & (run_dn >= agree), 0, new)
            new = np.where((state != 1) & (run_back >= agree), 1, new)
            run_back = np.where(new != state, 0, run_back)
            state = new
        out[:, d] = state
    return out

if '--no-g1' not in sys.argv:
    rows = {k: [] for k in ['R1 chosen 3/4 r3', 'R1 naive 1/1 r1', 'R1 alt 3/5 r3']}
    hit = {k: [] for k in rows}; r2rows = {}
    pace_rows = {}
    for s in SEEDS:
        g = np.random.default_rng(s)
        hours = g.choice([17, 18, 19, 20, 21], size=(N_CHILD, L), p=[.2, .3, .25, .15, .1])
        late = hours >= 20
        steady = g.random((N_CHILD, L)) < .15
        tee = g.random((N_CHILD, L)) < .65
        tev = g.random((N_CHILD, L)) < np.where(late, .70, .15)
        for name, (k, m, r) in zip(rows, [(3, 4, 3), (1, 1, 1), (3, 5, 3)]):
            rows[name].append(summarise(latch_kofm(steady, k, m, r)))
            hit[name].append(latch_kofm(tee, k, m, r).any(1).mean())
        for (n_min, gon, goff) in [(4, .30, .30), (4, .30, .15), (4, .40, .20), (5, .40, .20)]:
            key = f'R2 ring{RING} n>={n_min} on>={gon:.2f} off<{goff:.2f}'
            a = summarise(r2_latch(steady, late, RING, n_min, gon, goff))
            b = r2_latch(tev, late, RING, n_min, gon, goff).any(1).mean()
            r2rows.setdefault(key, []).append((*a, b))
        for i_opp in [0.05, 0.10]:
            for label, eta in [('steady eta=0', 0.0), ('near eta=+0.3', 0.3), ('fast eta=+0.8', 0.8),
                               ('slow eta=-0.8', -0.8)]:
              for kind, naive, agree in [('naive', True, 1), ('hyst2', False, 2), ('hyst3', False, 3)]:
                st = pace_sim(g, np.full(N_CHILD, eta), i_opp=i_opp, naive=naive, agree=agree)
                fl = (np.diff(st, axis=1) != 0).sum(1)
                moved = (st != 1).any(1).mean()
                right = (st[:, -1] == (2 if eta > .5 else 0 if eta < -.5 else 1)).mean()
                first = np.where((st != 1).any(1), np.argmax(st != 1, axis=1) + 1, np.nan)
                pace_rows.setdefault((i_opp, label, kind), []).append(
                    (fl.mean(), np.percentile(fl, 90), moved, right, np.nanmedian(first) if np.isfinite(first).any() else np.nan))

    def ms(v):  # mean and range across seeds
        v = np.array(v); return f'{v.mean():.3f} [{v.min():.3f}-{v.max():.3f}]'
    print(f'\nG1 rerun: seeds {SEEDS[0]}-{SEEDS[-1]} (n = {len(SEEDS)}), {N_CHILD} children x {L} sittings per seed; '
          f'mean [min-max] across seeds')
    print('R1 steady persona (p bad = .15): flips/child/8wk mean, p90 | false latch = ever ON | share of sittings ON'
          ' || tired_every_evening hit (ever ON)')
    for name in rows:
        a = np.array(rows[name])
        print(f'  {name:18s} flips {ms(a[:, 0])}  p90 {a[:, 2].mean():.1f}  false-latch {ms(a[:, 3])}  '
              f'on-share {ms(a[:, 4])}  || hit {ms(hit[name])}')
    print(f'R2 night-fold over the last {RING} closes: steady false latch (ever ON), flips; tired_evening hit')
    for key, v in r2rows.items():
        a = np.array(v)
        print(f'  {key:38s} flips {ms(a[:, 0])}  false-latch {ms(a[:, 3])}  hit {ms(a[:, 5])}')
    print('R6 pace (40 nightly refits, 8 opps/day): flips/child mean, p90 | ever moved off 1 | correct at day 40 | '
          'median first move (day)')
    for (i_opp, label, kind), v in pace_rows.items():
        a = np.array(v)
        print(f'  I={i_opp:.2f} {label:15s} {kind:5s} flips {ms(a[:, 0])}  p90 {a[:, 1].mean():.1f}  '
              f'moved {ms(a[:, 2])}  correct {ms(a[:, 3])}  first {np.nanmean(a[:, 4]):.1f}')
