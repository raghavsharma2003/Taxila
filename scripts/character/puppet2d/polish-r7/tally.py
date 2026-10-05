"""Re-tally a judge-<round>.json (score may be nested under items for gpt-5.6-sol)."""
import json, sys
from collections import defaultdict
d = json.load(open(sys.argv[1]))
IT = ["I1", "I2", "I3", "S1", "S2", "S3", "E1", "E2", "M1", "M2"]
rows = defaultdict(lambda: defaultdict(list))
for p in d["pairs"]:
    v = p.get("v") or {}
    items = v.get("items") or {}
    sc = v.get("score", items.get("score"))
    df = v.get("defects", items.get("defects", []))
    r = rows[p["id"]][p["model"]]
    r.append({"size": p["size"], "score": sc, "pass": {k: bool(items.get(k, [None])[0]) for k in IT}, "defects": df})
out = {}
for id_, ms in rows.items():
    o = {}
    for m, rs in ms.items():
        scs = [r["score"] for r in rs if isinstance(r["score"], (int, float))]
        o[m] = {"meanScore": round(sum(scs) / len(scs), 2) if scs else None, "n": len(rs),
                "fails": sorted({k for r in rs for k, ok in r["pass"].items() if not ok}),
                "defects": [x for r in rs for x in r["defects"]][:4]}
    out[id_] = o
for id_, o in out.items():
    print(id_, {m[:5]: (v["meanScore"], v["fails"]) for m, v in o.items()})
emo = d.get("emotions", [])
for m in sorted({e["model"] for e in emo}):
    es = [e for e in emo if e["model"] == m]
    print("emotion", m[:5], sum(e["ok"] for e in es), "/", len(es), [(e["pose"], e["got"]) for e in es if not e["ok"]])
json.dump(out, open(sys.argv[1].replace(".json", "-tally.json"), "w"), indent=1)
