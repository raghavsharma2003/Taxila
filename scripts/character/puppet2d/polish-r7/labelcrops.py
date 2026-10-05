"""crop + anonymise the label-test renders: work/label/<pose>.png -> <dir>/<id>.jpg + key.json (id -> class)."""
import json, os, random, sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
names = sorted(f[:-4] for f in os.listdir(src) if f.endswith(".png"))
random.seed(5); ids = random.sample(range(100, 999), len(names))
key = {}
for n, i in zip(names, ids):
    Image.open(f"{src}/{n}.png").convert("RGB").crop((400, 500, 660, 720)).resize((520, 440), Image.LANCZOS).save(f"{dst}/m{i}.jpg", quality=92)
    key[f"m{i}"] = n.rsplit("_", 1)[0]
json.dump(key, open(f"{dst}/key.json", "w"), indent=0)
print(len(key))
