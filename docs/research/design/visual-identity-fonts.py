# Font payload + metric measurement for Taxila visual identity (visual-identity.md section 4).
# Written 2026-10-02. Needs: pip install fonttools brotli uharfbuzz. Network: fonts.googleapis.com, fonts.gstatic.com.
# Run: python3 docs/research/design/visual-identity-fonts.py [outdir]
# Downloads exactly what an Android Chrome browser is served by the Google Fonts CSS2 API (woff2, per
# unicode-range subset), then measures: bytes per subset, vertical metrics, Devanagari headline height vs Latin
# x-height, and the ink extent of shaped stress strings (matras above/below, reph, conjuncts) in em.
import io, json, re, sys, urllib.request
from fontTools.ttLib import TTFont
import uharfbuzz as hb

UA = "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36"
FAMILIES = ["Baloo 2", "Mukta", "Hind", "Noto Sans Devanagari", "Anek Devanagari", "Kalam", "Annapurna SIL",
            "Andika", "Atkinson Hyperlegible Next", "Noto Sans"]
WEIGHTS = {"Baloo 2": [400, 600, 700, 800], "Mukta": [400, 600, 700], "Hind": [400, 600],
           "Noto Sans Devanagari": [400, 600, 700], "Anek Devanagari": [400, 600], "Kalam": [400],
           "Annapurna SIL": [400], "Andika": [400], "Atkinson Hyperlegible Next": [400, 700], "Noto Sans": [400, 600]}
# Stress strings: top matras (ि ी ं ँ ॅ), bottom matras (ु ू ृ ्), reph + ikar stack (र्कि), deep conjuncts.
# Note: '?', digits and the space glyph's neighbours live in the *latin* subset, so every Hindi screen also
# downloads the latin file of the same family. Payload for a Hindi page = devanagari + latin subset bytes.
STRESS = ["कि की कु कू कृ कं कँ", "क्ष त्र ज्ञ श्र द्ध", "र्कि र्की हृ ट्ठ ङ्क्ष", "कॉ कॅ प्र क्र ह्न", "आधा है ना भिन्न"]
LATIN = "Hxagqypb 0123456789"

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60).read()

def faces(family, weights):
    q = family.replace(" ", "+") + ":wght@" + ";".join(map(str, weights))
    css = get(f"https://fonts.googleapis.com/css2?family={q}&display=swap").decode()
    out = []
    for subset, block in re.findall(r"/\* ([\w-]+) \*/\s*@font-face\s*{([^}]*)}", css):
        w = int(re.search(r"font-weight:\s*(\d+)", block).group(1))
        url = re.search(r"url\((.*?)\)", block).group(1)
        out.append((subset, w, url))
    return out

def extents(blob, text):
    face = hb.Face(blob); font = hb.Font(face); buf = hb.Buffer(); buf.add_str(text)
    buf.guess_segment_properties(); hb.shape(font, buf, {})
    ymax, ymin = -1e9, 1e9
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        e = font.get_glyph_extents(info.codepoint)
        if e is None or e.height == 0: continue
        top = pos.y_offset + e.y_bearing; bot = top + e.height  # height is negative (downwards)
        ymax = max(ymax, top); ymin = min(ymin, bot)
    notdef = sum(1 for i in buf.glyph_infos if i.codepoint == 0)
    return ymax, ymin, notdef

