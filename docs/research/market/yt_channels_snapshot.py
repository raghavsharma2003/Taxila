"""Snapshot of Indian K-12 YouTube teacher channels (subscribers, video count).
Method: fetch https://www.youtube.com/@<handle>/about, parse ytInitialData pageHeaderViewModel
metadata rows (the channel's own header, not featured channels). Run: python3 yt_channels_snapshot.py
Output: yt-channels-2026-10-02.json next to this file."""
import json, re, sys, urllib.request, datetime, os

HANDLES = sys.argv[1:] or [  # handles that resolved on 2026-10-02; VedantuYoungWonders, ExamPur, NextToppers, AdhyayanMantra 404ed
    "MagnetBrainsEducation", "MagnetBrainsHindimedium", "DearSir", "PhysicsWallah", "PW-Foundation",
    "PWLittleChamps", "Doubtnut", "ManochaAcademy", "Letstute", "KhanAcademyHindi",
]

def fetch(handle):
    req = urllib.request.Request(f"https://www.youtube.com/@{handle}/about",
                                 headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en-US"})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    if not m:
        return {"handle": handle, "error": "no ytInitialData"}
    data = json.loads(m.group(1))
    out = {"handle": handle}
    hdr = data.get("header", {}).get("pageHeaderRenderer", {})
    vm = hdr.get("content", {}).get("pageHeaderViewModel", {})
    out["title"] = hdr.get("pageTitle")
    rows = vm.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
    parts = [p.get("text", {}).get("content") for r in rows for p in r.get("metadataParts", [])]
    out["metadata"] = [p for p in parts if p]
    for p in out["metadata"]:
        if "subscriber" in p: out["subscribers"] = p
        if "video" in p: out["videos"] = p
    return out

res = []
for h in HANDLES:
    try:
        res.append(fetch(h))
    except Exception as e:
        res.append({"handle": h, "error": str(e)[:120]})
    print(res[-1])
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "yt-channels-2026-10-02.json")
json.dump({"fetched": datetime.date.today().isoformat(), "channels": res}, open(path, "w"), indent=1, ensure_ascii=False)
