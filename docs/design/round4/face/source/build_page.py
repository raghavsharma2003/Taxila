"""Build docs/design/round4/face/index.html (self-contained, webp data URIs) and copy every kept image to images/.
Frames are shown registered to their front by scale + translation only (what the rig does before cutting patches);
rotation (the listening tilt) is kept. Each family's evidence is read from judge/*.json, not typed in.
  python3 -I build_page.py
"""
import base64, io, json, os, shutil, statistics as st
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = "/home/user/Taxila/docs/design/round4/face"
IMGDIR = f"{OUT}/images"
os.makedirs(IMGDIR, exist_ok=True)
TODAY = "/home/user/Taxila/docs/design/teacher/stylised/concepts/c-front.webp"
FRAMES = ["rest", "speak", "listen", "think", "warm", "blink"]
LABEL = {"rest": "Resting", "speak": "Speaking", "listen": "Listening", "think": "Thinking", "warm": "Warm smile", "blink": "Blink"}
FLOOR = {"rest": "", "speak": "Talking", "listen": "Listening", "think": "Thinking", "warm": "", "blink": ""}
FAM = json.load(open(f"{HERE}/families.json"))

def load(p):
    return Image.open(p).convert("RGB")

def raw(i):
    return f"{HERE}/raw/{i}.png"

def register(front, frame):
    a = cv2.cvtColor(np.asarray(front), cv2.COLOR_RGB2GRAY); b = cv2.cvtColor(np.asarray(frame), cv2.COLOR_RGB2GRAY)
    orb = cv2.ORB_create(5000)
    k1, d1 = orb.detectAndCompute(b, None); k2, d2 = orb.detectAndCompute(a, None)
    m = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda x: x.distance)[:800]
    p1 = np.float32([k1[x.queryIdx].pt for x in m]); p2 = np.float32([k2[x.trainIdx].pt for x in m])
    M, _ = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=3)  # frame -> front
    s = float(np.hypot(M[0, 0], M[1, 0])); c = np.array([512.0, 400.0])
    mc = M @ np.array([c[0], c[1], 1.0]); t = mc - s * c
    Mp = np.float32([[s, 0, t[0]], [0, s, t[1]]])
    w = cv2.warpAffine(np.asarray(frame), Mp, (frame.width, frame.height), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    return Image.fromarray(w), {"scale": round(s, 4), "shift_px": round(float(np.hypot(*(mc - c))), 1)}

def webp_uri(im, q=80):
    b = io.BytesIO(); im.save(b, "WEBP", quality=q, method=6)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())

def crop(im, box, size):
    x0, y0, w, h = box
    s = im.width / 1024
    return im.crop((int(x0 * s), int(y0 * s), int((x0 + w) * s), int((y0 + h) * s))).resize(size, Image.LANCZOS)

ASSETS, total = {}, 0
reg_log = {}
for fk, f in FAM.items():
    front = load(raw(f["frames"]["rest"]))
    ASSETS[fk] = {}
    for fr in FRAMES:
        src = f["frames"][fr]
        im = load(raw(src))
        if fr != "rest" and f.get("register", True):
            im, info = register(front, im); reg_log.setdefault(fk, {})[fr] = info
        big, n1 = webp_uri(im.resize((560, 560), Image.LANCZOS), 78)
        head, n2 = webp_uri(crop(im, f["head"], (300, 390)), 82)
        chip, n3 = webp_uri(crop(im, f["chip"], (80, 104)), 85)
        strip, n4 = webp_uri(crop(im, f["strip"], (220, 264)), 80)
        total += n1 + n2 + n3 + n4
        ASSETS[fk][fr] = {"big": big, "head": head, "chip": chip, "strip": strip}
        # keep the image itself (full size) in images/
        dst = f"{IMGDIR}/{fk}-{fr}.webp"
        load(raw(src)).save(dst, "WEBP", quality=90, method=6)
