# Model refresh 2026-10-04, images: aggregate results/rows-2026-10-04.json -> results/summary-2026-10-04.json (+ --sheets).
# Eye verdicts (results/eyeball-2026-10-04.json, {"<stem>": {"labels_correct": n, "labels_total": n, "science_ok": bool,
# "any_text": bool, "pass": bool, "note": ""}}) are the authority. Wilson 80% intervals on eye pass rates.
# Lamp-hue lint as in model-scout analyze.py (direction only). Usage: python3 evals/model-refresh-2026-10-04/images/analyze.py [--sheets]
import json, sys, os, statistics, math
from PIL import Image, ImageDraw
import numpy as np
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(H, "results"); ROOT = os.path.abspath(os.path.join(H, "../../.."))
rows = json.load(open(os.path.join(R, "rows-2026-10-04.json")))["rows"]
eye_f = os.path.join(R, "eyeball-2026-10-04.json"); eye = json.load(open(eye_f)) if os.path.exists(eye_f) else {}
JUDGES = ["brain", "kimi", "mistral"]
def wilson(k, n, z=1.2816):
    if n == 0: return None
    p = k / n; d = 1 + z * z / n; c = (p + z * z / (2 * n)) / d; h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return [round(max(0, c - h), 3), round(min(1, c + h), 3)]
def lamp_share(path):
    a = np.asarray(Image.open(path).convert("RGB").resize((256, 256))).astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; mx = a.max(-1); mn = a.min(-1); l = (mx + mn) / 2; d = mx - mn
    s = np.where(d == 0, 0, d / (1 - np.abs(2 * l - 1) + 1e-6)); m = d > 0
    rc = np.where(m, (mx - r) / (d + 1e-9), 0); gc = np.where(m, (mx - g) / (d + 1e-9), 0); bc = np.where(m, (mx - b) / (d + 1e-9), 0)
    h = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc)); h = (h / 6) % 1 * 360
    return float((m & (s >= 0.35) & (l >= 0.2) & (l <= 0.85) & (np.abs(h - 39.5) <= 12)).mean())
seen = {}
for r in rows: seen[(r["prompt"], r["arm"], r["rep"])] = r
rows = list(seen.values()); ok = [r for r in rows if r.get("file")]
for r in ok:
    r["stem"] = os.path.basename(r["file"])[:-4]
    if r["kind"] == "illus": r["lamp"] = round(lamp_share(os.path.join(ROOT, r["file"])), 4)
    r["eye"] = eye.get(r["stem"])
ORDER = ["gpt-image-2-medium", "gpt-image-2-low", "flare-medium", "flare-low", "sunburst-medium", "sunburst-low", "FLUX.2-pro", "FLUX.2-flex"]
arms = [a for a in ORDER if any(r["arm"] == a for r in rows)]
def pct(v, q): v = sorted(v); return v[min(len(v) - 1, max(0, math.ceil(q * len(v)) - 1))] if v else None
def agg(arm):
    A = [r for r in rows if r["arm"] == arm]; G = [r for r in A if r.get("file")]
    out = {"n_requested": len(A), "n_images": len(G), "errors": [f'{r["prompt"]}#{r["rep"]}: {str(r["err"])[:110]}' for r in A if not r.get("file")],
           "ms_p50": statistics.median([r["ms"] for r in G]) if G else None, "ms_p90": pct([r["ms"] for r in G], 0.9),
           "usd_per_image": round(statistics.mean([r["usd"] for r in G]), 4) if G else None,
           "out_tokens_mean": round(statistics.mean([r["usage"]["output_tokens"] for r in G if r.get("usage")]), 0) if any(r.get("usage") for r in G) else None}
    for kind in ["illus", "diagram"]:
        K = [r for r in G if r["kind"] == kind]; d = {"n": len(K)}
        for j in JUDGES:
            V = [r for r in K if (r.get("verdict") or {}).get(j)]
            d[f"{j}_pass"] = f'{sum(r["verdict"][j]["pass"] for r in V)}/{len(V)}'
            if kind == "diagram": d[f"{j}_labels"] = f'{sum(r["verdict"][j]["labels_correct"] for r in V)}/{sum(r["verdict"][j]["labels_total"] for r in V)}'
        E = [r for r in K if r.get("eye")]
        if E:
            k = sum(r["eye"]["pass"] for r in E); d["eye_pass"] = f"{k}/{len(E)}"; d["eye_pass_wilson80"] = wilson(k, len(E))
            # failure-inclusive: a refused request counts as a fail for the lane
            nreq = len([r for r in A if r["kind"] == kind]); d["eye_pass_of_requested"] = f"{k}/{nreq}"; d["eye_pass_of_requested_wilson80"] = wilson(k, nreq)
            if kind == "diagram":
                lc = sum(r["eye"]["labels_correct"] for r in E); lt = sum(r["eye"]["labels_total"] for r in E)
                d["eye_labels"] = f"{lc}/{lt}"; d["eye_labels_wilson80"] = wilson(lc, lt)
            else: d["eye_any_text"] = sum(bool(r["eye"].get("any_text")) for r in E)
        if kind == "illus": d["lamp_fail"] = sum(r["lamp"] > 0.015 for r in K)
        out[kind] = d
    return out
summary = {"date": "2026-10-04", "arms": {a: agg(a) for a in arms}, "judges_vs_eye": {}}
for j in JUDGES:
    for kind in ["diagram", "illus"]:
        E = [r for r in ok if r["kind"] == kind and r.get("eye") and (r.get("verdict") or {}).get(j)]
        summary["judges_vs_eye"][f"{j}_{kind}"] = {"n": len(E), "eye_fails": sum(not r["eye"]["pass"] for r in E),
            "agree": sum(r["verdict"][j]["pass"] == r["eye"]["pass"] for r in E),
            "false_pass": sum(r["verdict"][j]["pass"] and not r["eye"]["pass"] for r in E),
            "false_fail": sum((not r["verdict"][j]["pass"]) and r["eye"]["pass"] for r in E)}
summary["spend"] = {"gen_usd": round(sum(r.get("usd", 0) for r in ok), 3), "judge_usd": round(sum(r.get("judgeUsd", 0) for r in ok), 3)}
json.dump(summary, open(os.path.join(R, "summary-2026-10-04.json"), "w"), indent=1)
json.dump([{k: r.get(k) for k in ["stem", "prompt", "arm", "rep", "ms", "usd", "lamp", "verdict", "eye"]} for r in ok], open(os.path.join(R, "per-image-2026-10-04.json"), "w"), indent=0)
print(json.dumps(summary, indent=1))
if "--sheets" in sys.argv:
    os.makedirs(os.path.join(R, "sheets"), exist_ok=True)
    for pid in sorted(set(r["prompt"] for r in ok)):
        for rep in [0, 1]:
            P = sorted([r for r in ok if r["prompt"] == pid and r["rep"] == rep], key=lambda r: ORDER.index(r["arm"]))
            if not P: continue
            W = 512; cols = 4; rws = (len(P) + cols - 1) // cols
            sh = Image.new("RGB", (W * cols, (W + 20) * rws), "white"); dr = ImageDraw.Draw(sh)
            for i, r in enumerate(P):
                im = Image.open(os.path.join(ROOT, r["file"])); im.thumbnail((W, W)); x = (i % cols) * W; y = (i // cols) * (W + 20)
                sh.paste(im, (x, y + 20)); dr.text((x + 4, y + 4), f'{i+1}. {r["arm"]} #{rep}', fill="black")
            sh.save(os.path.join(R, "sheets", f"{pid}__{rep}.jpg"), quality=85)
