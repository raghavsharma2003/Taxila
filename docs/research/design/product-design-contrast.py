# PRODUCT-DESIGN.md token check (written 2026-10-02). Deterministic, stdlib only.
# Reuses the WCAG + Machado/CIEDE2000 helpers in visual-identity-contrast.py (same [M] caveat on the matrices).
# Run from this folder: python3 product-design-contrast.py
# Checks only the pairs that PRODUCT-DESIGN.md adds or changes; the sibling scripts keep their own gates.
import importlib.util, io, contextlib, os
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('vc', os.path.join(here, 'visual-identity-contrast.py'))
vc = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()):
    spec.loader.exec_module(vc)
cr, sim, lab, de = vc.cr, vc.simulate, vc.lab, vc.de2000

def dE(a, b):
    return [de(lab(sim(a, k)), lab(sim(b, k))) for k in ('normal', 'protan', 'deutan', 'tritan')]

bad = 0
def check(name, fg, bg, floor):
    global bad
    v = cr(fg, bg); ok = v >= floor; bad += (not ok)
    print(f'  {name:<46} {fg} on {bg}  {v:5.2f}  (>= {floor}) {"" if ok else "FAIL"}')

print('TURN RING: kids-ux ring #9A5B00 has only 3.01:1 against its own marigold fill; candidates')
for ring in ('#9A5B00', '#8A4F00', '#7A4800'):
    check(f'ring {ring} vs marigold fill', ring, '#FFB21E', 3.0)
    check(f'ring {ring} vs cream bg', ring, '#FFF8EE', 3.0)
    check(f'ring {ring} vs surface', ring, '#FFFFFF', 3.0)

print('TWO-TONE FOCUS RING (inner ink #1F1A14 2px + outer white 2px): best of the two tones on each ground')
for gname, g in (('cream bg', '#FFF8EE'), ('surface', '#FFFFFF'), ('board', '#1F3B30'), ('jamun', '#5B2E91'),
                 ('marigold fill', '#FFB21E'), ('dusk canvas', '#E9E1D2'), ('dark bg', '#16140F'), ('sky panel', '#0F1A33'),
                 ('mid grey worst case', '#777777')):
    best = max(cr('#1F1A14', g), cr('#FFFFFF', g)); ok = best >= 3.0; bad += (not ok)
    print(f'  {gname:<22} {g}  best tone {best:5.2f} {"" if ok else "FAIL"}')

print('CAPTION LIT-WORD BAR (same weight; a 2dp bar under the word, no weight change)')
check('jamun bar on cream', '#5B2E91', '#FFF8EE', 3.0)
check('jamun-dark bar on dark bg', '#C3A6F5', '#16140F', 3.0)

print('CHALK UNDERLINE replaces chalk-mark #F2CF6B (newest ledge chip)')
check('chalk white underline on board', '#F5F2E8', '#1F3B30', 3.0)
check('chalk white underline on dark board', '#F5F2E8', '#22423A', 3.0)

print('NETWORK CHIP and RECORDED badge (light surface-2 is new here)')
check('ink-2 glyph on light surface-2 #F1E8D9', '#5A5148', '#F1E8D9', 4.5)
check('chip edge tile-border on cream', '#8C8478', '#FFF8EE', 3.0)
check('ink-2 on dark surface-2', '#BDB4A6', '#2C2821', 4.5)

print('OLDER FLAT STRIP (B4 default instead of the chalkboard)')
check('ink on surface', '#1F1A14', '#FFFFFF', 4.5)
check('strip border tile-border on surface', '#8C8478', '#FFFFFF', 3.0)

print('STATUS GLYPHS beside the mic (glyph shape carries state; colour is second)')
for n, c in (('listen ear', '#2563C9'), ('think dots', '#5B6470'), ('done tick', '#1F7A4D'), ('stop hexagon', '#B3261E')):
    check(f'{n} on cream', c, '#FFF8EE', 3.0)

print('STATUS PAIRS CIEDE2000 normal/protan/deutan/tritan (<15 under any CVD => glyph carrier is mandatory)')
for n, a, b in (('done vs stop', '#1F7A4D', '#B3261E'), ('listen vs think', '#2563C9', '#5B6470'),
                ('turn vs done', '#FFB21E', '#1F7A4D'), ('listen vs jamun brand', '#2563C9', '#5B2E91'),
                ('turn vs parent yourturn fill #FFD27A', '#FFB21E', '#FFD27A'),
                ('turn vs removed chalk-mark #F2CF6B', '#FFB21E', '#F2CF6B')):
    v = dE(a, b)
    print(f'  {n:<38}', ' / '.join(f'{x:5.1f}' for x in v), ' glyph mandatory' if min(v) < 15 else '')

print(f'TOTAL FAILS: {bad}')
