"""r4 frames sheet: c-front beside the puppet's key poses (renders at 1024, view 0,0,1024, cream), labelled; the
articulation row (aa, O, E/ee, U, m-b-p closure, f/v tuck, l/t/d tongue tip, ch) is new in r4.
-> art/character/puppet2d/polish-r5/frames-sheet.jpg  (+ the 3x3 blind-judge grid, same cells/order as judge-r3)
    python3 scripts/character/puppet2d/polish-r5/sheet.py"""
import os
from PIL import Image, ImageDraw
B = "art/character/puppet2d/polish-r5/work/sheet/"
OUT = "art/character/puppet2d/polish-r5/frames-sheet.jpg"
cells = [("c-front (reference)", "art/character/puppet2d/polish-r5/c-front.png"), ("rest", "rest"), ("talk aa (jaw drop)", "talk_aa"),
         ("talk O (rounded)", "talk_O"), ("talk E / ee (spread)", "talk_E"), ("talk U (pucker)", "talk_U"),
         ("talk m / b / p (closure)", "talk_PP"), ("talk f / v (tuck)", "talk_FF"), ("talk l / t / d (tongue tip)", "talk_L"),
         ("talk ch", "talk_CH"), ("listening", "listening"), ("thinking", "thinking"),
         ("warm", "warm"), ("delight", "delight"), ("concern", "concern"), ("surprise", "surprise"), ("playful", "playful"),
         ("blink: frame 1 of the real blink (mid key, lids 0.6)", "blink_mid"), ("turn yaw -20 (painted plate)", "yaw_m20"), ("turn yaw -10 (blend)", "yaw_m10"),
         ("turn yaw +10 (blend)", "yaw_p10"), ("turn yaw +20 (painted plate)", "yaw_p20"), ("roll +8, thinking", "thinking_r8"),
         ("yaw +20, delight", "delight_yp20")]
S, cols = 400, 6
rows = (len(cells) + cols - 1) // cols
M = Image.new("RGB", (S * cols, (S + 22) * rows), (250, 240, 225))
d = ImageDraw.Draw(M)
for i, (lbl, p) in enumerate(cells):
    src = p if p.endswith(".png") else B + p + ".png"
    im = Image.open(src).convert("RGB").crop((150, 40, 890, 780)).resize((S, S), Image.LANCZOS)
    x, y = (i % cols) * S, (i // cols) * (S + 22)
    M.paste(im, (x, y + 22))
    d.text((x + 6, y + 5), lbl, fill=(60, 40, 30))
M.save(OUT, quality=90)
print(OUT, M.size)
# blind grid: rest, talking aa, thinking, delight, concern, surprise, playful, mid-blink, head turned ~20 (judge-r3 order)
J = "art/character/puppet2d/polish-r5/work/blind"
os.makedirs(J, exist_ok=True)
G = Image.new("RGB", (1536, 1536), (251, 229, 189))
for i, n in enumerate(["rest", "talk_aa", "thinking", "delight", "concern", "surprise", "playful", "blink_mid", "yaw_p20"]):
    im = Image.open(B + n + ".png").convert("RGB").crop((165, 40, 885, 760)).resize((512, 512), Image.LANCZOS)   # r3 framing (hair to collar)
    G.paste(im, ((i % 3) * 512, (i // 3) * 512))
G.save(f"{J}/grid_X.jpg", quality=92)
Image.open("art/character/puppet2d/polish-r5/c-front.png").convert("RGB").resize((768, 768), Image.LANCZOS).save(f"{J}/ref.jpg", quality=92)
print("grid", f"{J}/grid_X.jpg")
