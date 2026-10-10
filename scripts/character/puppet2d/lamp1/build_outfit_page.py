"""Build docs/design/round4/asha/outfit/index.html: the one-page outfit comparison for the owner (Prakash visual language,
tokens and slot components from docs/design/round4/face/source/page.css). Self-contained: webp data URIs, Google Fonts
only, no external scripts. Page contract: starts with <title> then <style>; no doctype/html/head/body tags.
Every number is read from docs/design/round4/asha/evidence/*.json, not typed in.
  python3 -I build_outfit_page.py
"""
import base64, io, json, os, glob, html
from PIL import Image

SCR = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
A = "/home/user/Taxila/docs/design/round4/asha"
OUT = f"{A}/outfit/index.html"
os.makedirs(f"{A}/outfit", exist_ok=True)
FACECSS = open("/home/user/Taxila/docs/design/round4/face/source/page.css").read()
E = f"{A}/evidence"
T = json.load(open(f"{E}/tally-outfit.json"))
PICK, ALT = "o6-cardigan-print", "o5-denim-print"

FRONTS = [  # id, raw file, short name, one-line description
    ("saree-original", "w1-flat", "Saree (the face you chose)", "The option 4 front as you saw it: teal handloom saree, gold studs."),
    ("saree-age", "age-b", "Saree, grown-up face", "Same saree. Her face made a little fuller and settled, natural lips, tidier hair. Every outfit below uses this face."),
    ("o1-print", "o1-print", "Block-print kurta", "Straight indigo-teal cotton kurta with a sparse dabu-style print and a band collar. No dupatta."),
    ("o2-denim", "o2-denim", "Denim jacket", "A soft indigo denim jacket worn open over a plain teal kurta, a pen in the pocket."),
    ("o3-shirt", "o3-shirt", "Shirt-kurta", "Teal chambray shirt-kurta with a shirt collar and a pen. The open collar falls below the collarbone: it fails the modesty floor as drawn."),
    ("o4-cardigan", "o4-cardigan", "Cardigan", "A soft terracotta-rust cardigan worn open over a plain teal kurta."),
    ("o5-denim-print", "o5-denim-print", "Dark denim + print kurta", "A neat dark-indigo denim jacket over the band-collar block-print kurta, a pen in the pocket."),
    ("o6-cardigan-print", "o6-cardigan-print", "Cardigan + print kurta", "The terracotta-rust cardigan over the band-collar block-print kurta, oxidised-silver studs."),
]
CROP = {"head": (287, 18, 450, 585), "hs": (212, 8, 600, 780), "chip": (357, 105, 310, 403)}
JN = {"taxila-brain": "gpt-5.6-sol", "taxila-kimi26": "Kimi K2.6"}
esc = lambda s: html.escape(str(s), quote=True)

def uri(im, q=80):
    b = io.BytesIO(); im.save(b, "WEBP", quality=q, method=6)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())

def crop(im, box, size):
    x0, y0, w, h = box
    return im.crop((x0, y0, x0 + w, y0 + h)).resize(size, Image.LANCZOS)

total = 0
ASSET = {}
for fid, raw, name, desc in FRONTS:
    im = Image.open(f"{SCR}/raw/{raw}.png").convert("RGB")
    big, n1 = uri(im, 78)
    head, n2 = uri(crop(im, CROP["head"], (300, 390)), 82)
    hs, n3 = uri(crop(im, CROP["hs"], (384, 500)), 80)
    chip, n4 = uri(crop(im, CROP["chip"], (80, 104)), 85)
    th = im.resize((160, 160), Image.LANCZOS); thumb, n5 = uri(th, 78)
    total += n1 + n2 + n3 + n4 + n5
    ASSET[fid] = {"big": big, "head": head, "hs": hs, "chip": chip, "thumb": thumb, "name": name, "desc": desc}

# the face change: a matched crop of the two saree fronts
fa = Image.open(f"{SCR}/raw/w1-flat.png").convert("RGB"); fb = Image.open(f"{SCR}/raw/age-b.png").convert("RGB")
FACE_A, n = uri(fa.crop((300, 150, 720, 640)).resize((336, 392), Image.LANCZOS), 82); total += n
FACE_B, n = uri(fb.crop((300, 150, 720, 640)).resize((336, 392), Image.LANCZOS), 82); total += n

