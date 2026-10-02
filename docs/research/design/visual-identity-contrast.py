# Taxila visual identity palette check (visual-identity.md section 3). Written 2026-10-02.
# Deterministic, stdlib only. Run: python3 docs/research/design/visual-identity-contrast.py
# 1) WCAG 2 contrast for every text / non-text pair the identity uses, both themes.
# 2) Colour-vision-deficiency separation of the diagram categorical set: Machado, Oliveira & Fernandes (2009)
#    severity-1.0 simulation matrices applied in linear sRGB, then CIEDE2000 between every pair.
#    The matrices are reproduced from the paper's supplementary table as widely re-published [M: re-check digits].
import itertools, math

def hex2rgb(h): h = h.lstrip('#'); return [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
def lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def unlin(c): c = min(max(c, 0), 1); return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
def lum(h): r, g, b = map(lin, hex2rgb(h)); return 0.2126 * r + 0.7152 * g + 0.0722 * b
def cr(a, b): la, lb = lum(a), lum(b); return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

MACHADO = {
    'protan': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    'deutan': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    'tritan': [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
}
def simulate(h, kind):
    if kind == 'normal': return hex2rgb(h)
    r, g, b = map(lin, hex2rgb(h)); M = MACHADO[kind]
    return [unlin(M[i][0] * r + M[i][1] * g + M[i][2] * b) for i in range(3)]
def lab(rgb):
    r, g, b = map(lin, rgb)
    X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047; Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    return 116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))
def de2000(l1, l2):
    L1, a1, b1 = l1; L2, a2, b2 = l2
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2); Cb = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2; C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360; h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dLp, dCp = L2 - L1, C2p - C1p
    dhp = 0 if C1p * C2p == 0 else (h2p - h1p if abs(h2p - h1p) <= 180 else (h2p - h1p - 360 if h2p > h1p else h2p - h1p + 360))
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2))
    Lbp, Cbp = (L1 + L2) / 2, (C1p + C2p) / 2
    hbp = h1p + h2p if C1p * C2p == 0 else ((h1p + h2p) / 2 if abs(h1p - h2p) <= 180 else ((h1p + h2p + 360) / 2 if h1p + h2p < 360 else (h1p + h2p - 360) / 2))
    T = 1 - 0.17 * math.cos(math.radians(hbp - 30)) + 0.24 * math.cos(math.radians(2 * hbp)) + 0.32 * math.cos(math.radians(3 * hbp + 6)) - 0.20 * math.cos(math.radians(4 * hbp - 63))
    Sl = 1 + 0.015 * (Lbp - 50) ** 2 / math.sqrt(20 + (Lbp - 50) ** 2); Sc = 1 + 0.045 * Cbp; Sh = 1 + 0.015 * Cbp * T
    Rt = -2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)) * math.sin(math.radians(60 * math.exp(-((hbp - 275) / 25) ** 2)))
    return math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))
def hue(h):
    r, g, b = hex2rgb(h); mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn: return 0
    if mx == r: return (60 * (g - b) / (mx - mn)) % 360
    if mx == g: return 60 * (b - r) / (mx - mn) + 120
    return 60 * (r - g) / (mx - mn) + 240

L = {  # light theme. First block inherited unchanged from kids-ux-ages.md 4.3.
    'bg': '#FFF8EE', 'surface': '#FFFFFF', 'ink': '#1F1A14', 'ink2': '#5A5148', 'turn': '#FFB21E', 'turnRing': '#9A5B00',
    'done': '#1F7A4D', 'listen': '#2563C9', 'think': '#5B6470', 'stop': '#B3261E', 'tileBorder': '#8C8478',
    # identity additions
    'jamun': '#5B2E91', 'jamunSoft': '#EFE6FA', 'board': '#1F3B30', 'chalk': '#F5F2E8', 'chalk2': '#BFD3C6',
    'chalkMark': '#F2CF6B', 'dusk': '#E9E1D2',
    # diagram categorical (marks and outlines; fills use the -soft tints with the mark colour as outline)
    # Core four (colour may carry meaning, still always paired with a label/shape): chosen by a constrained search
    # (contrast >= 3:1 on 'dusk', white text >= 4.5:1, saturation <= 0.8) then hand-tuned; see section 3.4.
    'd1_neel': '#2A72C6', 'd2_matka': '#C2410C', 'd3_neem': '#0B5E50', 'd4_baingan': '#3F2272',
    # Extended (never the only cue: always with label, pattern or shape)
    'd5_haldi': '#946B0E', 'd6_kajal': '#3A3631', 'boardFrame': '#8C6B4A',
}
D = {  # dark theme chrome. Modules and illustrations stay on the 'dusk' paper canvas (section 3.5).
    'bg': '#16140F', 'surface': '#221F19', 'surface2': '#2C2821', 'ink': '#F6F1E8', 'ink2': '#BDB4A6', 'turn': '#FFB21E',
    'done': '#4CC38A', 'listen': '#7FB0FF', 'think': '#9AA3AF', 'stop': '#FF8A80', 'jamun': '#C3A6F5', 'board': '#22423A',
    'chalk': '#F5F2E8', 'chalk2': '#BFD3C6', 'boardFrame': '#A07E5A',
}
TEXT = [  # (fg, bg) pairs that carry text: need >= 4.5
    ('ink', 'bg'), ('ink2', 'bg'), ('ink2', 'surface'), ('jamun', 'bg'), ('jamun', 'surface'), ('ink', 'jamunSoft'),
    ('jamun', 'jamunSoft'), ('surface', 'jamun'), ('chalk', 'board'), ('chalk2', 'board'), ('chalkMark', 'board'),
    ('ink', 'turn'), ('ink', 'dusk'), ('ink2', 'dusk'), ('surface', 'done'), ('surface', 'd1_neel'), ('surface', 'd2_matka'),
    ('surface', 'd3_neem'), ('surface', 'd4_baingan'), ('surface', 'd6_kajal')]
