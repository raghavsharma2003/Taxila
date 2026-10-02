# temperament-vibe.md calculations (2026-10-02). Reproduce: python3 temperament-vibe-calc.py
# A: tercile-label accuracy at a given estimate-trait correlation (bivariate normal, Monte Carlo n=2e6, seed 7)
# B: empirical-Bayes reliability of a per-child contingency slope; C: Spearman-Brown; D: decay weights; E: PPV of a label
import numpy as np
rng=np.random.default_rng(7)
N=2_000_000
print("A. Label accuracy when an estimate correlates r with the true trait (tercile labels)")
print(" r     P(true top|labelled top)  P(true bottom|labelled top)  P(exact tercile agree)")
for r in [0.117,0.27,0.30,0.44,0.60,0.80]:
    T=rng.standard_normal(N); E=r*T+np.sqrt(1-r*r)*rng.standard_normal(N)
    qT=np.quantile(T,[1/3,2/3]); qE=np.quantile(E,[1/3,2/3])
    tT=np.digitize(T,qT); tE=np.digitize(E,qE)
    top=tE==2
    print(f" {r:.3f}  {np.mean(tT[top]==2):.2f}                      {np.mean(tT[top]==0):.2f}                         {np.mean(tT==tE):.2f}")
print()
print("B. Reliability of a child's if-then contingency slope (logit scale), p~0.5, n trials split evenly")
print(" tau(between-child SD)  n=20   n=40   n=80   n=160  n=320   n for rel .70")
for tau in [0.25,0.5,0.75,1.0]:
    row=[]
    for n in [20,40,80,160,320]:
        se2=16/n  # var of difference of two logits, n/2 each, p=.5 -> 2*(1/((n/2)*.25))
        row.append(tau**2/(tau**2+se2))
    nreq=16*0.7/(0.3*tau**2)
    print(f" {tau:.2f}                  "+"  ".join(f"{x:.2f} " for x in row)+f"  {nreq:.0f}")
print()
print("C. Spearman-Brown: sessions k needed for aggregate reliability target")
print(" rho1   k(.70)  k(.80)")
for r1 in [0.1,0.2,0.3,0.4,0.5]:
    k=lambda t: t*(1-r1)/(r1*(1-t))
    print(f" {r1:.1f}    {k(.7):.1f}    {k(.8):.1f}")
print()
print("D. Decay: half-life H days -> weight of evidence from d days ago; effective memory")
for H in [30,60,90]:
    print(f" H={H}: w(30d)={0.5**(30/H):.2f} w(90d)={0.5**(90/H):.2f} w(180d)={0.5**(180/H):.2f}; mean age of evidence ~ {H/np.log(2):.0f} d")
print()
print("E. Base-rate check for a 'shy' label: if 20% truly high-inhibition and detector sens=.70, spec=.80")
for prev in [0.1,0.2,0.3]:
    sens,spec=.70,.80
    ppv=sens*prev/(sens*prev+(1-spec)*(1-prev))
    print(f" prev={prev:.1f}: PPV={ppv:.2f}  (share of labelled children wrongly labelled = {1-ppv:.2f})")
