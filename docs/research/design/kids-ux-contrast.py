# WCAG 2 contrast check for the candidate Taxila kids palette (kids-ux-ages.md section 4.3).
# Deterministic; written 2026-10-02. Run: python3 docs/research/design/kids-ux-contrast.py
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
L={'bg':'#FFF8EE','surface':'#FFFFFF','ink':'#1F1A14','ink2':'#5A5148','marigold':'#FFB21E','marigoldRing':'#9A5B00','leaf':'#1F7A4D','sky':'#2563C9','slate':'#5B6470','brick':'#B3261E','tile':'#FFFFFF','tileBorder':'#8C8478'}
D={'bg':'#16140F','surface':'#221F19','ink':'#F6F1E8','ink2':'#BDB4A6','marigold':'#FFB21E','leaf':'#4CC38A','sky':'#7FB0FF','slate':'#9AA3AF','brick':'#FF8A80'}
pairs=[('ink','bg'),('ink','surface'),('ink2','bg'),('ink2','surface'),('ink','marigold'),('marigold','bg'),('marigoldRing','bg'),('marigoldRing','marigold'),('surface','leaf'),('leaf','bg'),('surface','sky'),('sky','bg'),('slate','bg'),('surface','brick'),('brick','bg'),('tileBorder','bg'),('tileBorder','surface')]
print('LIGHT'); [print(f'{a:>13} on {b:<8} {L[a]} / {L[b]}  {cr(L[a],L[b]):.2f}') for a,b in pairs]
dp=[('ink','bg'),('ink','surface'),('ink2','bg'),('ink2','surface'),('marigold','bg'),('bg','marigold'),('leaf','bg'),('sky','bg'),('slate','bg'),('brick','bg')]
print('DARK'); [print(f'{a:>13} on {b:<8} {D[a]} / {D[b]}  {cr(D[a],D[b]):.2f}') for a,b in dp]
