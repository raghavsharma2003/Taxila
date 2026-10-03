# Calm Mastery font payload probe (calm-mastery.md section 6.2). Written 2026-10-03. Needs fonttools + network.
# Fetches the woff2 that Google Fonts CSS2 serves an Android Chrome UA; records latin/devanagari bytes, tnum, x/cap height.
# Run: python3 docs/design/directions/calm-mastery-fonts.py > calm-mastery-fonts-<date>.json
import io, json, re, urllib.request, sys
from fontTools.ttLib import TTFont
UA="Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36"
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":UA}),timeout=60).read()
FAM={"Lexend":[400,500,600,700],"Atkinson Hyperlegible Next":[400,600,700],"Fraunces":[400,600],"Literata":[400,600],"Figtree":[400,600,700],"Mukta":[400,600],"Andika":[400]}
out={}
for f,ws in FAM.items():
    css=get("https://fonts.googleapis.com/css2?family="+f.replace(" ","+")+":wght@"+";".join(map(str,ws))+"&display=swap").decode()
    res={}
    for sub,blk in re.findall(r"/\* ([\w-]+) \*/\s*@font-face\s*{([^}]*)}",css):
        if sub not in("latin","devanagari"): continue
        w=int(re.search(r"font-weight:\s*(\d+)",blk).group(1)); url=re.search(r"url\((.*?)\)",blk).group(1)
        b=get(url); res.setdefault(sub,{})[w]=len(b)
        if sub=="latin" and w==ws[0]:
            t=TTFont(io.BytesIO(b)); feats=set()
            if "GSUB" in t: feats|={r.FeatureTag for r in t["GSUB"].table.FeatureList.FeatureRecord}
            cm=t.getBestCmap(); os2=t["OS/2"]; upm=t["head"].unitsPerEm
            res["tnum"]="tnum" in feats; res["ss_alt"]=sorted(x for x in feats if x.startswith("ss") or x in("salt","cv01"))[:8]
            res["xh"]=round(os2.sxHeight/upm,3); res["cap"]=round(os2.sCapHeight/upm,3); res["same_url_all_weights"]=None
    out[f]=res
print(json.dumps(out,indent=1))
