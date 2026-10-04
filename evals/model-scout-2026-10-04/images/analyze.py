# Model scout 2026-10-04, images: aggregate rows-2026-10-04.json -> results/summary-2026-10-04.json + contact sheets.
# Adds the manifest's lamp-hue lint (docs/design/assets/MANIFEST.json conventions.lint: <= 1.5% pixels with HSL S >= 35%,
# L 20-85%, hue within 12 deg of 39.5 deg) on every text-free image, and merges my own look (results/eyeball-2026-10-04.json:
# {"<file stem>": {"labels_correct": n, "science_ok": bool, "any_text": bool, "pass": bool, "note": "..."}}), which is the
# authority where it exists. Usage: python3 evals/model-scout-2026-10-04/images/analyze.py [--sheets]
import json, sys, os, statistics, colorsys
from PIL import Image, ImageDraw
import numpy as np
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(H, "results")
ROOT = os.path.abspath(os.path.join(H, "../../.."))
rows = json.load(open(os.path.join(R, "rows-2026-10-04.json")))["rows"]
eye_f = os.path.join(R, "eyeball-2026-10-04.json"); eye = json.load(open(eye_f)) if os.path.exists(eye_f) else {}

def lamp_share(path):
    a = np.asarray(Image.open(path).convert("RGB").resize((256, 256))).astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; mx = a.max(-1); mn = a.min(-1); l = (mx + mn) / 2; d = mx - mn
    s = np.where(d == 0, 0, d / (1 - np.abs(2 * l - 1) + 1e-6))
    h = np.zeros_like(mx); m = d > 0
    rc = np.where(m, (mx - r) / (d + 1e-9), 0); gc = np.where(m, (mx - g) / (d + 1e-9), 0); bc = np.where(m, (mx - b) / (d + 1e-9), 0)
    h = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc)); h = (h / 6) % 1 * 360
    hit = m & (s >= 0.35) & (l >= 0.2) & (l <= 0.85) & (np.abs(h - 39.5) <= 12)
    return float(hit.mean())

ok = [r for r in rows if r.get("file")]
seen = {}
for r in rows:  # last row per key wins (re-runs)
    seen[(r["prompt"], r["arm"], r["rep"])] = r
rows = list(seen.values()); ok = [r for r in rows if r.get("file")]
for r in ok:
    stem = os.path.basename(r["file"])[:-4]; r["stem"] = stem
    if r["kind"] == "illus": r["lamp"] = round(lamp_share(os.path.join(ROOT, r["file"])), 4)
    r["eye"] = eye.get(stem)

arms = sorted(set(r["arm"] for r in rows))
def agg(arm):
    A = [r for r in rows if r["arm"] == arm]; G = [r for r in A if r.get("file")]
    out = {"n_requested": len(A), "n_images": len(G), "errors": [f'{r["prompt"]}#{r["rep"]}: {str(r["err"])[:90]}' for r in A if not r.get("file")],
           "ms_p50": statistics.median([r["ms"] for r in G]) if G else None,
           "ms_p90": sorted([r["ms"] for r in G])[max(0, int(len(G) * 0.9) - 1)] if G else None,
           "usd_per_image": round(statistics.mean([r["usd"] for r in G]), 4) if G else None}
    for kind in ["illus", "diagram"]:
        K = [r for r in G if r["kind"] == kind]
        d = {"n": len(K)}
        for j in ["brain", "grok"]:
            V = [r for r in K if r["verdict"].get(j)]
            d[f"{j}_pass"] = f'{sum(r["verdict"][j]["pass"] for r in V)}/{len(V)}'
            d[f"{j}_mean5"] = round(statistics.mean([statistics.mean([r["judge"][j][c] for c in ["adherence", "text", "authenticity", "appeal", "artifacts"]]) for r in V]), 2) if V else None
            if kind == "diagram":
                d[f"{j}_labels"] = f'{sum(r["verdict"][j]["labels_correct"] for r in V)}/{sum(r["verdict"][j]["labels_total"] for r in V)}'
            else:
                d[f"{j}_any_text"] = sum(r["verdict"][j]["any_text"] for r in V)
                d[f"{j}_house_style"] = sum(r["verdict"][j]["house_style"] for r in V)
        E = [r for r in K if r.get("eye")]
        if E:
            d["eye_pass"] = f'{sum(r["eye"]["pass"] for r in E)}/{len(E)}'
            if kind == "diagram": d["eye_labels"] = f'{sum(r["eye"]["labels_correct"] for r in E)}/{sum(r["eye"]["labels_total"] for r in E)}'
            else: d["eye_any_text"] = sum(bool(r["eye"].get("any_text")) for r in E)
        if kind == "illus":
            d["lamp_fail"] = sum(r["lamp"] > 0.015 for r in K); d["lamp_max"] = max([r["lamp"] for r in K], default=None)
        out[kind] = d
    return out
summary = {"date": "2026-10-04", "arms": {a: agg(a) for a in arms}}
# judge agreement with eye
for j in ["brain", "grok"]:
    E = [r for r in ok if r.get("eye") and r["verdict"].get(j)]
    summary[f"{j}_agree_with_eye"] = f'{sum(r["verdict"][j]["pass"] == r["eye"]["pass"] for r in E)}/{len(E)}'
    summary[f"{j}_false_pass"] = sum(r["verdict"][j]["pass"] and not r["eye"]["pass"] for r in E)
    summary[f"{j}_false_fail"] = sum((not r["verdict"][j]["pass"]) and r["eye"]["pass"] for r in E)
judge_usd = sum(r.get("judgeUsd", 0) for r in ok); gen_usd = sum(r.get("usd", 0) for r in ok)
summary["spend"] = {"gen_usd": round(gen_usd, 3), "judge_usd": round(judge_usd, 3)}
json.dump(summary, open(os.path.join(R, "summary-2026-10-04.json"), "w"), indent=1)
json.dump([{k: r.get(k) for k in ["stem", "prompt", "arm", "rep", "ms", "usd", "lamp", "verdict", "eye"]} for r in ok], open(os.path.join(R, "per-image-2026-10-04.json"), "w"), indent=0)
print(json.dumps(summary, indent=1))

if "--sheets" in sys.argv:
    os.makedirs(os.path.join(R, "sheets"), exist_ok=True)
    for pid in sorted(set(r["prompt"] for r in ok)):
        P = sorted([r for r in ok if r["prompt"] == pid], key=lambda r: (r["arm"], r["rep"]))
        W = 420; cols = 4; rws = (len(P) + cols - 1) // cols
        sh = Image.new("RGB", (W * cols, (W + 22) * rws), "white"); dr = ImageDraw.Draw(sh)
        for i, r in enumerate(P):
            im = Image.open(os.path.join(ROOT, r["file"])); im.thumbnail((W, W)); x = (i % cols) * W; y = (i // cols) * (W + 22)
            sh.paste(im, (x, y + 22)); dr.text((x + 4, y + 5), f'{r["arm"]} #{r["rep"]}', fill="black")
        sh.save(os.path.join(R, "sheets", f"{pid}.jpg"), quality=82)
