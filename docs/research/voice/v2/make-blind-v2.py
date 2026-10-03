# make-blind-v2.py: builds the v2 human blind test from EVERY clip in samples/ (Azure sweep, reference, open TTS).
#
#   python3 make-blind-v2.py                    # internal page: blind-test.html (all clips, all catch trials)
#   python3 make-blind-v2.py --audience external  # blind-test-external.html: drops the zero-shot clone clips
#   python3 make-blind-v2.py --audience child     # blind-test-child.html: also drops every non-Azure reference
#
# What it writes
#   blind/<CODE>.mp3   hard links to samples/*.mp3 under fresh random codes (0 extra bytes on disk), plus 5 small
#                      degraded low-anchor clips (the only new audio, ~0.3 MB) and hidden-repeat links.
#   blind-key.json     UNBLINDING FILE (code -> source file, arm, passage, LUFS, role). Never share it.
#   blind-test*.html   self-contained rating page. It holds codes, passage letters, block ids and a per-code gain
#                      only. No arm, vendor, file name or role. Share the page plus the blind/ folder, nothing else.
#
# Codes are stable: if blind-key.json exists its codes are reused, so ratings collected earlier stay scorable.
# Score exports with score-blind-v2.py.
import json, os, random, re, secrets, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(HERE, "samples")
B = os.path.join(HERE, "blind")
KEYF = os.path.join(HERE, "blind-key.json")
TARGET_LUFS = -26.0  # 268/282 clips are louder than this, so plain volume attenuation equalises them under file://
AUD = "internal"
if "--audience" in sys.argv:
    AUD = sys.argv[sys.argv.index("--audience") + 1]
assert AUD in ("internal", "external", "child")

PASSAGES = {
    "a-greet": ("a", "Hinglish greeting with a memory callback"),
    "b-fractions": ("b", "Hinglish: equivalent fractions with a pizza, then a question"),
    "c-hindi": ("c", "Pure Hindi for a class-3 child"),
    "d-english": ("d", "Indian English with teacher warmth"),
    "e-praise-correct": ("e", "Praise moment, then a gentle correction"),
}
CLONES = {"oss-chatterbox-hi.mp3", "oss-chatterbox-v3.mp3", "oss-indicf5.mp3", "oss-indicf5-devanagari.mp3"}

key_az = json.load(open(os.path.join(S, "KEY.json")))
key_ref = json.load(open(os.path.join(S, "KEY-ref.json")))["clips"]


def lufs(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", out)
    p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)
    return float(i[-1]), float(p[-1]) if p else None


# ---- 1. inventory every clip ----
src = []
for f in sorted(os.listdir(S)):
    if not f.endswith(".mp3"):
        continue
    stem = f[:-4]
    if stem in key_az:
        k = key_az[stem]
        src.append(dict(file=f, set="azure", arm=k["arm"], voice=k["voice"], passage=k["passage"], role="arm"))
    elif f.startswith("ref-") and stem[4:] in key_ref:
        k = key_ref[stem[4:]]
        role = "negative-control" if k.get("is_negative_control") else "reference"
        src.append(dict(file=f, set="reference-not-for-production", arm=f"ref:{k['engine']}:{k.get('voice')}:{k['arm']}",
                        voice=k.get("voice"), passage=k["passage"], role=role))
    elif f.startswith("oss-"):
        src.append(dict(file=f, set="open-tts", arm=f"oss:{stem[4:]}", voice=stem[4:], passage="b-fractions",
                        role="clone-internal-only" if f in CLONES else "arm"))
    else:
        raise SystemExit(f"unmapped clip {f}")

# optional human anchors: --human DIR with files named <passage-id>-<anything>.mp3 (e.g. b-fractions-t1.mp3), a real
# consented Indian teacher reading the same five passages. Never commit third-party corpora (IndicTTS) here.
if "--human" in sys.argv:
    HD = sys.argv[sys.argv.index("--human") + 1]
    for f in sorted(os.listdir(HD)):
        pid = next((p for p in PASSAGES if f.startswith(p)), None)
        if f.endswith(".mp3") and pid:
            src.append(dict(file="human/" + f, src_path=os.path.join(HD, f), set="human", arm="human:" + f[len(pid) + 1:-4],
                            voice=None, passage=pid, role="human-anchor"))

