# Canonical ARKit-52 order (Apple ARFaceAnchor.BlendShapeLocation; same order as TalkingHead README list)
ARKIT52 = """eyeBlinkLeft eyeLookDownLeft eyeLookInLeft eyeLookOutLeft eyeLookUpLeft eyeSquintLeft eyeWideLeft
eyeBlinkRight eyeLookDownRight eyeLookInRight eyeLookOutRight eyeLookUpRight eyeSquintRight eyeWideRight
jawForward jawLeft jawRight jawOpen mouthClose mouthFunnel mouthPucker mouthLeft mouthRight
mouthSmileLeft mouthSmileRight mouthFrownLeft mouthFrownRight mouthDimpleLeft mouthDimpleRight
mouthStretchLeft mouthStretchRight mouthRollLower mouthRollUpper mouthShrugLower mouthShrugUpper
mouthPressLeft mouthPressRight mouthLowerDownLeft mouthLowerDownRight mouthUpperUpLeft mouthUpperUpRight
browDownLeft browDownRight browInnerUp browOuterUpLeft browOuterUpRight cheekPuff cheekSquintLeft
cheekSquintRight noseSneerLeft noseSneerRight tongueOut""".split()
assert len(ARKIT52)==52
# ICT name -> list of ICT sources summed
def ict_sources(a):
    if a in ('browInnerUp','cheekPuff'): return [a+'_L', a+'_R']
    if a=='tongueOut': return []   # ICT Light has no tongueOut: must be authored
    if a in ('jawLeft','jawRight','mouthLeft','mouthRight'): return [a]
    if a.endswith('Left'): return [a[:-4]+'_L']
    if a.endswith('Right'): return [a[:-5]+'_R']
    return [a]
# Oculus/Meta 15 visemes as ARKit mixes (first-pass recipe; tuned per character in QA)
VISEMES = {
 'viseme_sil': {},
 'viseme_PP': {'mouthClose':0.35,'jawOpen':0.10,'mouthPressLeft':0.5,'mouthPressRight':0.5,'mouthRollLower':0.2,'mouthRollUpper':0.15},
 'viseme_FF': {'jawOpen':0.12,'mouthRollLower':0.55,'mouthUpperUpLeft':0.25,'mouthUpperUpRight':0.25,'mouthPressLeft':0.1,'mouthPressRight':0.1},
 'viseme_TH': {'jawOpen':0.18,'tongueOut':0.35,'mouthUpperUpLeft':0.1,'mouthUpperUpRight':0.1},
 'viseme_DD': {'jawOpen':0.22,'mouthStretchLeft':0.15,'mouthStretchRight':0.15,'mouthUpperUpLeft':0.1,'mouthUpperUpRight':0.1},
 'viseme_kk': {'jawOpen':0.26,'mouthStretchLeft':0.2,'mouthStretchRight':0.2},
 'viseme_CH': {'jawOpen':0.15,'mouthFunnel':0.45,'mouthPucker':0.2,'mouthUpperUpLeft':0.2,'mouthUpperUpRight':0.2},
 'viseme_SS': {'jawOpen':0.08,'mouthStretchLeft':0.35,'mouthStretchRight':0.35,'mouthSmileLeft':0.15,'mouthSmileRight':0.15},
 'viseme_nn': {'jawOpen':0.16,'mouthClose':0.0,'mouthStretchLeft':0.1,'mouthStretchRight':0.1},
 'viseme_RR': {'jawOpen':0.18,'mouthFunnel':0.3,'mouthPucker':0.25},
 'viseme_aa': {'jawOpen':0.60,'mouthLowerDownLeft':0.2,'mouthLowerDownRight':0.2},
 'viseme_E':  {'jawOpen':0.35,'mouthStretchLeft':0.35,'mouthStretchRight':0.35,'mouthUpperUpLeft':0.15,'mouthUpperUpRight':0.15},
 'viseme_I':  {'jawOpen':0.20,'mouthStretchLeft':0.45,'mouthStretchRight':0.45,'mouthSmileLeft':0.15,'mouthSmileRight':0.15},
 'viseme_O':  {'jawOpen':0.38,'mouthFunnel':0.55,'mouthPucker':0.2},
 'viseme_U':  {'jawOpen':0.15,'mouthPucker':0.75,'mouthFunnel':0.25},
}
