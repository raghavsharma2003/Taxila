#!/usr/bin/env python3
"""Summarise judge-results.json -> judge-summary.json (+ printed tables). AI-judge proxy only.

Unblinds via samples/KEY.json (Azure sweep) and samples/KEY-ref.json (OpenRouter references, all
reference-not-for-production). Composite = mean(native_indian, naturalness, hindi_pronunciation, warmth_child).
"""
import json, os, statistics as st, itertools, math, sys

HERE = os.path.dirname(os.path.abspath(__file__))
R = json.load(open(os.path.join(HERE, "judge-results.json")))
ka = json.load(open(os.path.join(HERE, "samples", "KEY.json"))) if os.path.exists(os.path.join(HERE, "samples", "KEY.json")) else {}
kr = json.load(open(os.path.join(HERE, "samples", "KEY-ref.json")))["clips"]
AX = ["native_indian", "naturalness", "hindi_pronunciation", "warmth_child"]
JUDGES = R["judges"]

def arm_of(cid, v):
    if v["set"] == "human-anchor": return "HUMAN anchor (IndicTTS-Hindi studio read speech)"
    if cid.startswith("ref-"):
        k = kr[cid[4:]]; a = f"REF {k['engine']}:{k['voice'] or 'default'}"
        if k.get("arm") and k["arm"] != "director-note": a += f" [{k['arm']}]"
        return a
    k = ka.get(cid); return f"AZ {k['arm']}" if k else "?"

def comp(r): return sum(float(r[a]) for a in AX) / 4 if r and not r.get("error") and all(a in r for a in AX) else None

rows = []
for cid, v in R["ratings"].items():
    for j, r in v["by"].items():
        if r.get("error"): continue
        rows.append(dict(cid=cid, set=v["set"], passage=v["passage"], arm=arm_of(cid, v), judge=j, comp=comp(r),
                         leak=bool(r.get("english_accent_leakage")), human=(str(r.get("human_or_synthetic", "")).lower() == "human"),
                         dev=bool(r.get("script_deviation")), **{a: float(r[a]) for a in AX if a in r}))

def spearman(x, y):
    def rank(v):
        s = sorted(range(len(v)), key=lambda i: v[i]); rk = [0] * len(v); i = 0
        while i < len(s):
            j = i
            while j + 1 < len(s) and v[s[j + 1]] == v[s[i]]: j += 1
            for k in range(i, j + 1): rk[s[k]] = (i + j) / 2
            i = j + 1
        return rk
    rx, ry = rank(x), rank(y); mx, my = st.mean(rx), st.mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry)); den = math.sqrt(sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry))
    return round(num / den, 3) if den else None

out = {"note": R["note"], "judges": JUDGES, "n_clips": len(R["ratings"]), "n_ratings": len(rows), "per_arm": [], "per_judge_arm": {}, "calibration": {}, "agreement": {}}
main = [r for r in rows if "#retest" not in r["judge"]]
arms = sorted(set(r["arm"] for r in main))
for a in arms:
    rs = [r for r in main if r["arm"] == a]
    e = {"arm": a, "n_clips": len(set(r["cid"] for r in rs)), "n_ratings": len(rs), "composite": round(st.mean(r["comp"] for r in rs), 2)}
    for ax in AX: e[ax] = round(st.mean(r[ax] for r in rs), 2)
    e["leak_rate"] = round(sum(r["leak"] for r in rs) / len(rs), 2); e["judged_human_rate"] = round(sum(r["human"] for r in rs) / len(rs), 2)
    e["by_judge_composite"] = {j: round(st.mean(r["comp"] for r in rs if r["judge"] == j), 2) for j in JUDGES if any(r["judge"] == j for r in rs)}
    e["min_judge_composite"] = min(e["by_judge_composite"].values())
    out["per_arm"].append(e)
out["per_arm"].sort(key=lambda e: (-e["composite"], -e["min_judge_composite"]))

