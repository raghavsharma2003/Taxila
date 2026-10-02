"""E2: per-character stylisation (bigger eyes): does blink=1 still cover the cornea?
naive delta transfer (W(neutral)+delta) vs warp-baked (W(neutral+delta)). Metric: % of rays from the eyeball
centre through cornea vertices that escape the face/lid surface (0% = fully closed)."""
import sys,os,json; sys.path.insert(0,'exp'); import numpy as np
from load import v, F
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
n=v('generic_neutral_mesh'); NF=9409
faces=[]
for l in open(os.path.join(F,'generic_neutral_mesh.obj')):
    if l.startswith('f '):
        idx=[int(t.split('/')[0])-1 for t in l.split()[1:]]
        if max(idx)<NF: faces.append(idx)
EYE={'L':np.arange(21451,23021),'R':np.arange(23021,24591)}
def visible(shape, side):
    eb=EYE[side]; c=shape[eb].mean(0)
    # cornea = forward-most 15% of eyeball verts (z is forward in ICT space)
    z=shape[eb,2]; cor=eb[z>np.quantile(z,0.85)]
    bvh=BVHTree.FromPolygons([Vector(p) for p in shape[:NF]], faces)
    esc=0
    for i in cor:
        o=Vector(shape[i]); dvec=(o-Vector(c)).normalized()
        hit=bvh.ray_cast(o+dvec*0.01, dvec, 3.0)
        esc+= hit[0] is None
    return 100*esc/len(cor)
def d(name): return v(name)-n
def W(x,s,rad=2.2):
    y=x.copy()
    for side in ('L','R'):
        c=n[EYE[side]].mean(0); rel=x-c; w=np.exp(-(np.linalg.norm(rel,axis=1)/rad)**2)[:,None]; y=y+rel*(s-1)*w
    return y
res={}
bl=d('eyeBlink_L')
res['base_open_visible_%']=round(visible(n,'L'),1); res['base_blink_visible_%']=round(visible(n+bl,'L'),1)
for s in (1.15,1.3,1.5):
    res[f'eye_scale_{s}']={'open':round(visible(W(n,s),'L'),1),'naive_blink':round(visible(W(n,s)+bl,'L'),1),'baked_blink':round(visible(W(n+bl,s),'L'),1)}
# half blink check: naive vs baked at 0.5 should both be partial
print(json.dumps(res,indent=1)); json.dump(res,open('exp/out/e2.json','w'),indent=1)