today = load(TODAY)
T = {"big": webp_uri(today.resize((360, 360), Image.LANCZOS), 78)[0],
     "head": webp_uri(crop(today, (170, 60, 690, 897), (300, 390)), 82)[0],
     "chip": webp_uri(crop(today, (250, 160, 520, 676), (80, 104)), 85)[0]}
# evidence images
def ev(path, size, q=80):
    im = load(path); im.thumbnail(size); return webp_uri(im, q)[0]
GRADE = [ev(f"{HERE}/raw/s3-graphic.png", (240, 240)), ev(f"{HERE}/raw/s3-graphic-half.png", (240, 240)), ev(f"{HERE}/raw/s3-graphic-mst6.png", (240, 240))]
for nm in ["s3-graphic-half", "s3-graphic-mst6", "w1-flat-half", "w1-flat-mst6"]:
    load(f"{HERE}/raw/{nm}.png").save(f"{IMGDIR}/grade-{nm}.webp", "WEBP", quality=88, method=6)
REJ = {}
for r in FAM["_rejected_fronts"] if "_rejected_fronts" in FAM else []:
    pass

# ---------- evidence from the judge files ----------
def blind_summary(files, label):
    runs = []
    for fp in files:
        if os.path.exists(fp):
            runs += [r for r in json.load(open(fp))["runs"] if r.get("label") == label and "answer" in r]
    out = {}
    for model in sorted({r["model"] for r in runs}):
        rr = [r["answer"] for r in runs if r["model"] == model]
        out[model] = {"n": len(rr), "ages": [a["apparent_age_range"] for a in rr],
                      "teacher": sum(bool(a["reads_as_teacher"]["v"]) for a in rr), "childish": sum(bool(a["childish"]["v"]) for a in rr),
                      "sexualised": sum(bool(a["sexualised"]["v"]) for a in rr), "indian": sum(bool(a["reads_as_indian"]["v"]) for a in rr),
                      "first_job": [a["occupation_guesses"][0] for a in rr]}
    return out
J = f"{HERE}/judge"
BL = {fk: blind_summary([f"{J}/blind-fronts-brain.json", f"{J}/blind-fronts-kimi.json", f"{J}/blind-line-brain.json", f"{J}/blind-line-kimi.json"], f["blind_label"]) for fk, f in FAM.items()}
BL["today"] = blind_summary([f"{J}/blind-fronts-brain.json", f"{J}/blind-fronts-kimi.json"], "today")
ID = {}
for fp in [f"{J}/idcheck-final-brain.json", f"{J}/idcheck-final-kimi.json"]:
    if os.path.exists(fp):
        for r in json.load(open(fp))["runs"]:
            if "answer" in r:
                ID.setdefault(r["label"], []).append((r["model"], r["answer"]))
MEAS = json.load(open(f"{J}/measure.json"))

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

JN = {"taxila-brain": "gpt-5.6-sol", "taxila-kimi26": "Kimi K2.6"}
def facts(fk):
    f = FAM[fk]; b = BL[fk]; rows = []
    for model, s in b.items():
        ages = ", ".join(sorted(set(s["ages"]), key=s["ages"].index))
        rows.append(f"<li><b>{JN.get(model, model)}</b>, n={s['n']}: age read {esc(ages)} · teacher {s['teacher']}/{s['n']} · childish {s['childish']}/{s['n']} · sexualised {s['sexualised']}/{s['n']} · reads Indian {s['indian']}/{s['n']}</li>")
    sk = MEAS["skin"][f["blind_label"]]
    ids = ID.get(fk, [])
    same = sum(bool(a["same_person"]) for _, a in ids)
    idtxt = ", ".join(str(a["identity_score"]) for _, a in ids)
    return f"""<div class="facts"><h3 class="fh">Blind check of the resting front</h3><p class="small">The judge was told nothing about who she is meant to be.</p><ul>{''.join(rows)}</ul>
<p class="small"><b>Same person in all six frames:</b> {same}/{len(ids)} judge runs (identity 1-5: {idtxt}). <b>Skin</b> (cheek + forehead): L* {sk['mean']['L']}, C* {sk['mean']['C']}. Monk 6 is L* {sk['target_MST6']['L']}, C* {sk['target_MST6']['C']} (ΔL {sk['dL']:+}, ΔC {sk['dC']:+}).</p></div>"""

