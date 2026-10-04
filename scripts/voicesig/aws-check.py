# Read-only AWS checks for the voice-signal training plan. Reads keys from .env.local directly (the container
# exports placeholder AWS_* vars that would otherwise win: rejected.md rj-node-env-loader-aws-placeholders).
# Never prints a key. Creates nothing, starts nothing.
import os, json, datetime, re
env = {}
for line in open("/home/user/Taxila/.env.local"):
    m = re.match(r"\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$", line)
    if m and m.group(1).startswith("AWS_"):
        env[m.group(1)] = m.group(2).strip().strip("'\"")
os.environ.pop("AWS_ACCESS_KEY_ID", None); os.environ.pop("AWS_SECRET_ACCESS_KEY", None); os.environ.pop("AWS_SESSION_TOKEN", None)
os.environ["AWS_CA_BUNDLE"] = "/root/.ccr/ca-bundle.crt"
import boto3
sess = boto3.Session(aws_access_key_id=env["AWS_ACCESS_KEY_ID"], aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"])
out = {"default_region": env.get("AWS_DEFAULT_REGION"), "build_bucket_set": bool(env.get("AWS_BUILD_BUCKET"))}
try:
    out["account"] = sess.client("sts", region_name="us-east-1").get_caller_identity()["Account"]
except Exception as e:
    out["sts_error"] = str(e)[:200]

QUOTAS = {"L-DB2E81BA": "On-Demand G+VT vCPU", "L-3819A6DF": "Spot G+VT vCPU", "L-417A185B": "On-Demand P vCPU",
          "L-7212CCBC": "Spot P vCPU", "L-1216C47A": "On-Demand Standard vCPU", "L-34B43A08": "Spot Standard vCPU"}
TYPES = ["g4dn.xlarge", "g5.xlarge", "g6.xlarge", "g6e.xlarge", "g6.2xlarge", "c7i.2xlarge", "c7a.2xlarge"]
for region in ["ap-south-1", "us-east-1"]:
    r = out.setdefault(region, {})
    sq = sess.client("service-quotas", region_name=region)
    for code, label in QUOTAS.items():
        try:
            r[label] = sq.get_service_quota(ServiceCode="ec2", QuotaCode=code)["Quota"]["Value"]
        except Exception as e:
            r[label] = "err:" + str(e)[:80]
    ec2 = sess.client("ec2", region_name=region)
    try:
        offered = ec2.describe_instance_type_offerings(LocationType="region", Filters=[{"Name": "instance-type", "Values": TYPES}])
        r["offered"] = sorted(o["InstanceType"] for o in offered["InstanceTypeOfferings"])
    except Exception as e:
        r["offered"] = "err:" + str(e)[:80]
    try:
        h = ec2.describe_spot_price_history(InstanceTypes=TYPES, ProductDescriptions=["Linux/UNIX"],
                                            StartTime=datetime.datetime.utcnow() - datetime.timedelta(hours=6), MaxResults=300)
        best = {}
        for p in h["SpotPriceHistory"]:
            t, az, price = p["InstanceType"], p["AvailabilityZone"], float(p["SpotPrice"])
            if t not in best or price < best[t][0]: best[t] = (price, az)
        r["spot_min_usd_h_6h"] = {k: v for k, v in sorted(best.items())}
    except Exception as e:
        r["spot_err"] = str(e)[:120]
    try:
        res = ec2.describe_instances(Filters=[{"Name": "instance-state-name", "Values": ["pending", "running", "stopping", "stopped"]}])
        r["instances_not_terminated"] = [{"id": i["InstanceId"], "type": i["InstanceType"], "state": i["State"]["Name"],
                                          "launch": str(i["LaunchTime"]), "tags": {t["Key"]: t["Value"] for t in i.get("Tags", [])}}
                                         for rr in res["Reservations"] for i in rr["Instances"]]
    except Exception as e:
        r["instances_err"] = str(e)[:120]
    try:
        vols = ec2.describe_volumes(Filters=[{"Name": "status", "Values": ["available"]}])["Volumes"]
        r["unattached_volumes_GB"] = sum(v["Size"] for v in vols)
    except Exception as e:
        r["volumes_err"] = str(e)[:80]

# On-demand list prices (Pricing API lives in us-east-1).
try:
    pr = sess.client("pricing", region_name="us-east-1")
    od = {}
    for region in ["ap-south-1", "us-east-1"]:
        for t in TYPES:
            resp = pr.get_products(ServiceCode="AmazonEC2", MaxResults=10, Filters=[
                {"Type": "TERM_MATCH", "Field": "instanceType", "Value": t},
                {"Type": "TERM_MATCH", "Field": "regionCode", "Value": region},
                {"Type": "TERM_MATCH", "Field": "operatingSystem", "Value": "Linux"},
                {"Type": "TERM_MATCH", "Field": "tenancy", "Value": "Shared"},
                {"Type": "TERM_MATCH", "Field": "preInstalledSw", "Value": "NA"},
                {"Type": "TERM_MATCH", "Field": "capacitystatus", "Value": "Used"}])
            for s in resp["PriceList"]:
                d = json.loads(s)
                for term in d["terms"].get("OnDemand", {}).values():
                    for dim in term["priceDimensions"].values():
                        usd = float(dim["pricePerUnit"]["USD"])
                        if usd > 0: od[f"{region}:{t}"] = usd
    out["on_demand_usd_h"] = od
except Exception as e:
    out["pricing_err"] = str(e)[:160]

try:
    b = sess.client("budgets", region_name="us-east-1").describe_budgets(AccountId=out.get("account", ""))
    out["budgets"] = [{"name": x["BudgetName"], "limit": x["BudgetLimit"], "type": x["BudgetType"], "time": x["TimeUnit"],
                       "actual": x.get("CalculatedSpend", {}).get("ActualSpend")} for x in b.get("Budgets", [])]
except Exception as e:
    out["budgets_err"] = str(e)[:160]

try:
    ce = sess.client("ce", region_name="us-east-1")
    today = datetime.date.today()
    start = today.replace(day=1) if today.day > 1 else (today - datetime.timedelta(days=1)).replace(day=1)
    q = ce.get_cost_and_usage(TimePeriod={"Start": "2026-09-01", "End": str(today + datetime.timedelta(days=1))}, Granularity="MONTHLY",
                              Metrics=["UnblendedCost"], GroupBy=[{"Type": "DIMENSION", "Key": "RECORD_TYPE"}])
    out["cost_by_record_type"] = [{"period": r["TimePeriod"]["Start"], "groups": {g["Keys"][0]: round(float(g["Metrics"]["UnblendedCost"]["Amount"]), 2) for g in r["Groups"]}} for r in q["ResultsByTime"]]
    q2 = ce.get_cost_and_usage(TimePeriod={"Start": "2026-09-01", "End": str(today + datetime.timedelta(days=1))}, Granularity="MONTHLY",
                               Metrics=["UnblendedCost"], Filter={"Not": {"Dimensions": {"Key": "RECORD_TYPE", "Values": ["Credit", "Refund"]}}},
                               GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}])
    out["gross_cost_by_service"] = [{"period": r["TimePeriod"]["Start"], "groups": {g["Keys"][0]: round(float(g["Metrics"]["UnblendedCost"]["Amount"]), 2) for g in r["Groups"] if float(g["Metrics"]["UnblendedCost"]["Amount"]) > 0.01}} for r in q2["ResultsByTime"]]
except Exception as e:
    out["ce_err"] = str(e)[:160]
print(json.dumps(out, indent=1, default=str))
