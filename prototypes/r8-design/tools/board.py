"""Builds prototypes/r8-design/board.html: one self-contained page for the owner to choose between A and B.
Every image is a downscaled JPEG data URI. Run from the repo root after tools/shoot.mjs:
    python3 prototypes/r8-design/tools/board.py
"""
import base64, io, os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
NOW = os.path.join(ROOT, "..", "..", "docs", "design", "round8", "ui-now")
SHOTS = os.path.join(ROOT, "shots")

def uri(path, width, crop_h=None, q=72):
    im = Image.open(path).convert("RGB")
    if crop_h and im.height > crop_h:
        im = im.crop((0, 0, im.width, crop_h))
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode(), width, h

# (title, current image or None, current note, A/B shot stem, phone?)
ROWS = [
    ("Child home, a lesson ready", "42-home-start-p360.png", "home", True),
    ("Lesson: the board up, a question open", "100-lesson-17-work-beat-p360.png", "lesson-board", True),
    ("Lesson: her turn, hands-free", "100-lesson-04-your_turn-p360.png", "lesson-turn", True),
    ("Lesson: a worked step on a number line, the teacher speaking Hindi", "100-lesson-17-work-beat-p360.png", "lesson-worked", True),
    ("Lesson on a laptop", "100-lesson-17-work-beat-d1366.png", "lesson-board", False),
    ("A game's level end", "111-play-01-taraazu-levelend-p360.png", "game", True),
    ("Parent corner", "123-parent-home-p360.png", "parent", True),
    ("Onboarding, step 1", "20-onb-class-p360.png", "onboarding", True),
    ("Offline home", "92-err-offline-home-p360.png", "offline", True),
]

def fig(label, src, alt, phone):
    d, w, h = uri(src, 300 if phone else 640, crop_h=1480 if phone else None)
    return f'<figure><figcaption>{label}</figcaption><img src="{d}" width="{w}" height="{h}" alt="{alt}" loading="lazy"></figure>'

sections = []
for title, now, stem, phone in ROWS:
    vp = "p360" if phone else "d1366"
    figs = [
        fig("Today", os.path.join(NOW, now), f"{title}, as the app is today", phone),
        fig("A · Paper and ink", os.path.join(SHOTS, f"a-{stem}-{vp}.png"), f"{title}, direction A", phone),
        fig("B · Night class", os.path.join(SHOTS, f"b-{stem}-{vp}.png"), f"{title}, direction B", phone),
    ]
    sections.append(f'<section class="{"phone" if phone else "wide"}"><h2>{title}</h2><div class="row">{"".join(figs)}</div></section>')

page = f"""<title>Taxila: pick a look</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&family=Source+Serif+4:opsz,wght@8..60,600&display=swap");
:root {{
  --bg: #F3F1EC; --card: #FFFFFF; --ink: #1B1B1A; --ink-2: #4B4A46; --line: #DCD7CD;
  --a: #8A5300; --b: #3F4FD8;
}}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--ink); font: 400 16px/1.55 "Atkinson Hyperlegible Next", system-ui, sans-serif; }}
main {{ max-width: 1200px; margin: 0 auto; padding: 32px 16px 80px; }}
h1 {{ font: 600 32px/1.15 "Source Serif 4", Georgia, serif; margin: 0 0 20px; letter-spacing: -.01em; }}
h2 {{ font: 600 21px/1.25 "Source Serif 4", Georgia, serif; margin: 0 0 14px; }}
.dirs {{ display: grid; gap: 12px; margin-bottom: 40px; }}
.dir {{ background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; }}
.dir b {{ display: block; margin-bottom: 4px; }}
.dir.a b {{ color: var(--a); }} .dir.b b {{ color: var(--b); }}
section {{ padding: 28px 0; border-top: 1px solid var(--line); }}
.row {{ display: grid; gap: 20px; grid-template-columns: minmax(0, 1fr); }}
figure {{ margin: 0; min-width: 0; }}
figcaption {{ font-weight: 700; font-size: 14px; color: var(--ink-2); margin-bottom: 8px; }}
img {{ display: block; max-width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--line); background: var(--card); }}
.phone img {{ width: 300px; }}
@media (min-width: 900px) {{
  .dirs {{ grid-template-columns: 1fr 1fr; }}
  .row {{ grid-template-columns: repeat(3, minmax(0, 1fr)); }}
  .wide .row {{ grid-template-columns: minmax(0, 1fr); }}
}}
@media (min-width: 1100px) {{ .wide .row {{ grid-template-columns: repeat(3, minmax(0, 1fr)); }} }}
</style>
<main>
<h1>Two looks for Taxila</h1>
<div class="dirs">
<p class="dir a"><b>A · Paper and ink</b>A warm paper ground, a book serif and one marigold accent, so the board reads like a well-set textbook page and the parent corner is the same app as the child's. It is the bigger change from today and must stay disciplined to keep from looking young.</p>
<p class="dir b"><b>B · Night class</b>Today's dark ground, calmed and stripped of the terminal tricks, with the board as a glowing slate and lime only when it is the child's move. It keeps what older children like about the current look, but the parent screens have to switch to light and it may not feel like a change.</p>
</div>
{"".join(sections)}
</main>
"""
out = os.path.join(ROOT, "board.html")
open(out, "w").write(page)
print(out, round(os.path.getsize(out) / 1e6, 2), "MB")