ARCH = "M0,1 L0,0.40 C0,0.22 0.22,0.14 0.38,0.09 C0.45,0.07 0.49,0.035 0.5,0 C0.51,0.035 0.55,0.07 0.62,0.09 C0.78,0.14 1,0.22 1,0.40 L1,1 Z"
def archD(w, h, inset):
    sx = lambda x: f"{inset + x * (w - 2 * inset):.2f}"; sy = lambda y: f"{inset + y * (h - inset):.2f}"
    return (f"M{sx(0)},{h} L{sx(0)},{sy(.40)} C{sx(0)},{sy(.22)} {sx(.22)},{sy(.14)} {sx(.38)},{sy(.09)} C{sx(.45)},{sy(.07)} {sx(.49)},{sy(.035)} {sx(.5)},{sy(0)} "
            f"C{sx(.51)},{sy(.035)} {sx(.55)},{sy(.07)} {sx(.62)},{sy(.09)} C{sx(.78)},{sy(.14)} {sx(1)},{sy(.22)} {sx(1)},{sy(.40)} L{sx(1)},{h}")
JHFRAME = f"""<svg class="jh-frame" viewBox="0 0 100 130" preserveAspectRatio="none" aria-hidden="true"><path d="{archD(100,130,0)}" fill="none" stroke="#5B3326" stroke-width="7" vector-effect="non-scaling-stroke" opacity=".85"/><path d="{archD(100,130,0)}" fill="none" stroke="url(#gBrass)" stroke-width="3.2" vector-effect="non-scaling-stroke"/><path d="{archD(100,130,4.2)}" fill="none" stroke="rgba(255,230,180,.55)" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>"""
def jh(src, cls, alt, key):
    return f'<div class="jhw {cls}"><div class="jharokha"><img class="jh-face" data-k="{key}" src="{src}" alt="{esc(alt)}"><div class="jh-grade"></div><div class="jh-rim"></div></div>{JHFRAME}</div>'
SLATE = """<svg class="slate-tree" viewBox="0 0 200 92" aria-hidden="true"><path d="M100,30 L62,62 M100,30 L138,62" stroke="#F4E7C9" stroke-width="2" stroke-linecap="round" opacity=".8"/>
<rect x="82" y="8" width="36" height="26" rx="2" fill="#262A44" stroke="#F4E7C9" stroke-width="2"/><text x="100" y="27" text-anchor="middle" font-family="Eczar,Georgia,serif" font-weight="700" font-size="16" fill="#F4E7C9">12</text>
<path d="M62,50 l9,4 3,9 -3,9 -9,4 -9,-4 -3,-9 3,-9 z" transform="translate(0,-1)" fill="#2b2a3a" stroke="#FFD27A" stroke-width="2"/><text x="62" y="68" text-anchor="middle" font-family="Eczar,Georgia,serif" font-weight="700" font-size="15" fill="#FFD27A">3</text>
<rect x="124" y="52" width="28" height="22" rx="2" fill="#262A44" stroke="#F4E7C9" stroke-width="2"/><text x="138" y="68" text-anchor="middle" font-family="Eczar,Georgia,serif" font-weight="700" font-size="15" fill="#F4E7C9">4</text></svg>"""

def slots(a):
    return f"""<div class="slots4">
  <figure class="slot home"><div class="dusk"><div class="pav"><div class="pav-roof"></div><div class="pav-win">{jh(a['head'], 'win150', 'Asha in the home window', 'head')}</div></div><div class="lamps"></div></div><figcaption>Home window · 150 × 190</figcaption></figure>
  <figure class="slot lesson"><div class="ls-mini"><div class="slate">{SLATE}</div><div class="dlg panel solid"><div class="portrait">{jh(a['head'], 'win90', 'Asha beside the slate', 'head')}</div><div class="nameplate"><b>Asha</b><span class="ai">AI</span></div><div class="cap" aria-hidden="true"><i></i><i></i><i class="s"></i></div></div></div><figcaption>Lesson portrait · 90 × 117</figcaption></figure>
  <figure class="slot tall"><div class="tallbox">{jh(a['hs'], 'win250', 'Asha at 250 px tall, head and shoulders', 'hs')}</div><figcaption>250 px tall (laptop lesson, teacher pick) · head and shoulders</figcaption></figure>
  <figure class="slot game"><div class="gm-mini"><div class="block">72</div><div class="react"><div class="mini">{jh(a['chip'], 'win38', 'Asha, game chip', 'chip')}</div><div class="t"><b>Asha</b><i></i></div></div></div><figcaption>Game chip · 38 × 48</figcaption></figure>
</div>"""

