#!/usr/bin/env python3
"""Builds docs/research/content/language-sst-engine-map.json from data/curriculum/*.json.

Every English (C1-9), Hindi (C6-9) and SST (C6-9) topic gets a primary engine and up to 4 secondary
engines. EVS/science topics that the science map left as generic `map | sequence | story | scenario |
sorter` are recorded as absorbed (these engines implement those generic formats). Rules + explicit
overrides; nothing is guessed silently: every override is listed in the output.
"""
import json, glob, os, collections

ROOT = "/home/user/Taxila"
CUR = f"{ROOT}/data/curriculum"
OUT = f"{ROOT}/docs/research/content/language-sst-engine-map.json"

ENGINES = {
    "phonics@1": "L1", "word-builder@1": "L2", "sentence-scramble@1": "L3", "story-sequence@1": "L4",
    "picture-word@1": "L5", "read-along@1": "L6", "grammar-transform@1": "L7", "map-explorer@1": "S1",
    "timeline@1": "S2", "compare-venn@1": "S3", "role-play@1": "X1", "rhythm-poem@1": "X2",
    "source-card@1": "S4",
}
EXTERNAL = {"maths:coord-grid@1", "maths:data-graphs@1", "maths:money@1", "science:sky@1", "science:water-cycle@1"}

def eng_rule(cls, typ):
    """Default primary + secondaries for an English chapter by type and class."""
    young = cls <= 3
    if typ == "poem":
        sec = ["read-along@1"] + (["picture-word@1", "word-builder@1"] if young else ["word-builder@1"])
        return "rhythm-poem@1", sec
    if typ == "story":
        if young:
            return "story-sequence@1", ["read-along@1", "picture-word@1", "role-play@1"]
        return "story-sequence@1", ["role-play@1", "grammar-transform@1", "word-builder@1"]
    if typ == "prose":
        if young:
            return "read-along@1", ["picture-word@1", "sentence-scramble@1"]
        return "read-along@1", ["compare-venn@1", "grammar-transform@1"]
    if typ == "picture":
        return "picture-word@1", ["role-play@1", "sentence-scramble@1"]
    if typ == "biography":
        return "timeline@1", ["story-sequence@1", "read-along@1"]
    if typ in ("play", "dialogue"):
        return "role-play@1", ["read-along@1", "grammar-transform@1"]
    if typ == "letter":
        return "read-along@1", ["story-sequence@1"]
    raise ValueError(typ)

ENG_OVERRIDE = {
    "c1-english-ch02": ("role-play@1", ["picture-word@1", "read-along@1"], "greetings by time of day are a dialogue skill"),
    "c1-english-ch07": ("picture-word@1", ["compare-venn@1", "read-along@1"], "food words + 'same and different homes'"),
    "c2-english-ch06": ("map-explorer@1", ["story-sequence@1", "read-along@1"], "schematic route map of the walk to school"),
    "c2-english-ch07": ("map-explorer@1", ["picture-word@1", "read-along@1"], "schematic town map, places vocabulary"),
    "c2-english-ch13": ("map-explorer@1", ["compare-venn@1", "picture-word@1"], "languages and festivals of states"),
    "c3-english-ch12": ("story-sequence@1", ["timeline@1", "read-along@1"], "mission stages are a causal sequence"),
    "c4-english-ch03": ("role-play@1", ["story-sequence@1", "read-along@1"], "road-safety scenario, third-person choices"),
    "c4-english-ch09": ("story-sequence@1", ["map-explorer@1", "role-play@1"], "folk game from Nagaland: locate it"),
    "c4-english-ch11": ("story-sequence@1", ["map-explorer@1", "word-builder@1"], "Himalayas journey"),
    "c4-english-ch12": ("role-play@1", ["map-explorer@1", "read-along@1"], "play set on the Narmada"),
    "c5-english-ch06": ("compare-venn@1", ["map-explorer@1", "read-along@1"], "traditional water structures compared"),
    "c5-english-ch10": ("story-sequence@1", ["map-explorer@1", "grammar-transform@1"], "bangle-making is a process sequence; Firozabad"),
    "c6-english-ch09": ("compare-venn@1", ["picture-word@1", "read-along@1"], "spices: properties compared"),
    "c6-english-ch12": ("read-along@1", ["story-sequence@1", "grammar-transform@1"], "asana sequences"),
    "c6-english-ch13": ("map-explorer@1", ["compare-venn@1", "read-along@1"], "cultural diversity across states"),
    "c7-english-ch03": ("read-along@1", ["compare-venn@1", "grammar-transform@1"], "senses compared"),
    "c7-english-ch09": ("map-explorer@1", ["read-along@1", "grammar-transform@1"], "letters from four directions of India"),
    "c7-english-ch15": ("timeline@1", ["map-explorer@1", "story-sequence@1"], "Rani Abbakka: Ullal on the coast"),
    "c8-english-ch01": ("story-sequence@1", ["role-play@1", "timeline@1"], "Vijayanagara court"),
    "c8-english-ch06": ("timeline@1", ["story-sequence@1", "read-along@1"], "dairy cooperative movement over time"),
    "c8-english-ch09": ("map-explorer@1", ["compare-venn@1", "read-along@1"], "natural wonders of India"),
    "c9-english-ch05": ("map-explorer@1", ["compare-venn@1", "read-along@1"], "hand-fan crafts across India"),
    "c9-english-ch13": ("read-along@1", ["map-explorer@1", "grammar-transform@1"], "remote postal routes"),
}

