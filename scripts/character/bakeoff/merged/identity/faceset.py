"""Public-figure face set for the "does not resemble a real person" check (identity/realperson.py). Build time only;
nothing here ships, nothing is committed (the images stay in $CHAR_HOME/bakeoff-merged/likeness/faceset).

Source: Wikidata (CC0 metadata) + the Wikimedia Commons image of each person (P18), fetched as a 360 px thumbnail.
Each image keeps its own Commons licence; they are used only to compute embeddings for a lookalike test, never
redistributed. Sets:
  india : women with Indian citizenship whose occupation is actor, model, singer, television presenter, politician,
          athlete or journalist (the population a child in India would most plausibly recognise);
  world : the most-linked women on Wikidata (by sitelink count) with any occupation, as a global control.
    python3 faceset.py --out <dir> [--india 1500] [--world 600]"""
import argparse, json, os, sys, time, urllib.parse, urllib.request, hashlib

ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True)
ap.add_argument("--india", type=int, default=1500)
ap.add_argument("--world", type=int, default=600)
a = ap.parse_args()
os.makedirs(os.path.join(a.out, "img"), exist_ok=True)
UA = {"User-Agent": "TaxilaCharacterLikenessCheck/0.1 (build-time QA; no redistribution)", "Accept": "application/sparql-results+json"}


def sparql(q):
    url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": q})
    for t in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return json.load(r)["results"]["bindings"]
        except Exception as e:
            print("sparql retry", e, file=sys.stderr); time.sleep(70)
    return []


OCC = "wd:Q33999 wd:Q4610556 wd:Q177220 wd:Q947873 wd:Q82955 wd:Q2066131 wd:Q1930187 wd:Q10800557 wd:Q2259451"
q_india = f"""SELECT ?p ?pLabel ?img (SAMPLE(?sl) AS ?sls) WHERE {{
  ?p wdt:P31 wd:Q5; wdt:P21 wd:Q6581072; wdt:P27 wd:Q668; wdt:P18 ?img; wdt:P106 ?o; wikibase:sitelinks ?sl.
  VALUES ?o {{ {OCC} }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}} GROUP BY ?p ?pLabel ?img ORDER BY DESC(?sls) LIMIT {a.india}"""
q_world = f"""SELECT ?p ?pLabel ?img ?sl WHERE {{
  ?p wdt:P31 wd:Q5; wdt:P21 wd:Q6581072; wdt:P18 ?img; wikibase:sitelinks ?sl.
  FILTER(?sl > 90)
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}} ORDER BY DESC(?sl) LIMIT {a.world}"""
people = {}
for name, q in (("india", q_india), ("world", q_world)):
    rows = sparql(q)
    time.sleep(65)                 # the query service rate-limits to about 1 request per minute
    print(f"[faceset] {name}: {len(rows)} people", flush=True)
    for r in rows:
        pid = r["p"]["value"].rsplit("/", 1)[1]
        if pid in people:
            continue
        people[pid] = {"set": name, "label": r.get("pLabel", {}).get("value", ""), "img": r["img"]["value"]}
man = os.path.join(a.out, "manifest.json")
old = json.load(open(man)) if os.path.exists(man) else {}
ok = 0
for i, (pid, p) in enumerate(people.items()):
    f = os.path.join(a.out, "img", f"{pid}.jpg")
    if os.path.exists(f) and os.path.getsize(f) > 2000:
        ok += 1; continue
    url = p["img"].replace("http://", "https://") + "?width=360"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA["User-Agent"]}), timeout=60) as r:
            data = r.read()
        open(f, "wb").write(data); ok += 1
    except Exception as e:
        p["err"] = str(e)[:120]
    if i % 100 == 0:
        print(f"[faceset] {i}/{len(people)} fetched {ok}", flush=True)
    time.sleep(0.05)
json.dump({**old, **people}, open(man, "w"), indent=0)
print(f"[faceset] {ok} images of {len(people)} people in {a.out}")