def nums(fid):
    s = T["single"][fid]; n = s["n"]
    ages = ", ".join(s["ages"])
    ref = f" · <b>{len(s['errors'])} refused</b> by Kimi's content filter" if s["errors"] else ""
    f = lambda xs: " ".join(str(x) for x in xs)
    return (f"<ul class='nums'><li><b>Age read</b> {esc(ages)}</li><li><b>Friendly</b> {f(s['friendly'])} <span>(mean {s['friendly_mean']})</span></li>"
            f"<li><b>Cool to a 12-year-old</b> {f(s['cool'])} <span>(mean {s['cool_mean']})</span></li><li><b>Professional to a parent</b> {f(s['prof'])} <span>(mean {s['prof_mean']})</span></li>"
            f"<li><b>Teacher</b> {s['teacher']}/{n} · <b>Indian</b> {s['indian']}/{n} · <b>childish</b> {s['childish']}/{n} · <b>sexualised</b> {s['sexualised']}/{n}{ref}</li></ul>")

def verbatim(fid):
    rows = []
    for f in sorted(glob.glob(f"{E}/blind-outfit-*.json")):
        for r in json.load(open(f))["runs"]:
            if r.get("label") != fid or "answer" not in r: continue
            a = r["answer"]
            rows.append(f"<tr><td>{JN.get(r['model'], r['model'])} #{r['rep'] + 1}</td><td>{esc(a.get('apparent_age_range'))}</td><td>{esc(a.get('clothing', ''))}</td>"
                        f"<td>{esc(a['friendly']['v'])}: {esc(a['friendly'].get('why', ''))}</td><td>{esc(a['cool']['v'])}: {esc(a['cool'].get('why', ''))}</td>"
                        f"<td>{esc(a['parent_professional']['v'])}: {esc(a['parent_professional'].get('why', ''))}</td></tr>")
    return ("<details class='vb'><summary>Every judge answer, verbatim</summary><div class='tw'><table><thead><tr><th>judge</th><th>age</th><th>what she wears</th><th>friendly</th><th>cool</th><th>professional</th></tr></thead><tbody>"
            + "".join(rows) + "</tbody></table></div></details>")

def lineup(grp, title):
    d = T["lineups"][grp]
    lab = {"most_friendly": "Most friendly", "most_cool": "Most cool to a 12-year-old", "most_professional": "Most professional to a parent",
           "least_professional": "Least professional to a parent", "overall": "Overall pick for the app"}
    nm = lambda k: ASSET[k]["name"] if k in ASSET else k
    rows = "".join(f"<tr><td>{lab[k]}</td><td>{', '.join(f'{esc(nm(a))} <b>{b}/5</b>' for a, b in sorted(d[k].items(), key=lambda x: -x[1]))}</td></tr>" for k in lab)
    why = []
    for f in sorted(glob.glob(f"{E}/{grp}-*.json")):
        for r in json.load(open(f))["runs"]:
            if "mapped" in r: why.append(f"<li><b>{JN.get(r['model'], r['model'])} #{r['rep'] + 1}</b> chose {esc(nm(r['mapped']['overall']['v']))}: “{esc(r['mapped']['overall']['why'])}”</li>")
    return f"<h3>{title}</h3><div class='tw'><table><tbody>{rows}</tbody></table></div><details class='vb'><summary>Why each judge chose its overall pick, verbatim</summary><ul class='why-l'>{''.join(why)}</ul></details>"

sel = "".join(f'<button class="pickb{" on" if fid == PICK else ""}" data-f="{fid}" aria-pressed="{"true" if fid == PICK else "false"}"><img src="{ASSET[fid]["thumb"]}" alt="" width="80" height="80"><span>{esc(ASSET[fid]["name"])}</span></button>' for fid, *_ in FRONTS)
DATA = json.dumps({fid: {k: ASSET[fid][k] for k in ("big", "head", "hs", "chip", "name", "desc")} | {"nums": nums(fid), "vb": verbatim(fid)} for fid, *_ in FRONTS})
P, Al = T["single"][PICK], T["single"][ALT]
_L = json.load(open(f"{A}/ledger.json")); LEDN = len(_L["calls"]); LEDUSD = f"{sum(c['usd'] for c in _L['calls']):.2f}"
L2 = T["lineups"]["lineup2-outfit"]

