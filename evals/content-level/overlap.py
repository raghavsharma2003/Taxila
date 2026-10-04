# Near-duplicate check (objective, judge-free): for each class 4-7 item, the max token-Jaccard of its prompt_en against every
# item prompt in classes <= C-2. Run: python3 evals/content-level/overlap.py
import json, glob, re
STOP=set("the a an is are of to in and what how many which do does you your it its this that for on with be was were".split())
def toks(s): return {w for w in re.findall(r"[a-z0-9]+", (s or "").lower()) if w not in STOP and len(w)>1}
items={}
for f in glob.glob("data/kits/c*-*.json"):
    d=json.load(open(f))
    for t in d["topics"]:
        for i in t["items"]: items.setdefault(d["class"],[]).append((i["id"],toks(i.get("prompt_en")),i.get("prompt_en","")))
for c in [4,5,6,7]:
    lower=[x for k in items if k<=c-2 for x in items[k] if len(x[1])>=3]
    hits=[]
    for iid,tk,p in items[c]:
        if len(tk)<3: continue
        best=max(((len(tk&o[1])/len(tk|o[1])),o) for o in lower) if lower else (0,None)
        if best[0]>=0.5: hits.append((round(best[0],2),iid,p[:90],best[1][0],best[1][2][:90]))
    print(f"class {c}: {len(hits)}/{len(items[c])} items have a >=0.5 Jaccard near-duplicate in classes <= {c-2}")
    for h in sorted(hits,reverse=True)[:6]: print("  ",h)