old = json.load(open(KEYF)) if os.path.exists(KEYF) else {"clips": {}}
by_file = {v["file"]: (c, v) for c, v in old["clips"].items() if v.get("file")}
ALPH = "ACDEFHJKLMNPRTUVWXY3479"
used = set(old["clips"])


def new_code():
    while True:
        c = "".join(secrets.choice(ALPH) for _ in range(5))
        if c not in used:
            used.add(c)
            return c


os.makedirs(B, exist_ok=True)
clips = {}
for s in src:
    if s["file"] in by_file:
        code, prev = by_file[s["file"]]
        s["lufs"], s["peak"] = prev.get("lufs"), prev.get("peak")
    else:
        code = new_code()
    if s.get("lufs") is None:
        s["lufs"], s["peak"] = lufs(s.get("src_path") or os.path.join(S, s["file"]))
    clips[code] = s

# ---- 2. catch trials ----
# degraded low anchors: one per passage, from a fixed Azure source, telephone band + 5-bit crush (MUSHRA-style anchor)
rng = random.Random(20261003)
deg = {c: v for c, v in old["clips"].items() if v.get("role") == "degraded"}
if not deg:
    for p in PASSAGES:
        cands = sorted(c for c, v in clips.items() if v["set"] == "azure" and v["passage"] == p)
        srcc = rng.choice(cands)
        code = new_code()
        out = os.path.join(B, code + ".mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(S, clips[srcc]["file"]), "-af",
                        "highpass=f=450,lowpass=f=2600,aresample=8000,acrusher=bits=5:mix=0.6,aresample=24000",
                        "-ac", "1", "-b:a", "24k", out], check=True)
        L, P = lufs(out)
        deg[code] = dict(file=None, blind_file=code + ".mp3", set="catch", arm="catch:degraded", role="degraded",
                         source_code=srcc, passage=p, lufs=L, peak=P)
clips.update(deg)
rep = {c: v for c, v in old["clips"].items() if v.get("role") == "repeat"}

# ---- 3. blocks: a fixed shuffle split into 10 blocks, plus the shortlist block S ----
real = [c for c, v in clips.items() if v["role"] not in ("degraded", "repeat")]
real.sort()
rng2 = random.Random(7741)
rng2.shuffle(real)
NB = 10
blocks = {f"B{i+1}": real[i::NB] for i in range(NB)}
SHORT = ["mai-hd:Priya", "mai-flash:Priya", "mai-flash:Kavya", "mai-flash:Dhruv", "dhd-lang:Diya", "dhd-plain:Diya",
         "dhd-lang:Arjun", "diya-dragon", "4omtts:marin"]
short = [c for c in real if clips[c]["arm"] in SHORT or clips[c]["role"] == "human-anchor"
         or clips[c]["arm"] == "ref:gemini-3.8-flash-tts:Kore:director-note"
         or clips[c]["arm"] in ("oss:veena-kavya", "oss:svara")]
blocks["S"] = short
base_deg = sorted(c for c, v in deg.items() if not v.get("link_to"))
deg_by_block = {v["block"]: c for c, v in deg.items() if v.get("block")}
for i, (b, cs) in enumerate(sorted(blocks.items())):
    # one degraded low anchor per block; blocks after the 5th get a fresh code hard-linked to a base anchor
    if b not in deg_by_block:
        base = base_deg[i % len(base_deg)]
        if i < len(base_deg) and not deg[base].get("block"):
            deg[base]["block"] = b
            deg_by_block[b] = base
        else:
            code = new_code()
            deg[code] = dict(deg[base], link_to=deg[base]["blind_file"], block=b, source_code=deg[base]["source_code"])
            deg_by_block[b] = code
    clips.update(deg)
    cs.append(deg_by_block[b])
    # one hidden repeat per block: a second code for a clip already in the block (hard link, 0 bytes)
    existing = [c for c, v in rep.items() if v["block"] == b]
    if existing:
        cs.append(existing[0])
    else:
        target = rng.choice([c for c in cs if clips[c]["role"] != "degraded"])
        code = new_code()
        rep[code] = dict(file=clips[target]["file"], set="catch", arm="catch:repeat", role="repeat", source_code=target,
                         passage=clips[target]["passage"], lufs=clips[target]["lufs"], peak=clips[target]["peak"], block=b)
        cs.append(code)