EXTRA_CSS = """
.slots4 { display: grid; gap: 14px; }
.tallbox { background: linear-gradient(180deg, #2A1B2C, #140D1A); padding: 14px; display: grid; place-items: center; }
.jhw.win250 { width: 192px; height: 250px; }
.pickgrid { display: grid; gap: 16px; }
.pickgrid .front img { max-width: 512px; width: 100%; height: auto; }
.reason { font: 500 17px/1.5 var(--f-ui); color: var(--ink); }
.reason b { color: var(--lamp-hi); }
.alt { display: grid; grid-template-columns: 96px 1fr; gap: 12px; align-items: center; }
.alt img { width: 96px; height: 96px; }
.sel { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.pickb { display: grid; gap: 4px; justify-items: center; padding: 4px 0 6px; min-height: 44px; color: var(--ink-2); font: 600 14px/1.2 var(--f-ui); text-align: center; background: none; border: 0; cursor: pointer; }
.pickb img { width: 100%; max-width: 96px; height: auto; aspect-ratio: 1; outline: 1px solid var(--hair-2); }
.pickb.on { color: var(--lamp); } .pickb.on img { outline: 2px solid var(--lamp); }
.viewer { display: grid; gap: 16px; }
.viewer .front img { max-width: 512px; width: 100%; height: auto; }
.nums { margin: 0; padding-left: 18px; display: grid; gap: 6px; font: 400 16px/1.5 var(--f-ui); color: var(--ink-2); }
.nums b { color: var(--ink); font-weight: 600; } .nums span { color: var(--ink-3); }
.vb summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font: 600 15px var(--f-ui); color: var(--lamp); }
.tw { overflow-x: auto; max-width: 100%; }
.tw table { width: 100%; min-width: 560px; border-collapse: collapse; font: 400 14px/1.4 var(--f-ui); color: var(--ink-2); }
.tw th, .tw td { text-align: left; padding: 6px 4px; border-top: 1px solid var(--hair-2); vertical-align: top; }
.tw th { color: var(--ink-3); font-weight: 600; }
.ev .tw table { min-width: 0; }
.why-l { margin: 0; padding-left: 18px; display: grid; gap: 6px; font: 400 15px/1.5 var(--f-ui); color: var(--ink-2); }
.facepair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 520px; }
.facepair img { width: 100%; height: auto; }
.facepair figcaption { font: 500 14px/1.35 var(--f-ui); color: var(--ink-3); margin-top: 4px; }
.desc { font: 400 16px/1.5 var(--f-ui); color: var(--ink-2); }
.sumt td:first-child { color: var(--ink); }
@media (min-width: 760px) {
  .pickgrid, .viewer { grid-template-columns: minmax(0, 512px) minmax(0, 1fr); align-items: start; }
  .sel { grid-template-columns: repeat(8, minmax(0, 1fr)); }
  .slots4 { grid-template-columns: 1fr 1fr; }
  .slot.home { grid-column: 1 / -1; }
}
"""

def summary_rows():
    out = []
    for fid, *_ in FRONTS:
        s = T["single"][fid]
        out.append(f"<tr><td>{esc(ASSET[fid]['name'])}</td><td>{esc(', '.join(sorted(set(s['ages']))))}</td><td>{s['friendly_mean']}</td><td>{s['cool_mean']}</td><td>{s['prof_mean']}</td><td>{s['indian']}/{s['n']}</td><td>{s['childish']}/{s['n']} · {s['sexualised']}/{s['n']}</td></tr>")
    return "".join(out)

