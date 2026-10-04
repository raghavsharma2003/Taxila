#!/usr/bin/env python3
"""score-blind.py — unblinds the owner's HUMAN-VOICE A/B export(s) (2026-10-04).

  python3 score-blind.py ~/Downloads/taxila-voice-ab-*.json

Per arm (voice): expressive wins / plain wins / same, over the 5 lines, and for DragonHD the splice effect
(expressive-with-clips vs expressive-noclip). Also tallies the 'odd' checkboxes per condition (said a tag aloud,
pasted-in sound, wrong pause, voice changed, overacted): a splice tick on > 1 in 5 spliced clips blocks the clip bank.
Only listeners who played both sides past 80% can pick (enforced by the page), so every pick is a heard pick.
"""
import json, os, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__))
key = json.load(open(os.path.join(HERE, "..", "voice-clips", "blind-key.json")))
wins = collections.defaultdict(lambda: collections.Counter())
odd = collections.defaultdict(lambda: collections.Counter())
heard = collections.Counter()
for f in sys.argv[1:]:
    j = json.load(open(f)); who = j.get("who") or os.path.basename(f)
    for pid, r in j["ratings"].items():
        if pid.startswith("__") or "A" not in r: continue
        a, b = key[r["A"]], key[r["B"]]
        conds = {a["cond"], b["cond"]}; arm = a["arm"]
        contrast = "expressive vs plain" if "plain" in conds else "clips vs noclip"
        if r.get("pick") == "tie": wins[(arm, contrast)]["same"] += 1
        elif r.get("pick"):
            wins[(arm, contrast)][key[r["pick"]]["cond"]] += 1
        for side, code in (("A", r["A"]), ("B", r["B"])):
            c = key[code]; heard[(c["arm"], c["cond"])] += 1
            for k in r.get("odd_" + side, []): odd[(c["arm"], c["cond"])][k] += 1
print("arm                contrast              result")
for (arm, contrast), c in sorted(wins.items()):
    print(f"{arm:18} {contrast:21} {dict(c)}")
print("\nodd ticks per (arm, condition) / times rated")
for k, c in sorted(odd.items()):
    print(f"{k[0]:18} {k[1]:18} {dict(c)} / {heard[k]}")
