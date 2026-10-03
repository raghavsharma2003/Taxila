# Pull the Azure Retail Prices rows TEACHER-VISUAL.md cites. Public API, no key. Run: python3 azure_prices_pull.py
# Writes azure-prices-<date>.json next to this file. Uses curl so the session proxy/CA config applies.
import json, subprocess, datetime, os, urllib.parse
API = "https://prices.azure.com/api/retail/prices"
def pull(flt):
    items, url = [], API + "?" + urllib.parse.urlencode({"$filter": flt})
    while url:
        d = json.loads(subprocess.run(["curl", "-sS", "--max-time", "90", url], capture_output=True, text=True, check=True).stdout)
        items += d.get("Items", []); url = d.get("NextPageLink")
    return items
Q = {
  "avatar_centralindia": "armRegionName eq 'centralindia' and contains(meterName,'Avatar')",
  "sora_video_any": "contains(meterName,'Sora') or contains(productName,'Sora')",
  "gpu_vm_centralindia": "armRegionName eq 'centralindia' and serviceName eq 'Virtual Machines' and priceType eq 'Consumption' and (contains(armSkuName,'NC24ads_A100') or contains(armSkuName,'NV36ads_A10') or contains(armSkuName,'NV18ads_A10') or contains(armSkuName,'NC4as_T4') or contains(armSkuName,'NC40ads_H100') or contains(armSkuName,'RTXPRO6000'))",
  "aca_centralindia": "armRegionName eq 'centralindia' and serviceName eq 'Azure Container Apps'",
  "egress_centralindia": "armRegionName eq 'centralindia' and serviceName eq 'Bandwidth' and contains(meterName,'Data Transfer Out')",
}
out = {"date": datetime.date.today().isoformat(), "api": API, "queries": {}}
for k, f in Q.items():
    rows = pull(f)
    out["queries"][k] = {"filter": f, "rows": [{x: r.get(x) for x in ("meterName","productName","skuName","armSkuName","unitOfMeasure","retailPrice","type","armRegionName","effectiveStartDate","serviceName")} for r in rows]}
    print(k, len(rows))
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"azure-prices-{out['date']}.json")
json.dump(out, open(p, "w"), indent=1); print("wrote", p)
