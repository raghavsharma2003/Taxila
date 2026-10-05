"""r4: expression montage (head crops) + c-happy reference.  python3 exprmont.py <posedir> <out.png> [names]"""
import sys
from PIL import Image
d, out = sys.argv[1], sys.argv[2]
names = (sys.argv[3] if len(sys.argv) > 3 else "rest,warm,delight,surprise,concern,playful,blink40,blink50").split(",")
tiles = [Image.open("docs/design/teacher/stylised/concepts/c-happy.webp").convert("RGB")]
tiles[0] = tiles[0].crop((int(tiles[0].width * 0.2), int(tiles[0].height * 0.08), int(tiles[0].width * 0.8), int(tiles[0].height * 0.72)))
for n in names:
    tiles.append(Image.open(f"{d}/{n}.png").convert("RGB").crop((170, 90, 550, 560)))
TW, TH = 380, 470
M = Image.new("RGB", (TW * 5, TH * ((len(tiles) + 4) // 5)), "white")
for i, t in enumerate(tiles):
    M.paste(t.resize((TW, TH)), ((i % 5) * TW, (i // 5) * TH))
M.save(out)
