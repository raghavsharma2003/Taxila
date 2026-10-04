# Owner sheet for arm V: c-front | rest at full size (+128 px thumbs), then concept-vs-render pairs, the turn strip,
# the extra emotions and the Hindi tongue shapes. python3 scripts/character/puppet2d/V/frames_sheet.py
from PIL import Image, ImageDraw, ImageFont
C = "docs/design/teacher/stylised/concepts/"; R = "docs/design/teacher/stylised/build/refs/"; E = "art/character/puppet2d/V/evidence/poses/"
try:
    F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26); f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
except Exception:
    F = f = ImageFont.load_default()
ld = lambda p: Image.open(p).convert("RGB")
W = 2120
rows = []
# row 1: full size
r1 = Image.new("RGB", (W, 1100), "white"); d = ImageDraw.Draw(r1)
r1.paste(ld(C + "c-front.webp").resize((1024, 1024)), (20, 60)); r1.paste(ld(E + "rest.png").resize((1024, 1024)), (1076, 60))
d.text((20, 15), "c-front (concept C)", font=F, fill=(0, 0, 0)); d.text((1076, 15), "arm V vector puppet, rest pose (no image pixels)", font=F, fill=(0, 0, 0))
rows.append(r1)
def pairs(items, title, cell=340):
    n = len(items); im = Image.new("RGB", (W, cell + 90), "white"); d = ImageDraw.Draw(im)
    d.text((20, 10), title, font=F, fill=(0, 0, 0))
    x = 20
    for lab, path, box in items:
        a = ld(path); a = a.crop(box) if box else a
        a = a.resize((cell, cell)); im.paste(a, (x, 50)); d.text((x, cell + 56), lab, font=f, fill=(40, 40, 40)); x += cell + 10
    return im
face = (150, 60, 900, 810)
rows.append(pairs([("c-talking", C + "c-talking.webp", None), ("V talk 'aa'", E + "talk_aa.png", face), ("c-listening", C + "c-listening.webp", None), ("V listening", E + "listening.png", face), ("c-thinking", C + "c-thinking.webp", None), ("V thinking", E + "thinking.png", face)], "concept vs puppet (same crop scale)", 335))
rows.append(pairs([("c-happy", C + "c-happy.webp", None), ("V delight", E + "delight.png", face), ("V delight, crescent eyes", E + "delight_crescent.png", face), ("V gentle concern", E + "concern.png", face), ("V surprise", E + "surprise.png", face), ("V playful", E + "playful.png", face)], "emotion register", 335))
rows.append(pairs([("ref q3-right", R + "q3-right.webp", None), ("V yaw -20", E + "yaw_m20.png", face), ("V rest", E + "rest.png", face), ("V yaw +20", E + "yaw_p20.png", face), ("ref q3-left", R + "q3-left.webp", None), ("V blink (mid)", E + "blink_mid.png", face)], "head turn (refs are ~30-35 deg, puppet clamps at 20) and blink", 335))
m = (430, 555, 630, 690)
rows.append(pairs([("PP (bilabial)", E + "talk_PP.png", m), ("O", E + "talk_O.png", m), ("E", E + "talk_E.png", m), ("dental t/d: tip up", E + "tongue_DD_tipUp.png", m), ("retroflex: curl", E + "tongue_retroflex.png", m), ("TH: tip to teeth", E + "tongue_TH.png", m)], "mouth + Hindi tongue keys (close-up)", 335))
H = sum(r.height for r in rows); S = Image.new("RGB", (W, H), "white"); y = 0
for r in rows: S.paste(r, (0, y)); y += r.height
# 128 px thumbs on row 1
t1 = ld(C + "c-front.webp").resize((128, 128)); t2 = ld(E + "rest.png").resize((128, 128))
S.paste(t1, (W - 290, 1100 - 150)); S.paste(t2, (W - 150, 1100 - 150))
S.save("art/character/puppet2d/V/evidence/frames-sheet.png"); S.convert("RGB").save("art/character/puppet2d/V/evidence/frames-sheet.webp", quality=88)
print(S.size)
