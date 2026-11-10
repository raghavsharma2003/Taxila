# Round 7 F (director6, dc-r7-script-walk-v4): replace the kit card characters "Riya"/"Asha" with the {friendF} slot
# (Brain fills it in findItem with a girl's name that is never the child's). Fields the runtime does not fill (worked
# examples, passages) get the fixed name Nisha; a unit already naming Zoya/Meera/Tara/Diya renames that character first.
# Each file keeps its own JSON format. The Games banks (data/arena, data/play) fill {friendF} too (server/play/levels.js), so run both:
#   python3 scripts/kits/friend-slot.py && node server/play/tools/build-arena.mjs && node server/play/tools/build-vakya.mjs
import json,glob,re,sys
NAME=re.compile(r"(?<![A-Za-z])(Riya|Asha)(?![A-Za-z])")
FN=re.compile(r"(?<![A-Za-z])(Zoya|Meera|Tara|Diya)(?![A-Za-z])")
SWAP={"Zoya":"Pooja","Meera":"Kavya","Tara":"Sana","Diya":"Ritu"}
FIXED="Nisha"
def walk(x,fn):
    if isinstance(x,dict): return {k:walk(v,fn) for k,v in x.items()}
    if isinstance(x,list): return [walk(v,fn) for v in x]
    if isinstance(x,str): return fn(x)
    return x
stats={"slot":0,"fixed":0,"swap":0,"files":0}
for f in sorted(glob.glob("data/kits/*.json")):
    raw=open(f).read(); d=json.loads(raw); changed=False
    fmt=None
    for ind in (1,2,None):
        for asc in (False,True):
            for tail in ("","\n"):
                if json.dumps(d,ensure_ascii=asc,indent=ind)+tail==raw: fmt=(ind,asc,tail)
    assert fmt, f
    for t in d.get("topics",[]):
        for key in ("items","misconceptions"):
            out=[]
            for u in t.get(key,[]):
                s=json.dumps(u,ensure_ascii=False)
                if NAME.search(s):
                    names=set(NAME.findall(s))
                    if FN.search(s): u=walk(u,lambda x: FN.sub(lambda m: SWAP[m.group(1)],x)); stats["swap"]+=1
                    if len(names)>1: u=walk(u,lambda x: re.sub(r"(?<![A-Za-z])Asha(?![A-Za-z])",FIXED,x))
                    u=walk(u,lambda x: NAME.sub("{friendF}",x)); stats["slot"]+=1; changed=True
                out.append(u)
            if key in t: t[key]=out
        for k in list(t.keys()):
            if k in ("items","misconceptions"): continue
            s=json.dumps(t[k],ensure_ascii=False)
            if NAME.search(s): t[k]=walk(t[k],lambda x: NAME.sub(FIXED,x)); stats["fixed"]+=1; changed=True
    if changed:
        open(f,"w").write(json.dumps(d,ensure_ascii=fmt[1],indent=fmt[0])+fmt[2]); stats["files"]+=1
print(stats)
