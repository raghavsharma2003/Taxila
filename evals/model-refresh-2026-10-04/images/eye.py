# Eye-verdict recorder: python3 eye.py '<json {stem_suffix: [labels_correct|null, pass(0/1), any_text(0/1)|science_ok, "note"]}>' <prompt> <rep>
# Writes results/eyeball-2026-10-04.json. For diagrams: [labels_correct, science_ok, pass, note]; illus: [any_text, pass, note].
import json, sys, os
H = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(H, "results/eyeball-2026-10-04.json")
LAB = {"d1-plant": 5, "d2-watercycle": 4, "d3-circuit": 4, "d4-digestive": 5, "d5-flower": 4}
d = json.load(open(F)) if os.path.exists(F) else {}
entries = json.loads(sys.argv[1]); pid, rep = sys.argv[2], sys.argv[3]
for arm, v in entries.items():
    stem = f"{pid}__{arm}__{rep}"
    if pid in LAB: d[stem] = {"labels_correct": v[0], "labels_total": LAB[pid], "science_ok": bool(v[1]), "pass": bool(v[2]), "note": v[3]}
    else: d[stem] = {"any_text": bool(v[0]), "pass": bool(v[1]), "note": v[2]}
json.dump(d, open(F, "w"), indent=1); print(len(d))
