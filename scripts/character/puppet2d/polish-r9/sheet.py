"""r5 frames sheet (r9 labels: relit turn, soft open-mouth lower face, thinking moue, concern B round lip): c-front beside the puppet's key poses (renders at 1024, view 0,0,1024, cream), labelled; the
articulation row (aa, O, E/ee, U, m-b-p closure, f/v tuck, l/t/d tongue tip, ch) is new in r4.
-> art/character/puppet2d/polish-r9/frames-sheet.jpg  (+ the 3x3 blind-judge grid, same cells/order as judge-r3)
    python3 scripts/character/puppet2d/polish-r9/sheet.py"""
import os
from PIL import Image, ImageDraw
B = "art/character/puppet2d/polish-r9/work/sheet/"
OUT = "art/character/puppet2d/polish-r9/frames-sheet.jpg"
cells = [("c-front (reference)", "art/character/puppet2d/polish-r9/c-front.png"), ("rest", "rest"), ("talk aa (jaw drop)", "talk_aa"),
         ("talk O (rounded)", "talk_O"), ("talk E / ee (spread)", "talk_E"), ("talk U (pucker)", "talk_U"),
         ("talk m / b / p (closure)", "talk_PP"), ("talk f / v (incisors on lip)", "talk_FF"), ("talk l / t / d (tongue tip)", "talk_L"),
         ("talk ch (flared, teeth meet)", "talk_CH"), ("listening", "listening"), ("warm", "warm"),
         ("thinking UP, DEFAULT r9 (tall one-sided arch, moue, eyes higher)", "thinking"), ("thinking UP2 (mirrored take)", "thinking_v1"), ("thinking C, rare (eyes down)", "thinking_v2"),
         ("concern A (knit, press, one corner down)", "concern"), ("concern B r9 (round lower lip, curled corners, softer brows)", "concern_v1"), ("concern C (softer, leaning in)", "concern_v2"),
         ("delight A", "delight"), ("delight B (other take)", "delight_v1"), ("surprise r9 (egg O, thin lower lip, warm cavity)", "surprise"),
         ("playful (wink, her right)", "playful"), ("playful B (wink, her left)", "playful_v1"), ("blink: frame 1 of the real blink (mid key)", "blink_mid"),
         ("turn yaw -20 (r9: relit from yaw)", "yaw_m20"), ("turn yaw -12", "yaw_m12"), ("turn yaw +12", "yaw_p12"),
         ("turn yaw +20 (r9: relit)", "yaw_p20"), ("delight at yaw +20", "delight_yp20"), ("talk O at yaw -16", "talk_O_ym16")]
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
J = "art/character/puppet2d/polish-r9/work/blind"
os.makedirs(J, exist_ok=True)
G = Image.new("RGB", (1536, 1536), (251, 229, 189))
for i, n in enumerate(["rest", "talk_aa", "thinking", "delight", "concern", "surprise", "playful", "concern_v1", "yaw_p20"]):
    im = Image.open(B + n + ".png").convert("RGB").crop((165, 40, 885, 760)).resize((512, 512), Image.LANCZOS)   # r3 framing (hair to collar)
    G.paste(im, ((i % 3) * 512, (i // 3) * 512))
G.save(f"{J}/grid_X.jpg", quality=92)
Image.open("art/character/puppet2d/polish-r9/c-front.png").convert("RGB").resize((768, 768), Image.LANCZOS).save(f"{J}/ref.jpg", quality=92)
print("grid", f"{J}/grid_X.jpg")
