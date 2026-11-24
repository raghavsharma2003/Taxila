"""Tally blind judge rounds: per round (brain + kimi files), same_person / childish / uncanny / moving_photo counts
and premium scores, n = runs without error.
    python3 -I tally.py <evidence-dir> <round> [<round> ...]     (round = file stem between judge- and -brain/-kimi)"""
import sys, json, os
d = sys.argv[1]
for r in sys.argv[2:]:
    runs = []
    for fam in ("brain", "kimi"):
        p = f"{d}/judge-{r}-{fam}.json"
        if os.path.exists(p): runs += [x for x in json.load(open(p))["runs"] if "answer" in x]
    A = [x["answer"] for x in runs]
    c = lambda k: sum(1 for a in A if a.get(k) is True)
    prem = [a.get("premium") for a in A]
    print(f"{r}: n={len(A)} same={c('same_person')}/{len(A)} childish={c('childish')}/{len(A)} uncanny={c('uncanny')}/{len(A)} photo={c('moving_photo')}/{len(A)} premium={prem} mean={sum(prem)/len(prem):.2f}")
