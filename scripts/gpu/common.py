"""Shared plumbing for the build-time AWS job harness (scripts/gpu/*.py).

Decision `aws-build-gpu`: AWS is used ONLY for build-time GPU work; nothing here is product runtime. This container has
no SSH (HTTPS proxy only), so everything is the EC2 / S3 / SSM / Scheduler / Service Quotas / Budgets HTTPS APIs.

Safety limits, all enforced here or in run.py (see docs/design/teacher/GPU-JOBS.md):
  1. every instance carries the tag taxila=gpu-build plus taxila-deadline (UTC ISO) and taxila-max-minutes;
  2. the instance schedules its own `shutdown -h +N` as the FIRST user-data line, and its shutdown behaviour is
     `terminate`, so a hung job still ends as a terminated instance;
  3. an EventBridge Scheduler one-shot calls ec2:TerminateInstances at deadline + SCHEDULER_GRACE_MIN, independent of
     the instance and of this container (the role may only terminate taxila=gpu-build instances);
  4. run.py terminates its instance on every exit path (success, error, Ctrl-C, SIGTERM);
  5. reaper.py terminates any taxila=gpu-build instance older than its max lifetime;
  6. the security group has NO inbound rules; IMDSv2 only; root volume deletes on termination;
  7. HARD_MAX_MINUTES caps any request, and the AWS Budget `taxila-build-gpu` ($100/month) alerts the owner.
"""
import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TAG_KEY, TAG_VAL = "taxila", "gpu-build"
PROFILE = "taxila-gpu-worker"
SG_NAME = "taxila-gpu-build-noinbound"
SCHED_ROLE = "taxila-gpu-reaper-scheduler"
SCHED_GROUP = "default"
HARD_MAX_MINUTES = 480          # no job may ask for a longer life than this
SCHEDULER_GRACE_MIN = 10        # scheduler backstop fires this long after the instance's own deadline
DEFAULT_GPU_TYPES = ["g6.xlarge", "g5.xlarge", "g6e.xlarge"]   # L4 24 GB, A10G 24 GB, L40S 48 GB (4 vCPU each)
DEFAULT_CPU_TYPES = ["t3.small"]
UBUNTU_SSM = "/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id"
DLAMI_PREFIX = "/aws/service/deeplearning/ami/x86_64/"
QUOTAS = {  # service-quotas codes, service ec2
    "L-DB2E81BA": "Running On-Demand G and VT instances (vCPU)",
    "L-3819A6DF": "All G and VT Spot Instance Requests (vCPU)",
    "L-1216C47A": "Running On-Demand Standard (A, C, D, H, I, M, R, T, Z) instances (vCPU)",
    "L-34B43A08": "All Standard (A, C, D, H, I, M, R, T, Z) Spot Instance Requests (vCPU)",
}
GP3_USD_PER_GB_MONTH = 0.08     # us-east-1 list price, 2026-10 [U: list price, not read from the Pricing API]


def load_env():
    """Read AWS_* from the gitignored .env.local into os.environ (never printed)."""
    f = ROOT / ".env.local"
    if f.exists():
        for line in f.read_text().splitlines():
            m = re.match(r"^\s*(AWS_[A-Z_]+)\s*=\s*(.*)\s*$", line)
            # .env.local WINS over the process env: this container exports unrelated AWS_* keys of its own
            if m:
                os.environ[m.group(1)] = m.group(2).strip().strip('"').strip("'")
        os.environ.pop("AWS_SESSION_TOKEN", None)
        os.environ.pop("AWS_PROFILE", None)
    if os.path.exists("/root/.ccr/ca-bundle.crt"):
        os.environ.setdefault("AWS_CA_BUNDLE", "/root/.ccr/ca-bundle.crt")   # the agent proxy re-terminates TLS
    for k in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUILD_BUCKET"):
        if not os.environ.get(k):
            sys.exit(f"missing {k} (expected in .env.local)")
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")


_SESSION = None


def session():
    global _SESSION
    if _SESSION is None:
        load_env()
        import boto3
        _SESSION = boto3.Session(region_name=os.environ["AWS_DEFAULT_REGION"])
    return _SESSION


def client(name, **kw):
    from botocore.config import Config
    return session().client(name, config=Config(retries={"max_attempts": 8, "mode": "adaptive"}), **kw)


def bucket():
    load_env()
    return os.environ["AWS_BUILD_BUCKET"]


def region():
    load_env()
    return os.environ["AWS_DEFAULT_REGION"]


def log(*a):
    print(time.strftime("[%H:%M:%S]"), *a, flush=True)


# ------------------------------------------------------------------ AMI
def _vkey(name):
    m = re.search(r"pytorch-(\d+)\.(\d+)-ubuntu-(\d+)\.(\d+)", name)
    return tuple(int(x) for x in m.groups()) if m else (0, 0, 0, 0)


