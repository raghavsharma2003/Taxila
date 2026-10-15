"""The approved front in rig space (ungraded): the input every key edit starts from.
    python3 -I rigspace.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from PIL import Image
im = Image.open(FRONT_SRC).convert("RGB").crop((X0, Y0, X0 + SZ, Y0 + SZ)).resize((1024, 1024), Image.LANCZOS)
im.save(f"{S}/rs/front.png")
print("front.png", im.size)
