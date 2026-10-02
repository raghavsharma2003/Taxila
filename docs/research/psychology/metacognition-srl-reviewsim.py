# Methodologist-review checks on metacognition-srl.md (2026-10-02). Reproduce: python3 metacognition-srl-reviewsim.py (numpy, seed 7, ~20 s). Generative assumptions [U].
# Methodologist review checks for metacognition-srl.md (seed 7). numpy only.
import numpy as np
rng=np.random.default_rng(7); sig=lambda x:1/(1+np.exp(-x))
C=4000
# ---- R1: false-positive rate of the "raw counts change consistently over >=3 consecutive windows" route (6.3 rule 2b)
print("R1. Null world (no true change). Per-row P(3 consecutive windows move monotonically in the growth direction)")
for n,p in [(30,.7),(10,.5),(15,.3)]:
    k=rng.binomial(n,p,(200000,3))
    strict=((k[:,1]>k[:,0])&(k[:,2]>k[:,1])).mean()
    weak=((k[:,1]>=k[:,0])&(k[:,2]>=k[:,1])&(k[:,2]>k[:,0])).mean()
    print(f"   n={n} p={p}: strict {strict:.3f}  non-decreasing-with-net-rise {weak:.3f}")
# 12 monthly windows, 4 rows: P(at least one false 'growth' row in a year), strict rule, any 3-run
k=rng.binomial(30,.7,(20000,4,12))
inc=(np.diff(k,axis=2)>0)
run=(inc[:,:,:-1]&inc[:,:,1:]).any(2)
print(f"   12 windows x 4 rows, n=30: P(>=1 false growth row in a year) = {run.any(1).mean():.2f}; mean false rows/child-year = {run.sum(1).mean():.2f}")
# ---- R2: is kappa_mid accuracy-independent under a standard type-1 SDT confidence model?
print("\nR2. SDT generative model: evidence e~N(+-d'/2,1), choice by sign, confidence from |e|*m + bias + noise; 3 levels")
def sdt(dp, kappa, meta=1.0, n=240):
    s=rng.choice([-1,1],(C,n)); e=s*dp[:,None]/2+rng.standard_normal((C,n))
    o=(np.sign(e)==s).astype(float)
    y=kappa[:,None]+meta*np.abs(e)+0.6*rng.standard_normal((C,n))-1.0
    conf=np.digitize(y,(-0.3,0.6))/2
    return o,conf
dp=np.exp(rng.normal(0.3,0.5,C)); kap=rng.normal(0,0.5,C)   # kappa independent of d'
o,conf=sdt(dp,kap)
nc=o.sum(1); ne=(1-o).sum(1)
mcc=(conf*o).sum(1)/nc; mce=(conf*(1-o)).sum(1)/np.maximum(ne,1)
mid=(mcc+mce)/2; dconf=mcc-mce; bias=conf.mean(1)-o.mean(1)
m=ne>0
for lab,x in [("raw bias",bias),("kappa_mid",mid),("dConf",dconf),("mean conf",conf.mean(1))]:
    print(f"   r({lab:9s}, d')={np.corrcoef(x[m],dp[m])[0,1]:+.2f}   r(.,true kappa)={np.corrcoef(x[m],kap[m])[0,1]:+.2f}")
# ---- R3: ordinal ceiling: kappa_mid depends on psi when kappa is high (B1 parameters of calibsim)
print("\nR3. calibsim's own generative model, B1 means (kappa 1.0), psi varied, kappa FIXED at 1.0, N=240")
TH=(-0.6,0.6)
for psi in [0.0,0.4,0.8,1.2]:
    o=(rng.random((C,240))<0.6).astype(float)
    y=1.0+psi*(2*o-1)+rng.standard_normal((C,240)); conf=np.digitize(y,TH)/2
    mcc=(conf*o).sum(1)/o.sum(1); mce=(conf*(1-o)).sum(1)/(1-o).sum(1)
    print(f"   psi={psi:.1f}: mean kappa_mid={((mcc+mce)/2).mean():.3f}")
# ---- R4: resolution reliability when first-try accuracy is ~.85 (mastery-targeted practice) rather than ~.6
print("\nR4. calibsim model, B3 parameters + session state, accuracy ~.60 vs ~.85; test-retest of dConf; share with <3 errors")
def bets(th,ka,ps,n,bmean):
    b=rng.normal(bmean,0.8,(C,n)); o=(rng.random((C,n))<sig(th[:,None]-b)).astype(float)
    ns=int(np.ceil(n/3)); kS=np.repeat(ka[:,None]+0.5*rng.standard_normal((C,ns)),3,1)[:,:n]
    pS=np.repeat(np.clip(ps[:,None]+0.4*rng.standard_normal((C,ns)),0,None),3,1)[:,:n]
    y=kS+pS*(2*o-1)+rng.standard_normal((C,n)); return o,np.digitize(y,TH)/2
th=rng.standard_normal(C); ka=rng.normal(.4,.6,C); ps=np.clip(rng.normal(1.1,.4,C),0,None)
for bmean,lab in [(-0.4,"~.60"),(-2.0,"~.85")]:
    out=[]
    for n in [30,120]:
        r=[]
        for _ in range(2):
            o,c=bets(th,ka,ps,n,bmean); nc=o.sum(1); ne=(1-o).sum(1)
            with np.errstate(all="ignore"): d=(c*o).sum(1)/nc-(c*(1-o)).sum(1)/ne
            r.append((d,ne,o.mean()))
        mm=np.isfinite(r[0][0])&np.isfinite(r[1][0])
        out.append(f"N={n}: acc {r[0][2]:.2f}, r={np.corrcoef(r[0][0][mm],r[1][0][mm])[0,1]:.2f}, <3 errors {np.mean(r[0][1]<3):.2f}")
    print(f"   accuracy {lab}: "+" | ".join(out))
# ---- R5: mechanical lambda when pL is updated by the help event itself
print("\nR5. lambda endogeneity: true lambda = 0 (asking unrelated to need); KT lowers pL after a help event on the step")
n=300; eta=rng.normal(-1.7,.7,C)
pl=sig(rng.normal(.8,1.5,(C,n))); h=(rng.random((C,n))<sig(eta[:,None])).astype(float)
pl_post=sig(np.log(pl/(1-pl))-1.0*h)   # pL read AFTER the step's help was logged
def slope(w,y):
    w=w-w.mean(1,keepdims=True); return (w*(y-y.mean(1,keepdims=True))).sum(1)/(w*w).sum(1)
print(f"   mean OLS slope of help on need, pL read before: {slope(1-pl,h).mean():+.3f}; read after: {slope(1-pl_post,h).mean():+.3f}")
