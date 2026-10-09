"""WCAG 2.x contrast for the Prakash tokens (round 4, key `world`). Glass panels are alpha-composited over the
brightest scene colour that can sit behind them (worst case). Run: python3 contrast.py > contrast.json"""
import json

def hx(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def over(fg, a, bg):
    return tuple(round(a * f + (1 - a) * b) for f, b in zip(fg, bg))
def lum(c):
    def ch(v):
        v /= 255; return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(v) for v in c); return 0.2126 * r + 0.7152 * g + 0.0722 * b
def cr(a, b):
    la, lb = lum(a), lum(b); hi, lo = max(la, lb), min(la, lb); return round((hi + 0.05) / (lo + 0.05), 2)

# worst-case backdrops behind glass: the brightest dusk-sky stop and the dawn horizon
BRIGHT_DUSK, BRIGHT_DAWN = hx('#F6B466'), hx('#FCE3C4')
glass = over(hx('#15122A'), .84, BRIGHT_DUSK)          # .panel (rgba(21,18,42,.84))
glass2 = over(hx('#211C3E'), .90, BRIGHT_DAWN)         # .panel.solid (rgba(33,28,62,.90))
sheet = over(hx('#181530'), .975, BRIGHT_DUSK)
slate = hx('#1C1F35')
ground = over(hx('#14081C'), .5, hx('#3A2440'))        # hello title over the gate ground + veil
pick_bg = hx('#B48AA6')                                  # valley floor behind the pick heading, darkest likely
pick_bg2 = hx('#A895BC')
lamp_lo, lamp = hx('#EE9F35'), hx('#FFC24D')

rows = [
  # child world (dark)
  ("ink on glass (worst)", '#F7F0E6', glass, "body ≥16 px", 4.5),
  ("ink-2 on glass (worst)", '#D3C8E0', glass, "secondary ≥14 px", 4.5),
  ("ink-3 on glass (worst)", '#ADA2C2', glass, "labels ≥14 px", 4.5),
  ("ink on solid panel over dawn", '#F7F0E6', glass2, "body", 4.5),
  ("ink-3 on solid panel over dawn", '#ADA2C2', glass2, "labels", 4.5),
  ("lamp gold text on glass", '#FFC24D', glass, "eyebrows ≥14 px bold", 4.5),
  ("lamp-ink on lamp button (darkest stop)", '#2A1607', lamp_lo, "button 17 px bold", 4.5),
  ("lamp-ink on lamp", '#2A1607', lamp, "button", 4.5),
  ("listen teal on glass", '#63D6CB', glass, "state word 15 px", 4.5),
  ("look blue on slate", '#86C9F6', slate, "look-again glyph and text", 3.0),
  ("chalk on slate", '#F4E7C9', slate, "board numbers ≥17 px", 4.5),
  ("known gold on slate", '#FFD27A', slate, "prime numbers on board", 4.5),
  ("board heading (chalk 72%) on slate", over(hx('#F4E7C9'), .72, slate), slate, "15 px", 4.5),
  ("ink on map sheet", '#F7F0E6', sheet, "body", 4.5),
  ("hello title on gate ground", '#FFF4E6', ground, "64 px display", 3.0),
  ("hello lede on gate ground", '#F1DCD2', ground, "18 px", 4.5),
  ("pick heading on valley floor", '#2C1A33', pick_bg, "27 px display", 3.0),
  ("pick meta on valley floor", '#2F1E36', pick_bg2, "14 px", 4.5),
  ("pick eyebrow on sky", '#33213A', pick_bg2, "14 px caps", 4.5),
  # parent corner (day)
  ("p-ink on p-bg", '#1D1A28', hx('#F4EDE2'), "headline", 4.5),
  ("p-ink-2 on p-card", '#554D63', hx('#FFFCF7'), "body 16 px", 4.5),
  ("p-brass on p-card", '#855614', hx('#FFFCF7'), "labels 14 px bold", 4.5),
  ("p-teal on p-card", '#1D6870', hx('#FFFCF7'), "state label", 4.5),
  ("p-ok on p-card", '#24644A', hx('#FFFCF7'), "safety glyph", 3.0),
]
out = []
for name, fg, bg, use, need in rows:
    f = hx(fg) if isinstance(fg, str) else fg
    r = cr(f, bg)
    out.append({"pair": name, "fg": fg if isinstance(fg, str) else '#%02X%02X%02X' % f, "bg": '#%02X%02X%02X' % bg, "ratio": r, "use": use, "needs": need, "pass": r >= need})
print(json.dumps({"date": "2026-10-09", "method": "WCAG 2.x relative luminance; glass alpha-composited over the brightest scene stop behind it", "n_pairs": len(out), "fails": [o["pair"] for o in out if not o["pass"]], "pairs": out}, indent=1, ensure_ascii=False))
