"""Pull the SEC XBRL numbers cited in failures.md (Chegg, 2U) so they can be re-checked.

Run: python3 failures_sec_pull.py  -> writes failures-sec-2026-10-02.json next to this file.
Source: https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json (SEC asks for a contact User-Agent).
Annual values use the CYyyyy frame (calendar-year duration); debt uses CYyyyyQnI (instant) frames.
"""
import json, os, urllib.request

UA = {"User-Agent": "Taxila research (contact via repo owner)"}
CIKS = {"chegg": "0001364954", "2u": "0001459417"}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "failures-sec-2026-10-02.json")


def get(cik):
    req = urllib.request.Request(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json", headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def annual(facts, concept):
    vals = facts["facts"]["us-gaap"].get(concept, {}).get("units", {}).get("USD", [])
    return {v["frame"]: v["val"] for v in vals if (v.get("frame") or "").startswith("CY") and len(v["frame"]) == 6}


def instant(facts, concept):
    vals = facts["facts"]["us-gaap"].get(concept, {}).get("units", {}).get("USD", [])
    return {v["frame"]: v["val"] for v in vals if (v.get("frame") or "").endswith("I")}


def floats(facts):
    return {v["end"]: v["val"] for v in facts["facts"]["dei"]["EntityPublicFloat"]["units"]["USD"]}


out = {}
for name, cik in CIKS.items():
    f = get(cik)
    out[name] = {
        "entity": f.get("entityName"),
        "revenue": annual(f, "RevenueFromContractWithCustomerExcludingAssessedTax"),
        "net_income": annual(f, "NetIncomeLoss"),
        "long_term_debt": instant(f, "LongTermDebt"),
        "public_float": floats(f),
    }
json.dump(out, open(OUT, "w"), indent=1, sort_keys=True)
print("wrote", OUT)
for name, d in out.items():
    print(name, "revenue", sorted(d["revenue"].items())[-6:])
    print(name, "float", sorted(d["public_float"].items())[-5:])