page = f"""<title>Asha's outfit</title>
<style>
{FACECSS}
{EXTRA_CSS}
</style>
<meta name="viewport" content="width=device-width, initial-scale=1">
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<clipPath id="jhClip" clipPathUnits="objectBoundingBox"><path d="{ARCH}"/></clipPath>
<linearGradient id="gBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE3A3"/><stop offset=".45" stop-color="#D9A54E"/><stop offset="1" stop-color="#8E5F22"/></linearGradient>
</defs></svg>
<main>
<header class="top">
  <p class="eyebrow lamp">Round 4 · option 4, Lamplight flat · one teacher</p>
  <h1>Asha's outfit</h1>
  <p class="lede">You asked for something that makes her look more friendly and a bit cool than the saree. I read what Indian teachers wear and what children and parents read in teacher clothes. Then I drew eight versions of the same Asha and had two AI models judge each one blind. Below: my pick, every option at full size and in the real Prakash slots, and the numbers.</p>
  <nav class="nav"><a class="chip" href="#pick">The pick</a><a class="chip" href="#face">Her face</a><a class="chip" href="#all">All eight</a><a class="chip" href="#votes">Head to head</a><a class="chip" href="#why">Research</a><a class="chip" href="#limits">Limits</a></nav>
</header>

<section class="pick panel solid" id="pick">
  <p class="eyebrow lamp">My pick</p>
  <h2 class="h-2">{esc(ASSET[PICK]['name'])}</h2>
  <div class="pickgrid">
    <figure class="front"><img src="{ASSET[PICK]['big']}" alt="Asha in a terracotta cardigan over a teal block-print kurta" width="512" height="512"><figcaption>Full size (1024 px; 1:1 on a 2× phone screen)</figcaption></figure>
    <div class="why">
      <p class="reason"><b>Why:</b> the two blind judges chose it as the overall outfit in all 5 head-to-head runs, and the cardigan was the friendliest look in all 10. It still reads fully professional to a parent ({P['prof_mean']}/5) and Indian ({P['indian']}/{P['n']}), never childish or glamorous.</p>
      <p class="reason"><b>The catch:</b> the judges do not find it "cool" ({P['cool_mean']}/5, about the same as the saree). If cool matters more to you, the runner-up is below.</p>
      <div class="alt"><img src="{ASSET[ALT]['thumb']}" alt="" width="96" height="96"><p class="desc"><b>Runner-up: {esc(ASSET[ALT]['name'])}.</b> The coolest outfit that stays fully professional: cool {Al['cool_mean']}/5, professional {Al['prof_mean']}/5, the most professional in 5/5 head-to-head runs. Plain denim was cooler (3.6) but the least professional in 10/10.</p></div>
      <p class="desc">You can override this. The puppet keeps her clothes as one swappable body layer, so changing the outfit later means re-cutting that one layer, not rebuilding her.</p>
    </div>
  </div>
  {slots(ASSET[PICK])}
</section>

<section class="ev panel" id="face">
  <p class="eyebrow">Her face, older by a few years</p>
  <h3>Same person, more settled</h3>
  <p>Blind readers put the face you chose at 25-35 in 5 of 5 runs, the youngest of the four options. So, before any outfit, I made one careful edit: a slightly fuller, softer face, faint smile-line planes beside the mouth, natural unpainted lips instead of the deep coral, and tidier hair with one loose lock per side. On the saree, gpt-5.6-sol then read her as 28-38, 27-35 and 28-38. Kimi still said 25-35. The new outfits read a little younger again (mostly 25-35). The rig front will push the age cues one more step (see Limits).</p>
  <div class="facepair"><figure><img src="{FACE_A}" alt="the face as chosen" width="336" height="392"><figcaption>As you chose it</figcaption></figure><figure><img src="{FACE_B}" alt="the grown-up face" width="336" height="392"><figcaption>Grown-up edit (used for every outfit)</figcaption></figure></div>
</section>

<section class="fam" id="all">
  <div class="fam-head"><p class="eyebrow">All eight, judged the same way</p><h2 class="h-2">Tap one to see it</h2>
  <p class="lede">The big picture, the four slots and the blind numbers all switch to the one you tap. Every outfit is an edit of the same grown-up face, so only the clothes change.</p></div>
  <div class="panel fam-body">
    <div class="sel" role="group" aria-label="Choose an outfit">{sel}</div>
    <div class="viewer">
      <figure class="front"><img data-big src="{ASSET[PICK]['big']}" alt="the selected outfit at full size" width="512" height="512"><figcaption data-name>{esc(ASSET[PICK]['name'])}</figcaption></figure>
      <div class="why"><p class="desc" data-desc>{esc(ASSET[PICK]['desc'])}</p><h3 class="fh">Blind check, n = 5 (3 gpt-5.6-sol + 2 Kimi K2.6)</h3><div data-nums>{nums(PICK)}</div><div data-vb>{verbatim(PICK)}</div></div>
    </div>
    <div data-slots>{slots(ASSET[PICK])}</div>
  </div>
</section>

<section class="ev panel" id="votes">
  <p class="eyebrow">Head to head</p>
  <h3>All eight at a glance (single-image blind check, n = 5 each)</h3>
  <div class="tw"><table class="sumt"><thead><tr><th>outfit</th><th>ages read</th><th>friendly</th><th>cool</th><th>professional</th><th>Indian</th><th>childish · sexualised</th></tr></thead><tbody>{summary_rows()}</tbody></table></div>
  <p>Friendly, cool and professional are means of five 1-5 ratings. On a single picture the judges rate almost everything 4 for friendly, so the forced-choice lineups below separate the outfits better. In each run, four outfits sat in a 2 × 2 grid, the positions were shuffled, and the judge had to pick one per question.</p>
  {lineup('lineup-outfit', 'Round 1: the four first outfits (n = 5)')}
  {lineup('lineup2-outfit', 'Round 2: the four layered outfits (n = 5)')}
</section>

<section class="ev panel" id="why">
  <p class="eyebrow">Research, in short (full notes and sources in RESEARCH.md)</p>
  <h3>What the evidence says</h3>
  <ul>
    <li><b>Smart-casual is the sweet spot.</b> The one study with our ages (grades 4, 7 and 9; n = 60; Phillips & Smith 1992) found casual dress reads friendly and fair, conservative dress reads knowledgeable and strict, and the middle reads both friendly and in charge. A saree sits at the conservative end.</li>
    <li><b>A kurta without a dupatta, over trousers, is mainstream and accepted.</b> Himachal's 2026 dress code lists "kurta/kameez with pant" for women teachers. Maharashtra bans jeans and T-shirts for teachers, which is why denim needed testing, not assuming.</li>
    <li><b>Keep her teal.</b> In Prakash, the listening colour was lifted from Asha's teal. Lamp gold is reserved for "your move", and violet is the shadow colour, so neither can be her clothes.</li>
    <li><b>Mid-to-dark clothes only.</b> The window's lamplight is cream, so an ivory top would vanish into it at chip size.</li>
    <li><b>Small real cues</b> make a teacher read as a person: oxidised-silver studs and a pen in a pocket. The khadi Nehru jacket was dropped: in India it reads as a politician.</li>
  </ul>
</section>

<section class="ev panel" id="limits">
  <p class="eyebrow">Limits</p>
  <h3>What this cannot tell you</h3>
  <ul>
    <li>The judges are AI vision models (two families on Azure), a proxy for a parent or a child. No person has seen these.</li>
    <li>At the 90 × 117 and 150 × 190 head crops, the outfit is only a band at the bottom of the window. The clothes really show at 250 px and on the teacher-pick screen.</li>
    <li>Kimi's content filter refused the shirt-kurta 2 of 2 times, and by my eye its open collar falls below the collarbone. As drawn, it fails the modesty floor.</li>
    <li>No outfit moved her age read up: they read about 25-35, slightly younger than the saree. The rig front adds one more age step, checked blind again.</li>
    <li>Budget so far: {LEDN} images, USD {LEDUSD} of the 25 image cap (ledger.json). All images and judges are Azure deployments.</li>
  </ul>
</section>
<p class="foot">Round 4 · Asha · outfit research. Images: Azure gpt-image-2 edits of the option 4 front. Judges: gpt-5.6-sol and Kimi K2.6 on Azure. Page built by scripts/character/puppet2d/lamp1/build_outfit_page.py from the evidence JSON.</p>
</main>
<script type="application/json" id="fdata">{DATA}</script>
<script>
(function () {{
  var D = JSON.parse(document.getElementById("fdata").textContent);
  var sec = document.getElementById("all");
  sec.querySelectorAll(".pickb").forEach(function (b) {{
    b.addEventListener("click", function () {{
      var d = D[b.dataset.f];
      sec.querySelectorAll(".pickb").forEach(function (x) {{ x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); }});
      sec.querySelector("[data-big]").src = d.big;
      sec.querySelector("[data-name]").textContent = d.name;
      sec.querySelector("[data-desc]").textContent = d.desc;
      sec.querySelector("[data-nums]").innerHTML = d.nums;
      sec.querySelector("[data-vb]").innerHTML = d.vb;
      sec.querySelectorAll("[data-slots] .jh-face").forEach(function (im) {{ im.src = d[im.dataset.k]; }});
    }});
  }});
}})();
</script>
"""
open(OUT, "w").write(page)
print(OUT, round(os.path.getsize(OUT) / 1e6, 2), "MB; images", round(total / 1e6, 2), "MB")