NONTEXT = [  # marks, outlines, rings: need >= 3.0
    ('turnRing', 'bg'), ('tileBorder', 'bg'), ('board', 'bg'), ('jamun', 'bg'), ('boardFrame', 'bg')] + \
    [(k, c) for k in L if k.startswith('d') and '_' in k for c in ('bg', 'surface', 'dusk')]
DTEXT = [('ink', 'bg'), ('ink2', 'bg'), ('ink', 'surface2'), ('ink2', 'surface2'), ('jamun', 'bg'), ('jamun', 'surface'),
         ('chalk', 'board'), ('chalk2', 'board'), ('bg', 'turn'), ('done', 'bg'), ('listen', 'bg'), ('stop', 'bg')]
DNONTEXT = [('boardFrame', 'bg'), ('think', 'bg')]  # the dark board itself is 1.67:1 on bg, so its edge is the wooden frame

def report():
    bad = 0
    print('LIGHT text (>= 4.5)')
    for a, b in TEXT:
        v = cr(L[a], L[b]); bad += v < 4.5; print(f'  {a:>10} on {b:<10} {L[a]} / {L[b]}  {v:5.2f} {"FAIL" if v < 4.5 else ""}')
    print('LIGHT non-text (>= 3.0)')
    for a, b in NONTEXT:
        v = cr(L[a], L[b]); bad += v < 3.0; print(f'  {a:>10} on {b:<10} {L[a]} / {L[b]}  {v:5.2f} {"FAIL" if v < 3.0 else ""}')
    print('DARK text (>= 4.5)')
    for a, b in DTEXT:
        v = cr(D[a], D[b]); bad += v < 4.5; print(f'  {a:>10} on {b:<10} {D[a]} / {D[b]}  {v:5.2f} {"FAIL" if v < 4.5 else ""}')
    print('DARK non-text (>= 3.0)')
    for a, b in DNONTEXT:
        v = cr(D[a], D[b]); bad += v < 3.0; print(f'  {a:>10} on {b:<10} {D[a]} / {D[b]}  {v:5.2f} {"FAIL" if v < 3.0 else ""}')
    cats = ['d1_neel', 'd2_matka', 'd3_neem', 'd4_baingan']
    print('DIAGRAM core four: min CIEDE2000 over all pairs, per vision type (normal, protan, deutan, tritan)')
    for kind in ('normal', 'protan', 'deutan', 'tritan'):
        labs = {k: lab(simulate(L[k], kind)) for k in cats}
        pairs = sorted(((de2000(labs[a], labs[b]), a, b) for a, b in itertools.combinations(cats, 2)))
        print(f'  {kind:<7} min {pairs[0][0]:5.1f} ({pairs[0][1]} vs {pairs[0][2]}); next {pairs[1][0]:5.1f} ({pairs[1][1]} vs {pairs[1][2]})')
    print('INTEGER tokens (NCERT green/red) under deutan/protan, CIEDE2000:')
    for name, pos, neg in (('naive green/red', '#2E9E44', '#D62828'), ('Taxila neem/matka', L['d3_neem'], L['d2_matka'])):
        row = []
        for kind in ('normal', 'protan', 'deutan'):
            row.append(f'{kind} {de2000(lab(simulate(pos, kind)), lab(simulate(neg, kind))):5.1f}')
        print(f'  {name:<18} {pos} vs {neg}: ' + ' | '.join(row) + f' | lum contrast {cr(pos, neg):.2f}')
    print('HUE distance of brand oranges/yellows from flag saffron #FF9933 (30.0 deg):')
    for k in ('turn', 'd2_matka', 'chalkMark', 'd5_haldi'):
        print(f'  {k:<10} {L[k]} hue {hue(L[k]):5.1f}  delta {abs(hue(L[k]) - 30.0):4.1f}')
    ext = cats + ['d5_haldi']
    print('DIAGRAM core four + haldi (why haldi is extended-only):')
    for kind in ('normal', 'protan', 'deutan', 'tritan'):
        labs = {k: lab(simulate(L[k], kind)) for k in ext}
        p = min((de2000(labs[a], labs[b]), a, b) for a, b in itertools.combinations(ext, 2))
        print(f'  {kind:<7} min {p[0]:5.1f} ({p[1]} vs {p[2]})')
    print(f'TOTAL FAILS: {bad}')

if __name__ == '__main__':
    report()