def hin_rule(typ_raw):
    typ = typ_raw.split(" ")[0]
    if typ in ("kavita", "pad", "doha"):
        return "rhythm-poem@1", ["read-along@1", "word-builder@1"]
    if typ in ("kahani", "lokkatha"):
        return "story-sequence@1", ["role-play@1", "grammar-transform@1", "word-builder@1"]
    if typ in ("sansmaran", "atmakatha"):
        return "story-sequence@1", ["timeline@1", "read-along@1", "word-builder@1"]
    if typ == "nibandh":
        return "read-along@1", ["compare-venn@1", "grammar-transform@1", "word-builder@1"]
    if typ == "yatra":
        return "map-explorer@1", ["read-along@1", "story-sequence@1", "word-builder@1"]
    if typ == "sakshatkar":
        return "role-play@1", ["read-along@1", "grammar-transform@1"]
    if typ == "ekanki":
        return "role-play@1", ["read-along@1", "grammar-transform@1"]
    if typ == "patra":
        return "read-along@1", ["map-explorer@1", "grammar-transform@1"]
    if typ == "udbodhan":
        return "read-along@1", ["grammar-transform@1", "word-builder@1"]
    raise ValueError(typ_raw)

HIN_OVERRIDE = {
    "c6-hindi-ch08": ("compare-venn@1", ["map-explorer@1", "read-along@1"], "Sattriya and Bihu: two dances compared"),
    "c7-hindi-ch04": ("read-along@1", ["story-sequence@1", "word-builder@1"], "water's journey as a sequence"),
    "c9-hindi-ch09": ("rhythm-poem@1", ["role-play@1", "read-along@1"], "a dialogue in verse"),
}

