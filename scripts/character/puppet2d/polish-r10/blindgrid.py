"""r10: the judge-r9 blind grid from a review clip (same 9 cells and order as JUDGE-r9: t = 0.5, 11.4, 25, 30.5, 33.6, 38.3,
40.2, 36.4, 46), crop = the r3 framing (rest 165,40,885,760) mapped through the clip camera (view 60,8,904 at 1024 px).
    python3 blindgrid.py <clip.mp4> <outdir> [times]"""
import sys, os, subprocess
from PIL import Image
clip, out = sys.argv[1], sys.argv[2]
ts = [float(v) for v in (sys.argv[3].split(",") if len(sys.argv) > 3 else "0.5,11.4,25,30.5,33.6,38.3,40.2,36.4,46".split(","))]
os.makedirs(out, exist_ok=True)
k = 1024 / 904; box = tuple(round((v - o) * k) for v, o in zip((165, 40, 885, 760), (60, 8, 60, 8)))
G = Image.new("RGB", (1536, 1536), (251, 229, 189))
for i, t in enumerate(ts):
    f = f"{out}/cell{i}.png"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", clip, "-vf", f"select='eq(n\\,{round(t * 30)})'", "-vsync", "0", "-frames:v", "1", f], check=True)
    G.paste(Image.open(f).convert("RGB").crop(box).resize((512, 512), Image.LANCZOS), ((i % 3) * 512, (i // 3) * 512))
G.save(f"{out}/grid_X.jpg", quality=92)
Image.open("art/character/puppet2d/polish-r10/c-front.png").convert("RGB").resize((768, 768), Image.LANCZOS).save(f"{out}/ref.jpg", quality=92)
print(f"{out}/grid_X.jpg")