def summary_table():
    rows, cards = [], []
    for fk in [k for k in FAM if not k.startswith("_")] + ["today"]:
        nm = FAM[fk]["short"] if fk in FAM else "Today (chibi)"
        b = BL[fk]; n = sum(s["n"] for s in b.values())
        ages = sorted({a for s in b.values() for a in s["ages"]})
        ch = sum(s["childish"] for s in b.values()); sx = sum(s["sexualised"] for s in b.values()); ind = sum(s["indian"] for s in b.values()); te = sum(s["teacher"] for s in b.values())
        sk = MEAS["skin"]["today" if fk == "today" else FAM[fk]["blind_label"]]
        ids = ID.get(fk, []); idt = f"{sum(bool(a['same_person']) for _, a in ids)}/{len(ids)}" if ids else "not run"
        rows.append(f"<tr><td>{esc(nm)}</td><td>{esc(', '.join(ages))}</td><td>{te}/{n}</td><td>{ch}/{n}</td><td>{sx}/{n}</td><td>{ind}/{n}</td><td>{idt}</td><td>{sk['dL']:+} / {sk['dC']:+}</td></tr>")
        cards.append(f"<li><b>{esc(nm)}</b>: age reads {esc(', '.join(ages))} · teacher {te}/{n} · childish {ch}/{n} · sexualised {sx}/{n} · Indian {ind}/{n} · same person in 6 frames {idt} · skin ΔL* {sk['dL']:+}, ΔC* {sk['dC']:+}</li>")
    return ("<table class='wide-only'><thead><tr><th>option</th><th>age reads</th><th>teacher</th><th>childish</th><th>sexualised</th><th>Indian</th><th>same person, 6 frames</th><th>skin ΔL* / ΔC* vs Monk 6</th></tr></thead><tbody>"
            + "".join(rows) + "</tbody></table><ul class='narrow-only sumlist'>" + "".join(cards) + "</ul>")

TRIED = json.load(open(f"{HERE}/tried.json"))
def tried_html():
    cells = []
    for t in TRIED:
        im = load(raw(t["id"])); im.thumbnail((150, 150)); u = webp_uri(im, 72)[0]
        cells.append(f"<figure><img src='{u}' alt='{esc(t['id'])}' width='150' height='150'><figcaption><b>{esc(t['id'])}</b> {esc(t['why'])}</figcaption></figure>")
    return "<div class='tried'>" + "".join(cells) + "</div>"

ARCH = "M0,1 L0,0.40 C0,0.22 0.22,0.14 0.38,0.09 C0.45,0.07 0.49,0.035 0.5,0 C0.51,0.035 0.55,0.07 0.62,0.09 C0.78,0.14 1,0.22 1,0.40 L1,1 Z"
def archD(w, h, inset):
    sx = lambda x: f"{inset + x * (w - 2 * inset):.2f}"; sy = lambda y: f"{inset + y * (h - inset):.2f}"
    return (f"M{sx(0)},{h} L{sx(0)},{sy(.40)} C{sx(0)},{sy(.22)} {sx(.22)},{sy(.14)} {sx(.38)},{sy(.09)} C{sx(.45)},{sy(.07)} {sx(.49)},{sy(.035)} {sx(.5)},{sy(0)} "
            f"C{sx(.51)},{sy(.035)} {sx(.55)},{sy(.07)} {sx(.62)},{sy(.09)} C{sx(.78)},{sy(.14)} {sx(1)},{sy(.22)} {sx(1)},{sy(.40)} L{sx(1)},{h}")