def measure(family):
    res = {"family": family, "subsets": {}, "metrics": None}
    files = faces(family, WEIGHTS[family])
    for subset, w, url in files:
        if subset in ("devanagari", "latin"):
            res["subsets"].setdefault(subset, {})[w] = len(get(url))
    # metrics from the 400 devanagari file (falls back to latin for Latin-only families)
    pick = [f for f in files if f[1] == 400 and f[0] == "devanagari"] or [f for f in files if f[1] == 400 and f[0] == "latin"]
    raw = get(pick[0][2]); tt = TTFont(io.BytesIO(raw)); tt.flavor = None
    b = io.BytesIO(); tt.save(b); blob = b.getvalue()
    upm = tt["head"].unitsPerEm; os2 = tt["OS/2"]; hhea = tt["hhea"]
    gs = tt.getGlyphSet(); cmap = tt.getBestCmap()
    def bbox(ch):
        from fontTools.pens.boundsPen import BoundsPen
        g = cmap.get(ord(ch));
        if g is None: return None
        p = BoundsPen(gs); gs[g].draw(p); return p.bounds
    m = {"upm": upm, "hhea_asc": hhea.ascent / upm, "hhea_desc": hhea.descent / upm, "hhea_gap": hhea.lineGap / upm,
         "win_asc": os2.usWinAscent / upm, "win_desc": os2.usWinDescent / upm,
         "default_line_height_em": (hhea.ascent - hhea.descent + hhea.lineGap) / upm,
         "has_devanagari": 0x0915 in cmap}
    kb = bbox("क")
    lat = [f for f in files if f[1] == 400 and f[0] == "latin"]
    lt = TTFont(io.BytesIO(get(lat[0][2]))) if lat else tt
    lgs = lt.getGlyphSet(); lcm = lt.getBestCmap(); lupm = lt["head"].unitsPerEm
    def lbbox(ch):
        from fontTools.pens.boundsPen import BoundsPen
        p = BoundsPen(lgs); lgs[lcm[ord(ch)]].draw(p); b = p.bounds
        return (b[0] * upm / lupm, b[1] * upm / lupm, b[2] * upm / lupm, b[3] * upm / lupm)
    xb = lbbox("x"); Hb = lbbox("H")
    m["latin_single_storey_hint"] = {"a_glyph": lcm.get(ord("a")), "g_glyph": lcm.get(ord("g"))}
    if xb: m["x_height_em"] = xb[3] / upm
    if Hb: m["cap_height_em"] = Hb[3] / upm
    if kb: m["deva_headline_em"] = kb[3] / upm
    if kb and xb: m["headline_over_xheight"] = kb[3] / xb[3]
    if kb and Hb: m["headline_over_cap"] = kb[3] / Hb[3]
    if m["has_devanagari"]:
        tops, bots, nd = [], [], 0
        for s in STRESS:
            t, bt, n = extents(blob, s); tops.append(t); bots.append(bt); nd += n
        m["stress_ink_top_em"] = max(tops) / upm; m["stress_ink_bottom_em"] = min(bots) / upm
        m["stress_ink_span_em"] = (max(tops) - min(bots)) / upm; m["stress_notdef_glyphs"] = nd
    lb = io.BytesIO(); lt.flavor = None; lt.save(lb)
    t, bt, _ = extents(lb.getvalue(), LATIN); m["latin_ink_span_em"] = (t - bt) / lupm
    dv = res["subsets"].get("devanagari", {}).get(400, 0); la = res["subsets"].get("latin", {}).get(400, 0)
    m["hindi_page_bytes_400"] = dv + la
    res["metrics"] = {k: (round(v, 3) if isinstance(v, float) else v) for k, v in m.items()}
    return res

if __name__ == "__main__":
    out = [measure(f) for f in FAMILIES]
    for r in out:
        m = r["metrics"]; s = r["subsets"]
        dv = s.get("devanagari", {}); la = s.get("latin", {})
        print(f"{r['family']:<28} deva400={dv.get(400,'-'):>7} latin400={la.get(400,'-'):>7} "
              f"lineH={m['default_line_height_em']} xh={m.get('x_height_em')} cap={m.get('cap_height_em')} "
              f"head={m.get('deva_headline_em')} head/xh={m.get('headline_over_xheight')} "
              f"ink={m.get('stress_ink_bottom_em')}..{m.get('stress_ink_top_em')} span={m.get('stress_ink_span_em')} "
              f"notdef={m.get('stress_notdef_glyphs')}")
    if len(sys.argv) > 1:
        json.dump(out, open(sys.argv[1], "w"), indent=1)
