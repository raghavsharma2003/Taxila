# Verify pass 2026-10-04: per-utterance false LEADING-filler rate on FLEURS read speech (hi_in vs en_us), mirroring
# gruInput.fillerRuns leadMs, plus the AMI test filler base rate. usage: python3 lead_fa.py <work_dir with vs/fleurs/feat, vs/ami/feat>
import sys, json, glob, os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import train_filler as tf, onnxruntime as ort
S=sys.argv[1]; thr=0.44
sess=ort.InferenceSession('/home/user/Taxila/models/voicesig/filler-gru.onnx', providers=['CPUExecutionProvider'])
def pred(d):
    p=np.zeros(len(d['t']),np.float32)
    for a,b in zip(d['seg'][:-1],d['seg'][1:]): p[a:b]=sess.run(None,{'x':d['x'][a:b][None]})[0][0]
    return p
def utts(sp, gap=30):  # utterances = speech separated by >= gap frames (600 ms) of non-speech
    idx=np.nonzero(sp>0)[0]; out=[]
    if not len(idx): return out
    s=idx[0]; prev=idx[0]
    for i in idx[1:]:
        if i-prev>gap: out.append((s,prev+1)); s=i
        prev=i
    out.append((s,prev+1)); return out
def lead(sp,p,a,b):
    # mirror gruInput.fillerRuns leadMs
    on=(sp[a:b]>0)&(p[a:b]>=thr); runs=[]; s=-1
    for i in range(len(on)+1):
        o=i<len(on) and on[i]
        if o and s<0: s=i
        if not o and s>=0:
            if i-s>=10: runs.append((s,i-1))
            s=-1
    first=int(np.argmax(sp[a:b]>0)); L=0; i=first
    for r0,r1 in runs:
        if (sp[a+i:a+r0]>0).any(): break
        L+=(r1-r0+1)*20; i=r1+1
    return L, len(runs)
res={}
for lang in ('hi_in','en_us'):
    d=tf.load(f'{S}/vs/fleurs/feat/{lang}'); p=pred(d); U=utts(d['speech'])
    U=[u for u in U if u[1]-u[0]>=50]
    leads=[lead(d['speech'],p,a,b) for a,b in U]
    durs=np.array([(b-a)*0.02 for a,b in U])
    res[lang]={'utts':len(U),'medianDurS':float(np.median(durs)),'leadGe300':round(np.mean([l>=300 for l,_ in leads]),3),'anyRun':round(np.mean([r>0 for _,r in leads]),3)}
# AMI test: true filler base rate per own-speech minute and lead>=300 on own utterances that start with a filler vs not
fs=[tf.load(s[:-5]) for s in sorted(glob.glob(f'{S}/vs/ami/feat/*.json')) if not s.endswith('regions.json')]
fs=[d for d in fs if d['meta'].get('split')=='test']
fw=sum(1 for d in fs for w in tf.words_of(d) if w[2]==1); spm=sum((d['lab']>=0).sum() for d in fs)*0.02/60
res['amiTest']={'fillerWordsPerOwnWordMin':round(fw/spm,2)}
print(json.dumps(res,indent=1))
