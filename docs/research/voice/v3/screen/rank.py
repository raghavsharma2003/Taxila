# rank.py: composite listen-proxy rank over arms.json (2026-10-04). Gates first, then a weighted z-score. The weights are a
# judgement call written down here so they can be argued with; the blind page, not this number, picks the voice.
import json, os, statistics as st
HERE = os.path.dirname(os.path.abspath(__file__))
A = json.load(open(os.path.join(HERE, "arms.json")))
for a in A:
    rt = [a.get(k) for k in ("j_rt_talking", "j_rt_humanlike", "j_mini_talking", "j_mini_humanlike")]
    a["judge"] = round(st.mean([x for x in rt if x is not None]), 2)
    a["rate_dev"] = abs(a["rate_med"] - 4.7)
    a["gop_en_v"] = a["gop_en"] if a["gop_en"] is not None else 0
# (field, weight, sign): + means higher is better
W = [("word_miss_both_rate", .15, -1), ("num_miss_both", .05, -1),
     ("cer_ctc", .15, -1), ("gop_hi", .10, +1), ("gop_en_v", .10, +1),
     ("pause_mid_per_clip", .10, -1), ("max_pause", .05, -1), ("rate_dev", .10, -1),
     ("spk_en_hi", .05, +1), ("spk_halves", .05, +1), ("judge", .10, +1)]
for f, w, s in W:
    v = [a[f] for a in A if a.get(f) is not None]; mu, sd = st.mean(v), st.pstdev(v) or 1
    for a in A: a.setdefault("z", {})[f] = 0 if a.get(f) is None else max(-3, min(3, s * (a[f] - mu) / sd))
for a in A:
    a["score"] = round(sum(w * a["z"][f] for f, w, s in W), 3)
    g = []
    if a["word_miss_both_rate"] > 0.03: g.append("words")
    if a["num_miss_both"] or a["num_ins_both"]: g.append("numbers")
    if a["max_pause"] > 1.5: g.append("silence>1.5s")
    if a["pause_mid_long"] >= 5: g.append("mid-phrase pauses")
    if not 3.8 <= a["rate_med"] <= 5.6: g.append("rate")
    a["gates_failed"] = g
json.dump(A, open(os.path.join(HERE, "arms.json"), "w"), ensure_ascii=False, indent=1)
for a in sorted(A, key=lambda a: -a["score"]):
    print(f'{a["score"]:+.2f}', a["arm"], a["cond"], ",".join(a["gates_failed"]) or "pass")
