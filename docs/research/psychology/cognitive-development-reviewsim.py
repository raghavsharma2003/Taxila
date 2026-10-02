"""Methodologist review addendum (2026-10-02): EZ-diffusion robustness and block reliability.

Re-runs and extends the review's EZ check (R2 P5) so the numbers are reproducible from the repo.
Vectorised Euler diffusion, s = 0.1, dt = 1 ms, unbiased start z = a/2.
Questions:
  Q1  does the proposed trim rule (RT > 2.5 s or < 0.2 s removed) repair slow-lapse bias?
  Q2  how often does a 30-trial block hit the Pc = 1 edge correction at child-like accuracy?
  Q3  what is the reliability of a single-block EZ drift rate v, given an ASSUMED between-child spread? [U]
Run: python3 cognitive-development-reviewsim.py
"""
import numpy as np

rng = np.random.default_rng(7)
S = 0.1


def ddm(v, a, ter, n, dt=0.001, tmax=6.0):
    """Vectorised Euler simulation. v may be scalar or array of length n."""
    v = np.broadcast_to(np.asarray(v, float), (n,)).copy()
    x = np.full(n, a / 2.0)
    t = np.zeros(n)
    done = np.zeros(n, bool)
    cor = np.zeros(n, bool)
    sd = S * np.sqrt(dt)
    steps = int(tmax / dt)
    for _ in range(steps):
        idx = ~done
        if not idx.any():
            break
        x[idx] += v[idx] * dt + sd * rng.standard_normal(idx.sum())
        t[idx] += dt
        up = idx & (x >= a)
        lo = idx & (x <= 0)
        cor[up] = True
        done |= up | lo
    return t + ter, cor


def ez(pc, vrt, mrt, n):
    """Wagenmakers, van der Maas & Grasman 2007 (PBR 14:3-22), eqs 5-9, appendix R code.
    MRT/VRT from CORRECT RTs only (their note 7). Edge correction Pc=1 -> 1 - 1/(2n)."""
    if pc >= 1:
        pc = 1 - 1 / (2 * n)
    if pc == 0.5:
        pc = 0.5 + 1 / (2 * n)
    L = np.log(pc / (1 - pc))
    x = L * (L * pc * pc - L * pc + pc - 0.5) / vrt
    v = np.sign(pc - 0.5) * S * x ** 0.25
    a = S * S * L / v
    y = -v * a / (S * S)
    mdt = (a / (2 * v)) * (1 - np.exp(y)) / (1 + np.exp(y))
    return v, a, mrt - mdt


def fit(rt, c):
    return ez(c.mean(), rt[c].var(), rt[c].mean(), len(c))


V, A, TER = 0.20, 0.14, 0.45
N = 20000
rt, c = ddm(V, A, TER, N)
print(f"true v={V} a={A} Ter={TER}  acc={c.mean():.3f}")
print("clean                 v=%.3f a=%.3f Ter=%.3f" % fit(rt, c))

# Q1: slow lapses, with and without trimming
for lapse in (0.01, 0.03, 0.05):
    r = rt.copy()
    k = int(lapse * N)
    r[:k] = rng.uniform(2.0, 5.0, k)
    raw = fit(r, c)
    keep = (r < 2.5) & (r > 0.2)
    trimmed = fit(r[keep], c[keep])
    print(f"{int(lapse*100)} pct lapses 2-5 s   raw v=%.3f a=%.3f Ter=%.3f" % raw,
          "| trimmed v=%.3f a=%.3f Ter=%.3f" % trimmed)
# Lapses that are NOT extreme (1-2.5 s: a distracted but not absent child) survive a 2.5 s trim
r = rt.copy()
k = int(0.05 * N)
r[:k] = rng.uniform(1.0, 2.5, k)
keep = (r < 2.5) & (r > 0.2)
print("5%% mid lapses 1-2.5 s trimmed v=%.3f a=%.3f Ter=%.3f" % fit(r[keep], c[keep]))

# Q2: edge-correction frequency per block
for nb in (30, 60):
    hits = 0
    vs = []
    for _ in range(2000):
        idx = rng.choice(N, nb, replace=False)
        if c[idx].all():
            hits += 1
        vs.append(fit(rt[idx], c[idx])[0])
    vs = np.array(vs)
    print(f"{nb}-trial blocks: Pc=1 edge-corrected in {100*hits/2000:.0f} pct; v mean %.3f sd %.3f cv %.2f"
          % (vs.mean(), vs.std(), vs.std() / vs.mean()))

# Q3: single-block reliability of v across simulated children with an ASSUMED true SD of v
for true_sd in (0.03, 0.05):
    kids = 300
    vtrue = np.clip(rng.normal(V, true_sd, kids), 0.05, None)
    est = np.zeros((kids, 2))
    for b in range(2):
        rr, cc = ddm(np.repeat(vtrue, 30), A, TER, kids * 30)
        rr = rr.reshape(kids, 30)
        cc = cc.reshape(kids, 30)
        for i in range(kids):
            est[i, b] = fit(rr[i], cc[i])[0]
    r_tt = np.corrcoef(est[:, 0], est[:, 1])[0, 1]
    print(f"assumed true SD(v)={true_sd}: two 30-trial blocks, parallel-forms r = {r_tt:.2f}")
