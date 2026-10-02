# make-blind-page.py — writes samples/blind-test.html: clips grouped by passage, shuffled, labelled by code only.
# Ratings (human-likeness, Indian-ness, 1-5) stay in the listener's browser; "Export" copies JSON to score later
# against KEY.json. Open the file locally next to the mp3s; the page holds no arm names.
import json, os, random
HERE = os.path.dirname(os.path.abspath(__file__))
key = json.load(open(os.path.join(HERE, "samples", "KEY.json")))
random.seed(20261002)
by = {}
for c, v in key.items(): by.setdefault(v["passage"], []).append(c)
TITLES = {"a-greet": "A. Hinglish greeting + memory callback", "b-fractions": "B. Hinglish: equivalent fractions with a pizza",
          "c-hindi": "C. Pure Hindi, class 3", "d-english": "D. Indian English, teacher warmth", "e-praise-correct": "E. Shabash praise, then a gentle correction"}
sec = []
for p in sorted(by):
    cs = by[p][:]; random.shuffle(cs)
    items = "".join(f'<div class="clip"><b>{c}</b><audio controls preload="none" src="{c}.mp3"></audio>'
                    f'<label>human <input type="number" min="1" max="5" data-c="{c}" data-k="h"></label>'
                    f'<label>Indian <input type="number" min="1" max="5" data-c="{c}" data-k="i"></label></div>' for c in cs)
    sec.append(f"<h2>{TITLES.get(p, p)}</h2>{items}")
html = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Voice Blind Test v2</title><style>
:root{{--bg:#fff;--fg:#1a1a1a;--mut:#666;--line:#ddd}}
@media (prefers-color-scheme:dark){{:root{{--bg:#151515;--fg:#eee;--mut:#aaa;--line:#333}}}}
body{{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;margin:0 auto;max-width:760px;padding:16px}}
.clip{{display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-bottom:1px solid var(--line);padding:6px 0}}
.clip b{{width:56px;font-family:monospace}} audio{{height:32px;flex:1;min-width:200px}} input{{width:3em}}
p{{color:var(--mut)}}</style></head><body>
<h1>Hindi teacher voice: blind test v2</h1>
<p>Rate each clip 1-5. <b>human</b>: could this be a real person? <b>Indian</b>: does it sound like a native Indian Hindi speaker (not a foreigner attempting Hindi)? Clips are shuffled; codes reveal nothing.</p>
{''.join(sec)}
<p><button id="x">Export ratings</button> <span id="s"></span></p>
<script>
const K='taxila-blind-v2';let st={{}};try{{st=JSON.parse(localStorage.getItem(K)||'{{}}')}}catch(e){{}}
document.querySelectorAll('input').forEach(i=>{{const k=i.dataset.c+'.'+i.dataset.k;if(st[k])i.value=st[k];
i.onchange=()=>{{st[k]=+i.value;try{{localStorage.setItem(K,JSON.stringify(st))}}catch(e){{}}}}}});
document.getElementById('x').onclick=()=>{{const t=JSON.stringify(st);navigator.clipboard?.writeText(t);document.getElementById('s').textContent='copied ('+Object.keys(st).length+' ratings)';}};
</script></body></html>"""
open(os.path.join(HERE, "samples", "blind-test.html"), "w").write(html)
print("clips", len(key))