SST = {  # chapter id -> (primary, secondaries, note)
    "c6-sst-ch01": ("map-explorer@1", ["maths:coord-grid@1", "science:sky@1"], "graticule layer; Ujjain meridian"),
    "c6-sst-ch02": ("map-explorer@1", ["compare-venn@1"], "world layer; 'India is a continent' detector"),
    "c6-sst-ch03": ("compare-venn@1", ["map-explorer@1", "story-sequence@1"], "mountain/plateau/plain: 3-set compare"),
    "c6-sst-ch04": ("timeline@1", ["source-card@1"], "BCE/CE; sources"),
    "c6-sst-ch05": ("source-card@1", ["timeline@1", "map-explorer@1"], "names of the land in texts and inscriptions"),
    "c6-sst-ch06": ("source-card@1", ["map-explorer@1", "timeline@1"], "Harappan sites and artefacts"),
    "c6-sst-ch07": ("compare-venn@1", ["timeline@1", "source-card@1"], "schools of thought compared"),
    "c6-sst-ch08": ("compare-venn@1", ["map-explorer@1", "picture-word@1"], "one harvest, many festivals"),
    "c6-sst-ch09": ("role-play@1", ["compare-venn@1"], "who does which work at home"),
    "c6-sst-ch10": ("story-sequence@1", ["role-play@1", "compare-venn@1"], "three organs: who does what"),
    "c6-sst-ch11": ("role-play@1", ["story-sequence@1", "compare-venn@1"], "gram sabha meeting"),
    "c6-sst-ch12": ("role-play@1", ["compare-venn@1", "story-sequence@1"], "ward complaint; rural vs urban bodies"),
    "c6-sst-ch13": ("compare-venn@1", ["role-play@1"], "economic vs non-economic, paid vs unpaid"),
    "c6-sst-ch14": ("story-sequence@1", ["compare-venn@1"], "cotton to cloth: sector chain"),
    "c7-sst-ch01": ("map-explorer@1", ["compare-venn@1"], "physical regions"),
    "c7-sst-ch02": ("compare-venn@1", ["maths:data-graphs@1"], "weather vs climate"),
    "c7-sst-ch03": ("map-explorer@1", ["maths:data-graphs@1", "compare-venn@1"], "climate regions; climographs"),
    "c7-sst-ch04": ("map-explorer@1", ["timeline@1", "source-card@1"], "mahajanapadas"),
    "c7-sst-ch05": ("timeline@1", ["map-explorer@1", "source-card@1"], "Mauryas; edicts"),
    "c7-sst-ch06": ("timeline@1", ["source-card@1", "map-explorer@1"], "coins as sources"),
    "c7-sst-ch07": ("timeline@1", ["source-card@1", "compare-venn@1"], "Gupta achievements"),
    "c7-sst-ch08": ("map-explorer@1", ["compare-venn@1"], "pilgrimage routes"),
    "c7-sst-ch09": ("compare-venn@1", ["role-play@1"], "types of government"),
    "c7-sst-ch10": ("timeline@1", ["role-play@1", "read-along@1"], "making of the Constitution; Preamble read aloud"),
    "c7-sst-ch11": ("role-play@1", ["timeline@1", "maths:money@1"], "barter at a haat"),
    "c7-sst-ch12": ("compare-venn@1", ["role-play@1"], "haat vs mall vs online (3-set)"),
    "c7-sst-ch13": ("compare-venn@1", ["map-explorer@1", "timeline@1"], "kharif vs rabi"),
    "c7-sst-ch14": ("map-explorer@1", ["compare-venn@1"], "neighbours; cross-border rivers"),
    "c7-sst-ch15": ("timeline@1", ["map-explorer@1", "source-card@1"], "parallel dynasty lanes"),
    "c7-sst-ch16": ("timeline@1", ["map-explorer@1", "source-card@1"], "Cholas"),
    "c7-sst-ch17": ("map-explorer@1", ["timeline@1", "compare-venn@1"], "communities on the west coast"),
    "c7-sst-ch18": ("story-sequence@1", ["compare-venn@1", "role-play@1"], "birth certificate to licence"),
    "c7-sst-ch19": ("map-explorer@1", ["compare-venn@1"], "networks layer"),
    "c7-sst-ch20": ("role-play@1", ["story-sequence@1", "maths:money@1"], "opening an account"),
    "c8-sst-ch01": ("compare-venn@1", ["map-explorer@1"], "renewable vs non-renewable"),
    "c8-sst-ch02": ("map-explorer@1", ["timeline@1", "source-card@1"], "political map over time"),
    "c8-sst-ch03": ("map-explorer@1", ["timeline@1"], "hill and sea forts"),
    "c8-sst-ch04": ("timeline@1", ["role-play@1", "source-card@1"], "Champaran: fictional farmer roles"),
    "c8-sst-ch05": ("role-play@1", ["story-sequence@1"], "polling booth; EVM/VVPAT steps"),
    "c8-sst-ch06": ("role-play@1", ["compare-venn@1", "story-sequence@1"], "Question Hour; bill to law"),
    "c8-sst-ch07": ("compare-venn@1", ["story-sequence@1"], "sort into land/labour/capital/entrepreneurship"),
    "c8-sst-ch08": ("map-explorer@1", ["compare-venn@1"], "world regions"),
    "c8-sst-ch09": ("timeline@1", ["map-explorer@1", "source-card@1"], "Dandi route"),
    "c8-sst-ch10": ("compare-venn@1", ["map-explorer@1", "timeline@1"], "Nagara vs Dravida"),
    "c8-sst-ch11": ("role-play@1", ["story-sequence@1"], "Lok Adalat"),
    "c8-sst-ch12": ("compare-venn@1", ["role-play@1"], "rights vs duties"),
    "c8-sst-ch13": ("map-explorer@1", ["maths:data-graphs@1"], "density choropleth"),
    "c8-sst-ch14": ("map-explorer@1", ["timeline@1", "maths:data-graphs@1"], "city growth"),
    "c8-sst-ch15": ("rhythm-poem@1", ["timeline@1", "map-explorer@1"], "Kabir dohas, Tukaram abhangs"),
    "c9-sst-ch01": ("compare-venn@1", ["source-card@1"], "one story, four lenses (table mode)"),
    "c9-sst-ch02": ("story-sequence@1", ["map-explorer@1"], "plate movement, erosion as process chains"),
    "c9-sst-ch03": ("compare-venn@1", ["maths:data-graphs@1", "map-explorer@1"], "weather vs climate; layers"),
    "c9-sst-ch04": ("timeline@1", ["source-card@1", "map-explorer@1"], "Bhimbetka; deep time (log scale)"),
    "c9-sst-ch05": ("source-card@1", ["timeline@1", "map-explorer@1"], "inscriptions"),
    "c9-sst-ch06": ("compare-venn@1", ["role-play@1"], "class vote two ways"),
    "c9-sst-ch07": ("story-sequence@1", ["role-play@1"], "election process; model code"),
    "c9-sst-ch08": ("role-play@1", ["maths:money@1", "compare-venn@1"], "Rs 100: opportunity cost"),
    "c9-sst-ch09": ("role-play@1", ["maths:data-graphs@1", "story-sequence@1"], "mandi price simulation"),
    "c9-sst-ch10": ("map-explorer@1", ["story-sequence@1"], "currents; tsunami warning chain"),
    "c9-sst-ch11": ("map-explorer@1", ["compare-venn@1"], "biomes; biosphere reserves"),
    "c9-sst-ch12": ("timeline@1", ["map-explorer@1", "rhythm-poem@1"], "regional kingdoms; Bhakti"),
    "c9-sst-ch13": ("map-explorer@1", ["timeline@1", "source-card@1"], "trade routes to SE Asia"),
    "c9-sst-ch14": ("source-card@1", ["compare-venn@1"], "Arthashastra excerpt"),
    "c9-sst-ch15": ("role-play@1", ["story-sequence@1"], "canteen business plan"),
    "c9-sst-ch16": ("maths:money@1", ["maths:data-graphs@1", "compare-venn@1"], "budget is a maths-engine job"),
}

