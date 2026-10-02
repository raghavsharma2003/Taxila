#!/usr/bin/env python3
"""WCAG 2 contrast for the progress-surface tokens in motivation-without-rewards.md.

Deterministic: re-run with `python3 docs/research/design/motivation-contrast.py`.
Non-text UI parts (state shapes, outlines, edges) need >= 3:1 against their
background (WCAG 2.2 SC 1.4.11); text needs >= 4.5:1 (SC 1.4.3).
Backgrounds `bg` and `bg-dark` come from kids-ux-ages.md section 4.3.
"""

def lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

def lum(hexs):
    h = hexs.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

BG = '#FFF8EE'        # kids-ux bg (light)
BG_DARK = '#16140F'   # kids-ux bg (dark)
SKY = '#0F1A33'       # sky-map panel, same in both themes

garden = {  # silhouettes and outlines on the garden page (light default for B1-B2)
    'plot-outline (abhi nahi)': ('#8C8478', None),
    'leaf (sprout, seekh rahi)': ('#2F7A3E', '#5FBF73'),
    'bud/flower (aa gaya)': ('#A8326E', '#F08BBE'),
    'fruit (pakka)': ('#5B2E91', '#C3A6F5'),   # = visual-identity jamun; never marigold, never brick
    'pakka ring': ('#1F7A4D', '#4CC38A'),       # reuses kids-ux `done`
    'visit-bird (due for review)': ('#2563C9', '#7FB0FF'),  # reuses kids-ux `listen`
}

sky = {  # star states on the sky-map panel (B3-B4)
    'star abhi nahi (outline)': '#7383A6',
    'star seekh rahi': '#8FA6D6',
    'star aa gaya': '#C9D8FF',
    'star pakka (+halo)': '#FFFFFF',
    'prerequisite edge': '#6276A3',
    'label text': '#F6F1E8',
    'due ring (review ready)': '#7FB0FF',
}

def verdict(r, need):
    return 'ok' if r >= need else 'FAILS'

print('Garden tokens (non-text, need 3.0)')
for name, (light, dark) in garden.items():
    r1 = ratio(light, BG)
    line = f'  {name:30s} {light} on bg {r1:5.2f} {verdict(r1, 3.0)}'
    if dark:
        r2 = ratio(dark, BG_DARK)
        line += f' | {dark} on dark bg {r2:5.2f} {verdict(r2, 3.0)}'
    print(line)

print('\nSky tokens on panel ' + SKY)
for name, c in sky.items():
    need = 4.5 if 'text' in name else 3.0
    r = ratio(c, SKY)
    print(f'  {name:30s} {c} {r:5.2f} {verdict(r, need)} (need {need})')

print('\nAdjacent sky states against each other (colour is secondary; size, fill and halo also encode state)')
keys = ['star abhi nahi (outline)', 'star seekh rahi', 'star aa gaya', 'star pakka (+halo)']
for a, b in zip(keys, keys[1:]):
    print(f'  {a} vs {b}: {ratio(sky[a], sky[b]):4.2f}')
