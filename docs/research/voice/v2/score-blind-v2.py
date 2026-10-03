# score-blind-v2.py: unblind and score exports from blind-test*.html (schema taxila-blind-test-ratings/v2).
#   python3 score-blind-v2.py ratings/*.json
# Rules (written before any rating existed, mirror ../score-blind-test.mjs):
#  - a clip counts only if listened_frac >= 0.8 and all 4 axes + real are set;
#  - a listener is EXCLUDED if, over the degraded anchors they rated, mean natural >= 3.5 or any real=yes, or if
#    their hidden repeats differ by > 1.5 points mean absolute (axis mean) from the source clip;
#  - per arm: mean of each axis (never folded into one score) and the real-person rate, with a 95% bootstrap CI that
#    resamples LISTENERS, not clips (clips from one listener are not independent);
#  - "indistinguishable" may be claimed for an arm only if the human anchor exists and the arm's real-person rate CI
#    overlaps the anchor's AND n_listeners >= 20 and n_judgments >= 800 overall. Otherwise report "inconclusive".
import json, random, sys, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
key = json.load(open(os.path.join(HERE, "blind-key.json")))["clips"]
AX = ["native", "natural", "warmth", "hindi"]
def arm(c):
    v = key[c]
    return key[v["alias_of"]]["arm"] if v.get("alias_of") else v["arm"]
def ok(r): return r and all(r.get(a) for a in AX) and r.get("real") in ("yes", "no") and (r.get("listened_frac") or 0) >= 0.8
listeners, excluded = {}, {}
for f in sys.argv[1:]:
    j = json.load(open(f)); rid = j["rater"]["id"]
    rs = {c: r for c, r in j["ratings"].items() if c in key and ok(r)}
    deg = [r for c, r in rs.items() if key[c]["role"] == "degraded"]
    reps = [(r, rs.get(key[c]["source_code"])) for c, r in rs.items() if key[c]["role"] == "repeat"]
    why = []
    if deg and (sum(r["natural"] for r in deg) / len(deg) >= 3.5 or any(r["real"] == "yes" for r in deg)): why.append("degraded anchor rated natural/real")
    diffs = [sum(abs(a[x] - b[x]) for x in AX) / 4 for a, b in reps if b]
    if diffs and sum(diffs) / len(diffs) > 1.5: why.append("inconsistent hidden repeats")
    (excluded if why else listeners)[rid] = why or rs
print(f"listeners kept {len(listeners)}, excluded {len(excluded)}: {excluded}")
per = collections.defaultdict(lambda: collections.defaultdict(list))  # arm -> listener -> [ratings]
for rid, rs in listeners.items():
    for c, r in rs.items():
        if key[c]["role"] in ("degraded", "repeat"): continue
        per[arm(c)][rid].append(r)
def stat(byl, f):
    ls = list(byl); vals = lambda L: [f(r) for l in L for r in byl[l]]
    m = sum(vals(ls)) / max(1, len(vals(ls))); bs = []
    rng = random.Random(1)
    for _ in range(1000):
        s = [rng.choice(ls) for _ in ls]; v = vals(s); bs.append(sum(v) / len(v))
    bs.sort(); return m, bs[25], bs[974]
n_j = sum(len(v) for byl in per.values() for v in byl.values())
print(f"judgments {n_j}")
rows = []
for a, byl in per.items():
    out = [a, len(byl), sum(len(v) for v in byl.values())]
    for x in AX: out.append("%.2f [%.2f,%.2f]" % stat(byl, lambda r, x=x: r[x]))
    out.append("%.2f [%.2f,%.2f]" % stat(byl, lambda r: 1.0 if r["real"] == "yes" else 0.0))
    rows.append(out)
rows.sort(key=lambda r: -float(r[-1].split()[0]))
print("| arm | listeners | n | " + " | ".join(AX) + " | real-person rate |")
print("|---|---|---|" + "---|" * 5)
for r in rows: print("| " + " | ".join(str(x) for x in r) + " |")
if not any(k.startswith("human:") for k in per) or len(listeners) < 20 or n_j < 800:
    print("\nVERDICT: inconclusive by rule (needs a human anchor, >= 20 kept listeners, >= 800 judgments).")
