"""stylised-premium before / after: iteration 2 | procedural-v3 | stylised-premium, same camera, same light rig.
    python3 scripts/character/bakeoff/stylised-premium/compare.py"""
import os
from PIL import Image, ImageDraw
E = ["warm", "encouraging", "curious", "thinking", "listening", "concerned", "delighted", "playful", "surprised"]
ROWS = [("iteration 2 (renders/teal)", "docs/design/teacher/renders/teal"),
        ("procedural-v3", "docs/design/teacher/bakeoff/procedural-v3/renders/teal"),
        ("stylised-premium", "docs/design/teacher/bakeoff/stylised-premium/renders/teal")]
W, H, LBL = 200, 250, 22
img = Image.new("RGB", (W * 9, (H + LBL) * 3 * 2), (16, 16, 20))
d = ImageDraw.Draw(img)
y = 0
for name, root in ROWS:
    d.text((6, y + 5), f"{name}: 9 emotions (H, face camera, stage rig)", fill=(230, 230, 210))
    for i, e in enumerate(E):
        p = os.path.join(root, "emotions", f"{e}.png")
        if os.path.exists(p):
            img.paste(Image.open(p).convert("RGB").resize((W, H)), (i * W, y + LBL))
            d.text((i * W + 4, y + LBL + 3), e, fill=(255, 255, 255))
    y += H + LBL
for name, root in ROWS:
    d.text((6, y + 5), f"{name}: turntable 0/90/180/270 (bust) + idle state", fill=(230, 230, 210))
    for i, yaw in enumerate((0, 90, 180, 270)):
        p = os.path.join(root, "turntable", f"yaw{yaw:03d}.png")
        if os.path.exists(p):
            img.paste(Image.open(p).convert("RGB").resize((W, H)), (i * W, y + LBL))
    p = os.path.join(root, "states", "idle.png")
    if os.path.exists(p):
        img.paste(Image.open(p).convert("RGB").resize((W, H)), (4 * W, y + LBL))
    y += H + LBL
out = "docs/design/teacher/bakeoff/stylised-premium/renders/before-after.png"
img.save(out, optimize=True)
print(out)
