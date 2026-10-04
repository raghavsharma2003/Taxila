"""r3 frames sheet: c-front beside the puppet's key poses (battery renders at 1024, cream), labelled, plus mouth and eye
detail rows. -> art/character/puppet2d/polish-r4/frames-sheet.jpg"""
from PIL import Image, ImageDraw
B = "art/character/puppet2d/polish-r4/work/battery/cream/"
OUT = "art/character/puppet2d/polish-r4/frames-sheet.jpg"
cells = [("c-front (reference)", "art/character/puppet2d/polish-r4/c-front.png"), ("rest", B + "rest_h0_b0.png"), ("talk aa (through a smile)", B + "talk_aa_h0_b0.png"),
         ("talk O", B + "talk_O_h0_b0.png"), ("talk E", B + "talk_E_h0_b0.png"), ("listening", B + "listening_h0_b0.png"),
         ("thinking", B + "thinking_h0_b0.png"), ("warm", B + "warm_h0_b0.png"), ("delight", B + "delight_h0_b0.png"),
         ("concern", B + "concern_h0_b0.png"), ("surprise", B + "surprise_h0_b0.png"), ("playful", B + "playful_h0_b0.png"),
         ("blink: painted mid lid", B + "rest_h0_b50.png"), ("turn yaw -20 (painted key)", B + "rest_y-20_b0.png"), ("turn yaw +20 (painted key)", B + "rest_y+20_b0.png"),
         ("roll +8, thinking", B + "thinking_r+8_b0.png"), ("pitch +10, concern", B + "concern_p+10_b0.png"), ("yaw +20, delight", B + "delight_y+20_b0.png")]
S, cols = 400, 6
rows = (len(cells) + cols - 1) // cols
M = Image.new("RGB", (S * cols, (S + 22) * rows), (250, 240, 225))
d = ImageDraw.Draw(M)
for i, (lbl, p) in enumerate(cells):
    im = Image.open(p).convert("RGB").crop((150, 40, 890, 780)).resize((S, S), Image.LANCZOS)
    x, y = (i % cols) * S, (i // cols) * (S + 22)
    M.paste(im, (x, y + 22))
    d.text((x + 6, y + 5), lbl, fill=(60, 40, 30))
M.save(OUT, quality=90)
print(OUT, M.size)