def resolve_ami(kind="dlami", ssm_path=None):
    """kind dlami: the newest 'oss-nvidia-driver-gpu-pytorch-*-ubuntu-*' Deep Learning AMI (or ssm_path if given, to pin
    a family); kind ubuntu: Canonical Ubuntu 22.04. Returns (ami_id, ssm_path, image_name)."""
    ssm = client("ssm")
    if ssm_path is None and kind == "ubuntu":
        ssm_path = UBUNTU_SSM
    if ssm_path is None:
        names, tok = [], None
        while True:
            kw = dict(Path=DLAMI_PREFIX, Recursive=True, MaxResults=10)
            if tok:
                kw["NextToken"] = tok
            r = ssm.get_parameters_by_path(**kw)
            names += [p["Name"] for p in r["Parameters"]]
            tok = r.get("NextToken")
            if not tok:
                break
        cands = [n for n in names if "oss-nvidia-driver-gpu-pytorch" in n and "ubuntu" in n and n.endswith("/latest/ami-id")]
        if not cands:
            sys.exit("no Deep Learning AMI parameter found")
        ssm_path = max(cands, key=_vkey)
    ami = ssm.get_parameter(Name=ssm_path)["Parameter"]["Value"]
    img = client("ec2").describe_images(ImageIds=[ami])["Images"][0]
    return ami, ssm_path, img.get("Name", ""), img


# ------------------------------------------------------------------ network
def default_subnets():
    ec2 = client("ec2")
    vpc = ec2.describe_vpcs(Filters=[{"Name": "isDefault", "Values": ["true"]}])["Vpcs"]
    if not vpc:
        sys.exit("no default VPC")
    vpc_id = vpc[0]["VpcId"]
    subs = ec2.describe_subnets(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}, {"Name": "default-for-az", "Values": ["true"]}])["Subnets"]
    return vpc_id, sorted([(s["AvailabilityZone"], s["SubnetId"]) for s in subs])


def ensure_sg(vpc_id):
    """A security group with NO inbound rules (egress open: the job needs pip / Hugging Face / S3 over HTTPS)."""
    ec2 = client("ec2")
    g = ec2.describe_security_groups(Filters=[{"Name": "group-name", "Values": [SG_NAME]}, {"Name": "vpc-id", "Values": [vpc_id]}])["SecurityGroups"]
    if g:
        sg = g[0]
    else:
        gid = ec2.create_security_group(GroupName=SG_NAME, VpcId=vpc_id, Description="Taxila build-time GPU jobs: no inbound rules",
                                        TagSpecifications=[{"ResourceType": "security-group", "Tags": [{"Key": TAG_KEY, "Value": TAG_VAL}]}])["GroupId"]
        sg = ec2.describe_security_groups(GroupIds=[gid])["SecurityGroups"][0]
    if sg.get("IpPermissions"):                       # enforce: strip any inbound rule someone added
        ec2.revoke_security_group_ingress(GroupId=sg["GroupId"], IpPermissions=sg["IpPermissions"])
        log(f"removed {len(sg['IpPermissions'])} inbound rule(s) from {sg['GroupId']}")
    return sg["GroupId"]


# ------------------------------------------------------------------ scheduler backstop
def ensure_scheduler_role():
    iam = client("iam")
    acct = client("sts").get_caller_identity()["Account"]
    arn = f"arn:aws:iam::{acct}:role/{SCHED_ROLE}"
    try:
        iam.get_role(RoleName=SCHED_ROLE)
        return arn
    except iam.exceptions.NoSuchEntityException:
        pass
    trust = {"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Principal": {"Service": "scheduler.amazonaws.com"},
                                                      "Action": "sts:AssumeRole", "Condition": {"StringEquals": {"aws:SourceAccount": acct}}}]}
    iam.create_role(RoleName=SCHED_ROLE, AssumeRolePolicyDocument=json.dumps(trust),
                    Description="EventBridge Scheduler backstop: terminate taxila=gpu-build instances past their deadline",
                    Tags=[{"Key": TAG_KEY, "Value": TAG_VAL}])
    pol = {"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Action": "ec2:TerminateInstances", "Resource": f"arn:aws:ec2:*:{acct}:instance/*",
                                                    "Condition": {"StringEquals": {f"aws:ResourceTag/{TAG_KEY}": TAG_VAL}}}]}
    iam.put_role_policy(RoleName=SCHED_ROLE, PolicyName="terminate-tagged", PolicyDocument=json.dumps(pol))
    log(f"created scheduler role {SCHED_ROLE}; waiting 12 s for IAM propagation")
    time.sleep(12)
    return arn