JHFRAME = f"""<svg class="jh-frame" viewBox="0 0 100 130" preserveAspectRatio="none" aria-hidden="true"><path d="{archD(100,130,0)}" fill="none" stroke="#5B3326" stroke-width="7" vector-effect="non-scaling-stroke" opacity=".85"/><path d="{archD(100,130,0)}" fill="none" stroke="url(#gBrass)" stroke-width="3.2" vector-effect="non-scaling-stroke"/><path d="{archD(100,130,4.2)}" fill="none" stroke="rgba(255,230,180,.55)" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>"""
def jh(src, cls, alt=""):
    return f'<div class="jhw {cls}"><div class="jharokha"><img class="jh-face" src="{src}" alt="{esc(alt)}"><div class="jh-grade"></div><div class="jh-rim"></div></div>{JHFRAME}</div>'

SLATE = """<svg class="slate-tree" viewBox="0 0 200 92" aria-hidden="true"><path d="M100,30 L62,62 M100,30 L138,62" stroke="#F4E7C9" stroke-width="2" stroke-linecap="round" opacity=".8"/>
<rect x="82" y="8" width="36" height="26" rx="2" fill="#262A44" stroke="#F4E7C9" stroke-width="2"/><text x="100" y="27" text-anchor="middle" font-family="Eczar,Georgia,serif" font-weight="700" font-size="16" fill="#F4E7C9">12</text>
<path d="M62,50 l9,4 3,9 -3,9 -9,4 -9,-4 -3,-9 3,-9 z" transform="translate(0,-1)" fill="#2b2a3a" stroke="#FFD27A" stroke-width="2"/><text x="62" y="68" text-anchor="middle" font-family="Eczar,Georgia,serif" font-weight="700" font-size="15" fill="#FFD27A">3</text>
<rect x="124" y="52" width="28" height="22" rx="2" fill="#262A44" stroke="#F4E7C9" stroke-width="2"/><text x="138" y="68" text-anchor="middle" font-family="Eczar,Georgia,serif" font-weight="700" font-size="15" fill="#F4E7C9">4</text></svg>"""

def slots(fk, a, today=False):
    floor = "" if today else f'<span class="floor" data-floor></span>'
    return f"""<div class="slots">
  <figure class="slot home"><div class="dusk"><div class="pav"><div class="pav-roof"></div><div class="pav-win">{jh(a['head'], 'win150', 'Asha in the home window')}</div></div><div class="lamps"></div></div><figcaption>Home window · 150 × 190</figcaption></figure>
  <figure class="slot lesson"><div class="ls-mini"><div class="slate">{SLATE}</div><div class="dlg panel solid"><div class="portrait">{jh(a['head'], 'win90', 'Asha beside the slate')}</div><div class="nameplate"><b>Asha</b><span class="ai">AI</span>{floor}</div><div class="cap" aria-label="her caption goes here"><i></i><i></i><i class="s"></i></div></div></div><figcaption>Lesson portrait · 90 × 117</figcaption></figure>
  <figure class="slot game"><div class="gm-mini"><div class="block">72</div><div class="react"><div class="mini">{jh(a['chip'], 'win38', 'Asha, game chip')}</div><div class="t"><b>Asha</b><i></i></div></div></div><figcaption>Game chip · 38 × 48</figcaption></figure>
</div>"""

def family_section(fk, idx):
    f = FAM[fk]; A = ASSETS[fk]
    strip = "".join(f'<button class="fr{" on" if fr == "rest" else ""}" data-fr="{fr}" aria-pressed="{"true" if fr == "rest" else "false"}"><img src="{A[fr]["strip"]}" alt="{LABEL[fr]}"><span>{LABEL[fr]}</span></button>' for fr in FRAMES)
    data = json.dumps({fr: {"big": A[fr]["big"], "head": A[fr]["head"], "chip": A[fr]["chip"], "floor": FLOOR[fr]} for fr in FRAMES})
    return f"""<section class="fam" id="f-{fk}" data-family="{fk}">
<div class="fam-head"><span class="eyebrow lamp">Option {idx}</span><h2 class="h-2">{esc(f['title'])}</h2><p class="lede">{esc(f['lede'])}</p></div>
<div class="fam-body panel solid">
  <div class="hero"><figure class="front"><img data-big src="{A['rest']['big']}" alt="{esc(f['title'])}: front view"><figcaption data-cap>Resting · the riggable front</figcaption></figure>
  {slots(fk, A['rest'])}</div>
  <div class="strip" role="group" aria-label="Six frames, tap one to see it everywhere">{strip}</div>
  <p class="hint">Tap a frame: the big picture and all three Prakash slots switch to it. All six are edits of the same front (same person, same dress).</p>
  <div class="why"><div><h3>Why this one</h3><p>{esc(f['why'])}</p></div><div><h3>What could go wrong</h3><p>{esc(f['risk'])}</p></div></div>
  {facts(fk)}
  <script type="application/json" class="fdata">{data}</script>
</div></section>"""