clips.update(rep)

# ---- 4. hard links ----
for code, v in clips.items():
    dst = os.path.join(B, code + ".mp3")
    v["blind_file"] = code + ".mp3"
    if v["role"] == "degraded" and not v.get("link_to"):
        continue
    srcp = os.path.join(B, v["link_to"]) if v.get("link_to") else (v["src_path"] if v.get("src_path") else os.path.join(S, v["file"]))
    if os.path.exists(dst) and os.path.samefile(dst, srcp):
        continue
    if os.path.exists(dst):
        os.remove(dst)
    if v["role"] == "human-anchor":
        import shutil
        shutil.copyfile(srcp, dst)  # own consented recording; copied (may live on another filesystem)
    else:
        os.link(srcp, dst)
keep = {v["blind_file"] for v in clips.values()}
for f in os.listdir(B):
    if f not in keep:
        os.remove(os.path.join(B, f))

json.dump({"schema": "taxila-blind-key/v2", "sealed_note": "UNBLINDING FILE. Never give to listeners. Reference clips are "
           "reference-not-for-production (never a fine-tune, clone or prompt-audio target). Clone clips are internal only.",
           "target_lufs": TARGET_LUFS, "blocks": blocks, "clips": clips},
          open(KEYF, "w"), ensure_ascii=False, indent=1)


# ---- 5. page ----
def allowed(c):
    r = clips[c]["role"]
    if AUD == "internal":
        return True
    if r == "clone-internal-only" or (r == "repeat" and clips[clips[c]["source_code"]]["role"] == "clone-internal-only"):
        return False
    if AUD == "child":
        st = clips[c]["set"] if r != "repeat" else clips[clips[c]["source_code"]]["set"]
        return st not in ("reference-not-for-production", "open-tts")
    return True


man = []
for b, cs in sorted(blocks.items()):
    for c in cs:
        if not allowed(c):
            continue
        v = clips[c]
        g = round(TARGET_LUFS - v["lufs"], 1)
        if v.get("peak") is not None:
            g = min(g, round(-1.0 - v["peak"], 1))  # never push a peak above -1 dBFS
        man.append({"c": c, "p": PASSAGES[v["passage"]][0], "b": b, "g": g})
blocks_meta = {}
for m in man:
    blocks_meta[m["b"]] = blocks_meta.get(m["b"], 0) + 1
page = open(os.path.join(HERE, "blind-test.template.html")).read()
page = page.replace("/*MANIFEST*/null", json.dumps({"v": "taxila-blind-v2", "audience": AUD, "target_lufs": TARGET_LUFS,
                                                     "passages": {v[0]: v[1] for v in PASSAGES.values()},
                                                     "blocks": blocks_meta, "clips": man}, ensure_ascii=False))
name = {"internal": "blind-test.html", "external": "blind-test-external.html", "child": "blind-test-child.html"}[AUD]
open(os.path.join(HERE, name), "w").write(page)
n_new = sum(os.path.getsize(os.path.join(B, v["blind_file"])) for v in clips.values()
            if (v["role"] == "degraded" and not v.get("link_to")) or v["role"] == "human-anchor")
print(f"{name}: {len(man)} entries in {len(blocks_meta)} blocks; key {len(clips)} codes; new audio {n_new/1e6:.2f} MB")