# calibration: do judges separate real humans and the American-accent negative control from the rest?
for j in JUDGES:
    rj = [r for r in main if r["judge"] == j]
    grp = lambda f: [r for r in rj if f(r)]
    hum = grp(lambda r: r["set"] == "human-anchor"); neg = grp(lambda r: "NEGATIVE" in r["arm"]); tts = grp(lambda r: r["set"] != "human-anchor" and "NEGATIVE" not in r["arm"])
    m = lambda g, k: round(st.mean(r[k] for r in g), 2) if g else None
    out["calibration"][j] = {
        "human_anchor": {"n": len(hum), "composite": m(hum, "comp"), "naturalness": m(hum, "naturalness"), "judged_human_rate": round(sum(r["human"] for r in hum) / len(hum), 2) if hum else None},
        "negative_control_american": {"n": len(neg), "native_indian": m(neg, "native_indian"), "leak_rate": round(sum(r["leak"] for r in neg) / len(neg), 2) if neg else None, "composite": m(neg, "comp")},
        "all_tts_non_control": {"n": len(tts), "composite": m(tts, "comp"), "naturalness": m(tts, "naturalness"), "judged_human_rate": round(sum(r["human"] for r in tts) / len(tts), 2) if tts else None, "leak_rate": round(sum(r["leak"] for r in tts) / len(tts), 2) if tts else None},
        "share_of_tts_scored_5_on_naturalness": round(sum(r["naturalness"] == 5 for r in tts) / len(tts), 2) if tts else None,
    }

# agreement: per-clip composite across judge pairs; per-arm composite across judge pairs; test-retest
byc = {}
for r in rows: byc.setdefault(r["cid"], {})[r["judge"]] = r["comp"]
for a, b in itertools.combinations(JUDGES, 2):
    cs = [c for c in byc if a in byc[c] and b in byc[c]]
    pa = [e for e in out["per_arm"] if a in e["by_judge_composite"] and b in e["by_judge_composite"]]
    out["agreement"][f"{a} vs {b}"] = {"clip_spearman": spearman([byc[c][a] for c in cs], [byc[c][b] for c in cs]), "n_clips": len(cs),
                                       "arm_spearman": spearman([e["by_judge_composite"][a] for e in pa], [e["by_judge_composite"][b] for e in pa]), "n_arms": len(pa)}
rt = R.get("retest_judge"); cs = [c for c in byc if rt in byc[c] and rt + "#retest" in byc[c]]
if cs:
    d = [abs(byc[c][rt] - byc[c][rt + "#retest"]) for c in cs]
    out["agreement"]["test_retest_" + rt] = {"n": len(cs), "spearman": spearman([byc[c][rt] for c in cs], [byc[c][rt + "#retest"] for c in cs]), "mean_abs_diff_composite": round(st.mean(d), 3), "share_identical": round(sum(x == 0 for x in d) / len(d), 2)}

# self-family check: does the Gemini judge favour Gemini TTS more than the other judges do?
def fam(a): return "gemini" if "gemini" in a else "openai" if "4omtts" in a else "other"
for j in JUDGES:
    rj = [r for r in main if r["judge"] == j and r["set"] != "human-anchor" and "NEGATIVE" not in r["arm"]]
    out.setdefault("family_means", {})[j] = {f: round(st.mean(r["comp"] for r in rj if fam(r["arm"]) == f), 2) for f in ["gemini", "openai", "other"] if any(fam(r["arm"]) == f for r in rj)}

# per passage best arm (composite averaged over judges)
pp = {}
for r in main:
    if r["set"] == "human-anchor": continue
    pp.setdefault(r["passage"], {}).setdefault(r["arm"], []).append(r["comp"])
out["best_per_passage"] = {p: sorted(((round(st.mean(v), 2), a) for a, v in d.items()), reverse=True)[:5] for p, d in pp.items()}

json.dump(out, open(os.path.join(HERE, "judge-summary.json"), "w"), indent=1, ensure_ascii=False)
print(f"{'arm':58s} n  comp  nat  natr hpron warm leak human minJ")
for e in out["per_arm"]:
    print(f"{e['arm'][:58]:58s} {e['n_clips']:2d} {e['composite']:.2f} {e['native_indian']:.2f} {e['naturalness']:.2f} {e['hindi_pronunciation']:.2f} {e['warmth_child']:.2f} {e['leak_rate']:.2f} {e['judged_human_rate']:.2f} {e['min_judge_composite']:.2f}")
print(json.dumps({k: out[k] for k in ["calibration", "agreement", "family_means"]}, indent=1))
