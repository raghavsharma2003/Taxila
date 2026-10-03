# make-blind-v2.py: builds the v2 human blind test from EVERY clip in samples/ (Azure sweep, reference, open TTS).
#
#   python3 make-blind-v2.py                    # internal page: blind-test.html (all clips, all catch trials)
#   python3 make-blind-v2.py --audience external  # blind-test-external.html: drops the zero-shot clone clips
#   python3 make-blind-v2.py --audience child     # blind-test-child.html: also drops every non-Azure reference
#
# What it writes
#   blind/<CODE>.mp3   hard links to samples/*.mp3 under fresh random codes (0 extra bytes on disk), shortlist-block
#                      aliases, hidden-repeat links, and 5 small degraded low-anchor renders (the only new audio, ~0.3 MB).
#   blind-key.json     UNBLINDING FILE (code -> source file, arm, passage, LUFS, role). Never share it.
#   blind-test*.html   self-contained rating page. It holds codes, passage letters, block ids and a per-code gain
#                      only. No arm, vendor, file name or role. Share the page plus the blind/ folder, nothing else.
#
# Codes are stable: if blind-key.json exists its codes are reused, so ratings collected earlier stay scorable.
# Score exports with score-blind-v2.py.
import json, os, random, re, secrets, shutil, subprocess, sys

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
slot2code = {v["slot"]: c for c, v in old["clips"].items() if v.get("slot")}
ALPH = "ACDEFHJKLMNPRTUVWXY3479"
used = set(old["clips"])


def code_for(slot):
    if slot in slot2code:
        return slot2code[slot]
    while True:
        c = "".join(secrets.choice(ALPH) for _ in range(5))
        if c not in used:
            used.add(c)
            slot2code[slot] = c
            return c


oldby = {v["slot"]: v for v in old["clips"].values() if v.get("slot")}
os.makedirs(B, exist_ok=True)
clips = {}
for s in src:
    s["slot"] = "clip:" + s["file"]
    prev = oldby.get(s["slot"], {})
    s["lufs"], s["peak"] = prev.get("lufs"), prev.get("peak")
    if s["lufs"] is None:
        s["lufs"], s["peak"] = lufs(s.get("src_path") or os.path.join(S, s["file"]))
    clips[code_for(s["slot"])] = s

# ---- 2. blocks: a fixed shuffle split into 10 blocks, plus the shortlist block S (own alias codes) ----
real = sorted(clips)
real.sort(key=lambda c: clips[c]["slot"])
random.Random(7741).shuffle(real)
NB = 10
blocks = {f"B{i+1}": real[i::NB] for i in range(NB)}
SHORT = {"mai-hd:Priya", "mai-flash:Priya", "mai-flash:Kavya", "mai-flash:Dhruv", "dhd-lang:Diya", "dhd-plain:Diya",
         "dhd-lang:Arjun", "dhd-lang:Meera", "diya-dragon", "4omtts:marin", "ref:gemini-3.8-flash-tts:Kore:director-note",
         "oss:veena-kavya", "oss:svara"}
blocks["S"] = []
for c in sorted(real, key=lambda c: clips[c]["slot"]):
    v = clips[c]
    if v["arm"] in SHORT or v["role"] == "human-anchor":
        a = code_for("alias:S:" + v["file"])
        clips[a] = dict(v, slot="alias:S:" + v["file"], alias_of=c)
        blocks["S"].append(a)

# ---- 3. catch trials, one of each per block ----
# degraded low anchor: telephone band + 5-bit crush (MUSHRA-style), rendered once per passage, linked per block.
# hidden repeat: a second code for a clip already in the block (hard link, 0 bytes).
rng = random.Random(20261003)
pass_list = list(PASSAGES)
deg_base = {}
for i, b in enumerate(sorted(blocks)):
    p = pass_list[i % len(pass_list)]
    cands = sorted((c for c in blocks[b] if clips[c]["set"] == "azure" and clips[c]["passage"] == p),
                   key=lambda c: clips[c]["slot"]) or sorted((c for c, v in clips.items() if v["set"] == "azure"
                                                               and v["passage"] == p and not v.get("alias_of")),
                                                              key=lambda c: clips[c]["slot"])
    srcc = rng.choice(cands)
    dslot = "deg:" + b
    dcode = code_for(dslot)
    if p not in deg_base:
        out = os.path.join(B, dcode + ".mp3")
        if not os.path.exists(out):
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(S, clips[srcc]["file"]), "-af",
                            "highpass=f=450,lowpass=f=2600,aresample=8000,acrusher=bits=5:mix=0.6,aresample=24000",
                            "-ac", "1", "-b:a", "24k", out], check=True)
        L, P = (oldby.get(dslot) or {}).get("lufs"), (oldby.get(dslot) or {}).get("peak")
        if L is None:
            L, P = lufs(out)
        deg_base[p] = dict(code=dcode, source=srcc, lufs=L, peak=P)
        clips[dcode] = dict(slot=dslot, file=None, set="catch", arm="catch:degraded", role="degraded", rendered=True,
                            source_code=srcc, passage=p, lufs=L, peak=P, block=b)
    else:
        d = deg_base[p]
        clips[dcode] = dict(slot=dslot, file=None, set="catch", arm="catch:degraded", role="degraded",
                            link_to=d["code"] + ".mp3", source_code=d["source"], passage=p, lufs=d["lufs"],
                            peak=d["peak"], block=b)
    target = rng.choice(sorted(blocks[b], key=lambda c: clips[c]["slot"]))
    rslot = "rep:" + b
    rcode = code_for(rslot)
    t = clips[target]
    clips[rcode] = dict(slot=rslot, file=t["file"], src_path=t.get("src_path"), set="catch", arm="catch:repeat",
                        role="repeat", source_code=target, source_set=t["set"], source_role=t["role"],
                        passage=t["passage"], lufs=t["lufs"], peak=t["peak"], block=b)
    blocks[b] += [dcode, rcode]

# ---- 4. files in blind/ ----
for code, v in clips.items():
    dst = os.path.join(B, code + ".mp3")
    v["blind_file"] = code + ".mp3"
    if v.get("rendered"):
        continue
    srcp = os.path.join(B, v["link_to"]) if v.get("link_to") else (v.get("src_path") or os.path.join(S, v["file"]))
    if os.path.exists(dst) and os.path.samefile(dst, srcp):
        continue
    if os.path.exists(dst):
        os.remove(dst)
    if v["role"] == "human-anchor" or (v["role"] == "repeat" and v.get("src_path")):
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
    v = clips[c]
    st, role = v.get("source_set", v["set"]), v.get("source_role", v["role"])
    if AUD == "internal":
        return True
    if role == "clone-internal-only":
        return False
    if AUD == "child":
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
if AUD != "internal":
    # ship list: ONLY the files this page plays (blind/ also holds internal-only clips)
    open(os.path.join(HERE, f"blind-{AUD}-files.txt"), "w").write(
        "\n".join([name] + sorted({"blind/" + clips[m["c"]]["blind_file"] for m in man})) + "\n")
n_new = sum(os.path.getsize(os.path.join(B, v["blind_file"])) for v in clips.values()
            if v.get("rendered") or v["role"] == "human-anchor")
print(f"{name}: {len(man)} entries in {len(blocks_meta)} blocks; key {len(clips)} codes; new audio {n_new/1e6:.2f} MB")