ABSORB = {"map": "map-explorer@1", "sequence": "story-sequence@1", "story": "story-sequence@1",
          "scenario": "role-play@1", "sorter": "compare-venn@1"}

def main():
    topics, overrides_used = [], []
    for f in sorted(glob.glob(f"{CUR}/c*-*.json")):
        d = json.load(open(f))
        subj, cls = d.get("subject"), d.get("class")
        if subj not in ("english", "hindi", "sst"):
            continue
        for ch in d["chapters"]:
            typ = ch.get("type", "")
            if subj == "english":
                if ch["id"] in ENG_OVERRIDE:
                    p, s, note = ENG_OVERRIDE[ch["id"]]; overrides_used.append(ch["id"])
                else:
                    (p, s), note = eng_rule(cls, typ), ""
                s = list(s)
                if cls <= 2 and "phonics@1" not in s:
                    s.append("phonics@1")
                if 2 <= cls <= 5 and typ == "story" and "sentence-scramble@1" not in s:
                    s.append("sentence-scramble@1")
                if 4 <= cls and typ != "poem" and "grammar-transform@1" not in s and len(s) < 4:
                    s.append("grammar-transform@1")
            elif subj == "hindi":
                if ch["id"] in HIN_OVERRIDE:
                    p, s, note = HIN_OVERRIDE[ch["id"]]; overrides_used.append(ch["id"])
                else:
                    (p, s), note = hin_rule(typ), ""
            else:
                p, s, note = SST[ch["id"]]
            for t in ch["topics"]:
                topics.append({"id": t["id"], "chapter": ch["id"], "class": cls, "subject": subj,
                               "chapterType": typ or None, "title": t["title"], "primary": p,
                               "secondary": list(s), "note": note or None,
                               "misconceptions": t.get("misconceptions", [])})
    for e in [x["primary"] for x in topics] + [y for x in topics for y in x["secondary"]]:
        assert e in ENGINES or e in EXTERNAL, e
    # absorbed generic formats from the science map
    sci = json.load(open(f"{ROOT}/docs/research/content/science-engine-map.json"))
    absorbed = [{"id": t["id"], "class": t["class"], "generic": t["generic"], "engine": ABSORB[t["generic"]]}
                for t in sci["topics"] if t.get("format") == "generic" and t.get("generic") in ABSORB]
    by_engine = collections.defaultdict(lambda: {"primary": [], "secondary": [], "absorbed": []})
    for t in topics:
        by_engine[t["primary"]]["primary"].append(t["id"])
        for s in t["secondary"]:
            by_engine[s]["secondary"].append(t["id"])
    for a in absorbed:
        by_engine[a["engine"]]["absorbed"].append(a["id"])
    load = {}
    for e in list(ENGINES) + sorted(EXTERNAL):
        v = by_engine.get(e, {"primary": [], "secondary": [], "absorbed": []})
        classes = sorted({int(x.split("-")[0][1:]) for x in v["primary"] + v["secondary"] + v["absorbed"]})
        load[e] = {"code": ENGINES.get(e, "external"), "primary": len(v["primary"]),
                   "any": len(set(v["primary"] + v["secondary"])), "absorbedFromScience": len(v["absorbed"]),
                   "classes": classes}
    by_subject = collections.Counter((t["subject"]) for t in topics)
    ext_primary = [t["id"] for t in topics if t["primary"] in EXTERNAL]
    out = {
        "generatedOn": "2026-10-02",
        "source": "data/curriculum c1-c9 english, c6-c9 hindi, c6-c9 sst (verified 2026-10-02) + science-engine-map.json generic EVS/science topics",
        "spec": "docs/research/content/language-sst-engines.md",
        "generator": "docs/research/content/language_sst_engine_map.py (rules by chapter type and class + explicit per-chapter overrides, listed in overrides)",
        "layers": "primary = the text-anchor engine for the chapter (what the lesson is built around). Skill engines (phonics, word-builder, sentence-scramble, grammar-transform) are mounted per skill strand, so their counts here are a lower bound: English/Hindi files are titles-only (SOURCES.md).",
        "totals": {"topics": len(topics), "bySubject": dict(by_subject),
                   "primaryInThisSet": len(topics) - len(ext_primary), "primaryExternal": ext_primary,
                   "absorbedFromScience": len(absorbed),
                   "absorbedByGeneric": dict(collections.Counter(a["generic"] for a in absorbed))},
        "load": load,
        "overrides": overrides_used,
        "byEngine": {k: v for k, v in by_engine.items()},
        "topics": topics,
        "absorbed": absorbed,
    }
    json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(json.dumps(out["totals"], ensure_ascii=False))
    for k, v in load.items():
        print(f"{k:24} {v}")
    # misconceptions in scope
    mis = [(t["id"], m) for t in topics for m in t["misconceptions"]]
    print("misconceptions in scope:", len(mis))
    for m in mis: print("  ", m)

main()
