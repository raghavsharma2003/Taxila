"""Tally the round-4 Asha outfit judges (blind-outfit-*.json single-image runs, lineup-outfit-*.json forced choice) into
a summary JSON and markdown tables with every answer verbatim.
    python3 -I tally-outfit.py <evidence dir> <out.json> <out.md>"""
import json, sys, os, glob
from collections import Counter, defaultdict

E, OUTJ, OUTM = sys.argv[1:4]
ORDER = ["saree-original", "saree-age", "o1-print", "o2-denim", "o3-shirt", "o4-cardigan", "o5-denim-print", "o6-cardigan-print"]
runs = defaultdict(list)
errors = defaultdict(list)
for f in sorted(glob.glob(f"{E}/blind-outfit-*.json")):
    for r in json.load(open(f))["runs"]:
        (errors if "error" in r else runs)[r["label"]].append(r)
summ = {}
md = []
for lab in [l for l in ORDER if l in runs or l in errors] + [l for l in runs if l not in ORDER]:
    R = runs[lab]
    A = [r["answer"] for r in R]
    def m(k): return [a.get(k, {}).get("v") for a in A]
    fr, co, pr = m("friendly"), m("cool"), m("parent_professional")
    mean = lambda xs: round(sum(x for x in xs if isinstance(x, (int, float))) / max(1, len([x for x in xs if isinstance(x, (int, float))])), 2)
    summ[lab] = {"n": len(R), "errors": [e["error"][:120] for e in errors[lab]],
                 "models": dict(Counter(r["model"] for r in R)),
                 "ages": [a.get("apparent_age_range") for a in A],
                 "teacher": sum(bool(x) for x in m("reads_as_teacher")), "childish": sum(bool(x) for x in m("childish")),
                 "sexualised": sum(bool(x) for x in m("sexualised")), "indian": sum(bool(x) for x in m("reads_as_indian")),
                 "friendly": fr, "friendly_mean": mean(fr), "cool": co, "cool_mean": mean(co), "prof": pr, "prof_mean": mean(pr)}
    md.append(f"\n#### {lab}: n = {len(R)} ({', '.join(f'{v} {k}' for k, v in summ[lab]['models'].items())})"
              + (f"; {len(errors[lab])} refused: " + "; ".join(e['model'] + ' ' + e['error'][:60] for e in errors[lab]) if errors[lab] else "") + "\n")
    md.append("| judge, run | age | occupations | clothing | teacher | friendly | cool | parent-professional | childish | sexualised | Indian |")
    md.append("|---|---|---|---|---|---|---|---|---|---|---|")
    for r in sorted(R, key=lambda r: (r["model"], r["rep"])):
        a = r["answer"]
        g = lambda k, f="why": f"{a.get(k, {}).get('v')}: {str(a.get(k, {}).get(f, '')).replace('|', '/')}"
        md.append(f"| {r['model']} #{r['rep'] + 1} | {a.get('apparent_age_range')} | {'; '.join(a.get('occupation_guesses', []))} | {str(a.get('clothing', '')).replace('|', '/')} | "
                  f"{g('reads_as_teacher')} | {g('friendly')} | {g('cool')} | {g('parent_professional')} | {g('childish', 'what')} | {g('sexualised', 'what')} | {g('reads_as_indian', 'details')} |")
# lineups
lin = []
for f in sorted(glob.glob(f"{E}/lineup*.json")):
    tag = os.path.basename(f)[:-5]
    for r in json.load(open(f))["runs"]:
        if "error" in r: continue
        r["_file"] = tag; lin.append(r)
lsum = defaultdict(lambda: defaultdict(Counter))
for r in lin:
    grp = r["_file"].replace("-brain", "").replace("-kimi", "")
    for k in ["most_friendly", "most_cool", "most_professional", "least_professional", "overall"]:
        lsum[grp][k][r["mapped"][k]["v"]] += 1
    lsum[grp]["first_in_ranking"][r["mapped"]["ranking_overall"][0] if r["mapped"]["ranking_overall"] else "?"] += 1
    lsum[grp]["n"]["runs"] += 1
md.append("\n### Lineups (forced choice, positions shuffled per run)\n")
for grp, d in lsum.items():
    md.append(f"\n#### {grp}: n = {d['n']['runs']}\n")
    md.append("| item | votes |\n|---|---|")
    for k in ["most_friendly", "most_cool", "most_professional", "least_professional", "overall", "first_in_ranking"]:
        md.append(f"| {k} | {', '.join(f'{a} {b}' for a, b in d[k].most_common())} |")
    md.append("\n| judge, run | cell order (A-D) | friendly | cool | professional | least professional | overall (why) | ranking |\n|---|---|---|---|---|---|---|---|")
    for r in [x for x in lin if x["_file"].startswith(grp)]:
        M = r["mapped"]
        md.append(f"| {r['model']} #{r['rep'] + 1} | {', '.join(r['order'])} | {M['most_friendly']['v']} | {M['most_cool']['v']} | {M['most_professional']['v']} | {M['least_professional']['v']} | {M['overall']['v']}: {str(M['overall']['why']).replace('|', '/')} | {' > '.join(M['ranking_overall'])} |")
json.dump({"single": summ, "lineups": {g: {k: dict(v) for k, v in d.items()} for g, d in lsum.items()}}, open(OUTJ, "w"), indent=1)
open(OUTM, "w").write("\n".join(md) + "\n")
for lab, s in summ.items():
    print(f"{lab:18s} n={s['n']} ages={s['ages']} teacher={s['teacher']} childish={s['childish']} sex={s['sexualised']} indian={s['indian']} friendly={s['friendly']} cool={s['cool']} prof={s['prof']} err={len(s['errors'])}")
for g, d in lsum.items():
    print(g, {k: dict(v) for k, v in d.items()})