css = open(f"{HERE}/page.css").read()
fams = [k for k in FAM if not k.startswith("_")]
nav = "".join(f'<a class="chip" href="#f-{k}">{i + 1} · {esc(FAM[k]["short"])}</a>' for i, k in enumerate(fams))
tb = BL["today"]
tb_txt = "; ".join(f"{'gpt-5.6-sol' if m == 'taxila-brain' else 'Kimi K2.6'}: childish {s['childish']}/{s['n']}" for m, s in tb.items())
REC = json.load(open(f"{HERE}/rec.json"))
html = f"""<title>Asha, Grown Up</title>
<style>{css}</style>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="jhClip" clipPathUnits="objectBoundingBox"><path d="{ARCH}"/></clipPath>
<linearGradient id="gBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE3A3"/><stop offset=".45" stop-color="#D9A54E"/><stop offset="1" stop-color="#8E5F22"/></linearGradient></defs></svg>
<main>
<header class="top">
  <span class="eyebrow lamp">Round 4 · Prakash · the teacher's face</span>
  <h1>Asha, grown up</h1>
  <p class="lede">You asked to see Asha with a grown-up face, and suggested a mature anime woman. Here are four ways to draw her. Each one is the same teacher: about 34, in a teal cotton handloom saree. Each is shown in the three places she lives in Prakash, at real phone size.</p>
  <nav class="nav" aria-label="Options">{nav}<a class="chip" href="#evidence">Evidence</a><a class="chip" href="#pick">My pick</a></nav>
</header>
<section class="today panel" aria-label="Today's face">
  <div class="today-in"><figure class="tfront"><img src="{T['big']}" alt="Today's shipped face"><figcaption>Today</figcaption></figure>
  <div><h2 class="h-3">Today: the face that ships now</h2><p>A big-eyed 3D emoji-style chibi. The design audit ranks it the number one reason the product reads childish. Blind judges called it childish: {esc(tb_txt)}. It is shown once so you can see the difference.</p></div></div>
  {slots('today', T, today=True)}
</section>
{''.join(family_section(k, i + 1) for i, k in enumerate(fams))}
<section class="panel ev" id="evidence"><h2 class="h-2">Evidence, and what it cannot tell you</h2>
{open(f"{HERE}/evidence.html").read().replace("{{GRADE0}}", GRADE[0]).replace("{{GRADE1}}", GRADE[1]).replace("{{GRADE2}}", GRADE[2]).replace("{{TABLE}}", summary_table()).replace("{{TRIED}}", tried_html())}
</section>
<section class="panel pick" id="pick"><span class="eyebrow lamp">My pick</span><h2 class="h-2">{esc(REC['title'])}</h2>{REC['html']}</section>
<footer class="foot">Made 2026-10-10 by the face agent. Every painted image comes from Azure (gpt-image-2, deployment taxila-image), and every prompt is in gen.json. Option 3 is drawn in code. Nothing here is a real person.</footer>
</main>
<script>{open(f"{HERE}/page.js").read()}</script>
"""
open(f"{OUT}/index.html", "w").write(html)
json.dump({"registration_for_display": reg_log, "embedded_bytes": total}, open(f"{HERE}/judge/page-build.json", "w"), indent=1)
print("index.html", round(os.path.getsize(f"{OUT}/index.html") / 1e6, 2), "MB; embedded", round(total / 1e6, 2), "MB")
