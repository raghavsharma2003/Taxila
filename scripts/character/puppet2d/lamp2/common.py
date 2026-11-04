"""lamp2 shared paths and constants. Rig space = lamp1's: crop (162, 0)-(862, 700) of the 1024 front x 1.4629
(scripts/character/puppet2d/lamp1/rigspace.py), so slot framings (views) match lamp1 and r8 exactly. The pack itself is
stored at the source's native resolution (rig space / K), because the keys carry no more detail than the front."""
import os
REPO = "/home/user/Taxila"
S = os.environ.get("L2_SCRATCH", "/tmp/claude-0/-home-user-Taxila/4f5bd6cc-5f93-53a8-934d-4a29dc9ad564/scratchpad/l2")
FRONT_SRC = f"{REPO}/docs/design/round4/asha/images/rig-b.webp"   # the approved rig front (Stage B pick)
X0, Y0, SZ = 162, 0, 700
K = 1024 / SZ            # rig space px per native px
GRADE = (0.7262, -3.35)  # kC, dL: the half-way-to-MST-6 skin grade measured in Stage B (evidence/skin-B.json)
PACK = f"{REPO}/art/character/puppet2d/lamp2"
EVID = f"{REPO}/docs/design/round4/asha/rig2/evidence"
