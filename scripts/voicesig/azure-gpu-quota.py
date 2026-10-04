# Read-only Azure GPU quota check with the service principal in .env.local. Never prints a secret.
import re, json, urllib.request, urllib.parse, ssl
env = {}
for line in open("/home/user/Taxila/.env.local"):
    m = re.match(r"\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$", line)
    if m: env[m.group(1)] = m.group(2).strip().strip("'\"")
ctx = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
def http(url, data=None, headers=None):
    import time
    for attempt in range(4):
        req = urllib.request.Request(url, data=data, headers=headers or {})
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=40) as r: return json.load(r)
        except urllib.error.HTTPError as e:
            return {"_http": e.code, "_body": e.read().decode()[:200]}
        except (urllib.error.URLError, ConnectionError) as e:
            if attempt == 3: return {"_neterr": str(e)[:120]}
            time.sleep(2 + attempt * 3)
tok = http(f"https://login.microsoftonline.com/{env['AZURE_TENANT_ID']}/oauth2/v2.0/token",
           data=urllib.parse.urlencode({"grant_type": "client_credentials", "client_id": env["AZURE_SP_CLIENT_ID"],
                                        "client_secret": env["AZURE_SP_SECRET"], "scope": "https://management.azure.com/.default"}).encode())
H = {"Authorization": "Bearer " + tok["access_token"]}
sub = env["AZURE_SUBSCRIPTION_ID"]
out = {}
regions = ["southindia", "centralindia", "westindia", "eastus2", "eastus", "westus3", "swedencentral", "uaenorth", "polandcentral", "southeastasia"]
for loc in regions:
    u = http(f"https://management.azure.com/subscriptions/{sub}/providers/Microsoft.Compute/locations/{loc}/usages?api-version=2023-07-01", headers=H)
    if "value" not in u:
        out[loc] = u; continue
    gpu = {v["name"]["value"]: [v["currentValue"], v["limit"]] for v in u["value"]
           if re.search(r"^(standard(NC|ND|NV|NG)|lowPriority)", v["name"]["value"], re.I)}
    nonzero = {k: v for k, v in gpu.items() if v[1] > 0}
    out[loc] = {"gpu_families_checked": len(gpu), "gpu_nonzero_limits": nonzero}
    app = http(f"https://management.azure.com/subscriptions/{sub}/providers/Microsoft.App/locations/{loc}/usages?api-version=2024-03-01", headers=H)
    if "value" in app:
        out[loc]["containerapps_gpu"] = {v["name"]["value"]: [v["currentValue"], v["limit"]] for v in app["value"] if re.search(r"gpu|T4|A100", v["name"]["value"], re.I)}
    else:
        out[loc]["containerapps_gpu"] = app
    q = http(f"https://management.azure.com/subscriptions/{sub}/providers/Microsoft.Compute/locations/{loc}/providers/Microsoft.Quota/quotaRequests?api-version=2023-02-01", headers=H)
    if "value" in q and q["value"]:
        out[loc]["quota_requests"] = [{"name": r.get("name"), "state": r.get("properties", {}).get("provisioningState"),
                                        "msg": str(r.get("properties", {}).get("message"))[:100],
                                        "time": r.get("properties", {}).get("requestSubmitTime")} for r in q["value"][:6]]
print(json.dumps(out, indent=1))