def schedule_backstop(instance_id, at_utc, job_id):
    """One-shot schedule: TerminateInstances(instance_id) at at_utc (datetime). Deletes itself after it fires."""
    sch = client("scheduler")
    name = f"taxila-reap-{instance_id}"
    role = ensure_scheduler_role()
    for attempt in range(4):
        try:
            sch.create_schedule(Name=name, GroupName=SCHED_GROUP, ScheduleExpression=f"at({at_utc.strftime('%Y-%m-%dT%H:%M:%S')})",
                                ScheduleExpressionTimezone="UTC", FlexibleTimeWindow={"Mode": "OFF"}, ActionAfterCompletion="DELETE",
                                Description=f"backstop for job {job_id}",
                                Target={"Arn": "arn:aws:scheduler:::aws-sdk:ec2:terminateInstances", "RoleArn": role,
                                        "Input": json.dumps({"InstanceIds": [instance_id]}),
                                        "RetryPolicy": {"MaximumRetryAttempts": 10, "MaximumEventAgeInSeconds": 3600}})
            return name
        except sch.exceptions.ValidationException as e:   # role not yet assumable right after creation
            if attempt == 3:
                raise
            log(f"scheduler not ready ({e.response['Error']['Message'][:80]}); retrying")
            time.sleep(10)


def delete_backstop(instance_id):
    sch = client("scheduler")
    try:
        sch.delete_schedule(Name=f"taxila-reap-{instance_id}", GroupName=SCHED_GROUP)
    except Exception:
        pass


# ------------------------------------------------------------------ instances
def tagged_instances(states=("pending", "running", "stopping", "stopped", "shutting-down")):
    ec2 = client("ec2")
    out = []
    for page in ec2.get_paginator("describe_instances").paginate(Filters=[{"Name": f"tag:{TAG_KEY}", "Values": [TAG_VAL]},
                                                                          {"Name": "instance-state-name", "Values": list(states)}]):
        for r in page["Reservations"]:
            for i in r["Instances"]:
                i["_tags"] = {t["Key"]: t["Value"] for t in i.get("Tags", [])}
                out.append(i)
    return out


def terminate(instance_id, why=""):
    ec2 = client("ec2")
    try:
        r = ec2.terminate_instances(InstanceIds=[instance_id])
        st = r["TerminatingInstances"][0]["CurrentState"]["Name"]
        log(f"terminate {instance_id}: {st} {why}")
        return st
    except Exception as e:
        if "InvalidInstanceID.NotFound" in str(e):
            return "gone"
        raise


# ------------------------------------------------------------------ prices
_PRICE_CACHE = {}


def ondemand_price(itype):
    """USD/hour, Linux, shared tenancy, us-east-1, from the AWS Pricing API (falls back to None)."""
    if itype in _PRICE_CACHE:
        return _PRICE_CACHE[itype]
    loc = {"us-east-1": "US East (N. Virginia)"}.get(region(), "US East (N. Virginia)")
    try:
        pr = session().client("pricing", region_name="us-east-1")
        r = pr.get_products(ServiceCode="AmazonEC2", MaxResults=10, Filters=[
            {"Type": "TERM_MATCH", "Field": f, "Value": v} for f, v in
            [("instanceType", itype), ("location", loc), ("operatingSystem", "Linux"), ("tenancy", "Shared"),
             ("preInstalledSw", "NA"), ("capacitystatus", "Used")]])
        for p in r["PriceList"]:
            d = json.loads(p)
            for term in d["terms"]["OnDemand"].values():
                for dim in term["priceDimensions"].values():
                    usd = float(dim["pricePerUnit"]["USD"])
                    if usd > 0:
                        _PRICE_CACHE[itype] = usd
                        return usd
    except Exception as e:
        log(f"pricing API unavailable for {itype}: {str(e)[:100]}")
    _PRICE_CACHE[itype] = None
    return None


def spot_price(itype, az):
    try:
        r = client("ec2").describe_spot_price_history(InstanceTypes=[itype], AvailabilityZone=az, ProductDescriptions=["Linux/UNIX"], MaxResults=1)
        return float(r["SpotPriceHistory"][0]["SpotPrice"]) if r["SpotPriceHistory"] else None
    except Exception:
        return None


def cost_estimate(itype, lifecycle, az, seconds, disk_gb):
    """EC2 bills Linux per second with a 60 s minimum; EBS per GB-second."""
    p = spot_price(itype, az) if lifecycle == "spot" else ondemand_price(itype)
    s = max(60.0, seconds)
    ec2_usd = (p or 0) * s / 3600
    ebs_usd = disk_gb * GP3_USD_PER_GB_MONTH * seconds / (30 * 86400)
    return {"usdPerHour": p, "billedSeconds": round(s, 1), "ec2Usd": round(ec2_usd, 5), "ebsUsd": round(ebs_usd, 5),
            "totalUsd": round(ec2_usd + ebs_usd, 5), "priceSource": "spot price history" if lifecycle == "spot" else "AWS Pricing API"}
