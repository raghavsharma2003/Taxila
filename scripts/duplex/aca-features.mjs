// TaxilaFDB acoustic features on Azure Container Apps (Azure-first compute; this sandbox's 4 cores are shared with other
// workstreams). Runs scripts/duplex/st_features.py over every rendered stream in N parallel ACA job executions
// (Consumption, 4 vCPU / 8 GiB each, stock python:3.12-slim image, onnxruntime + numpy from PyPI at start).
//
//   1. pack N shards of (stream .s16 + its gold json) and the code (stmel.py, st_features.py, the mel matrix, the Smart
//      Turn v3.2 graph with its embedding exposed) and upload them to a PRIVATE blob container (duplex-fdb; no public
//      access; synthetic TTS audio only, no child data exists in this benchmark);
//   2. create a one-off ACA job in taxila-env (eastus2, same region as the storage account) whose only secret is a
//      container SAS that expires in 8 h; start one execution per shard (SHARD=i via the execution template override);
//   3. poll; download each shard's features into TAXILA_FDB_FEAT; DELETE the job (it holds the SAS) on every exit path.
// Spend [E]: 16 executions x 4 vCPU x ~10 min ≈ 11 vCPU-h ≈ USD 1 at Consumption list price (vCPU-s + GiB-s).
//   NODE_USE_ENV_PROXY=1 node scripts/duplex/aca-features.mjs [--shards 16] [--keep-blobs]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { arm, loadEnv, until, sleep } from "../../infra/azure.mjs";

loadEnv();
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const SHARDS = Number(opt("--shards", 16));
const STREAMS = process.env.TAXILA_FDB_STREAMS || "/tmp/taxila-fdb/streams";
const FEAT = process.env.TAXILA_FDB_FEAT || "/tmp/taxila-fdb/feat";
const MODELS = "/tmp/taxila-fdb/models";
const WORK = "/tmp/taxila-fdb/aca";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT, KEY = process.env.AZURE_STORAGE_KEY;
const CONTAINER = "duplex-fdb";
const VERSION = "2021-08-06";
const RUN = `fdb-${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(3).toString("hex")}`;
const JOB_NAME = "taxila-duplex-feat";
const API = "api-version=2024-03-01";

// ── blob REST (SharedKey for this script; a SAS for the job) ──
function sign(method, blobPath, headers, query = "") {
  const xms = Object.keys(headers).filter((h) => h.startsWith("x-ms-")).sort().map((h) => `${h}:${String(headers[h]).trim()}`).join("\n");
  const len = headers["content-length"] && headers["content-length"] !== "0" ? headers["content-length"] : "";
  const canonQ = query ? "\n" + query.split("&").map((kv) => kv.split("=")).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `${k}:${decodeURIComponent(v)}`).join("\n") : "";
  const sts = [method, "", "", len, "", headers["content-type"] || "", "", "", "", "", "", "", xms, `/${ACCOUNT}/${blobPath}${canonQ}`].join("\n");
  return crypto.createHmac("sha256", Buffer.from(KEY, "base64")).update(sts, "utf8").digest("base64");
}
async function blob(method, blobPath, { body = null, query = "", contentType = "", extra = {} } = {}) {
  const buf = body ? (Buffer.isBuffer(body) ? body : Buffer.from(body)) : null;
  const headers = { "x-ms-date": new Date().toUTCString(), "x-ms-version": VERSION, ...extra };
  if (buf) { headers["content-length"] = String(buf.length); if (contentType) headers["content-type"] = contentType; }
  else if (method === "PUT") headers["content-length"] = "0";
  headers.authorization = `SharedKey ${ACCOUNT}:${sign(method, blobPath, headers, query)}`;
  const r = await fetch(`https://${ACCOUNT}.blob.core.windows.net/${blobPath}${query ? "?" + query : ""}`, { method, headers, body: buf });
  return r;
}
async function putFile(name, file) {
  const buf = fs.readFileSync(file);
  for (let a = 0; ; a++) {
    const r = await blob("PUT", `${CONTAINER}/${RUN}/${name}`, { body: buf, contentType: "application/octet-stream", extra: { "x-ms-blob-type": "BlockBlob" } });
    if (r.status === 201) return buf.length;
    if (a >= 3) throw new Error(`PUT ${name}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    await sleep(2000 * (a + 1));
  }
}
function containerSas(hours = 8) {
  const se = new Date(Date.now() + hours * 3600_000).toISOString().replace(/\.\d+Z$/, "Z");
  const sp = "rcwl", sr = "c", spr = "https";
  const sts = [sp, "", se, `/blob/${ACCOUNT}/${CONTAINER}`, "", "", spr, VERSION, sr, "", "", "", "", "", "", ""].join("\n");
  const sig = crypto.createHmac("sha256", Buffer.from(KEY, "base64")).update(sts, "utf8").digest("base64");
  return new URLSearchParams({ sp, se, spr, sv: VERSION, sr, sig }).toString();
}

const JOB_SH = String.raw`set -e
apt-get -qq update >/dev/null 2>&1 || true
pip install -q --no-cache-dir onnxruntime numpy >/tmp/pip.log 2>&1
mkdir -p /w/streams /w/feat /w/code && cd /w
B="https://$ACCOUNT.blob.core.windows.net/$CONTAINER/$RUN"
python3 - <<'PY'
import os, urllib.request, tarfile, io
B = "https://%s.blob.core.windows.net/%s/%s" % (os.environ["ACCOUNT"], os.environ["CONTAINER"], os.environ["RUN"])
S = os.environ["SAS"]
def get(name):
    return urllib.request.urlopen(B + "/" + name + "?" + S, timeout=600).read()
tarfile.open(fileobj=io.BytesIO(get("code.tar")), mode="r").extractall("/w/code")
tarfile.open(fileobj=io.BytesIO(get("shard-%s.tar" % os.environ["SHARD"])), mode="r").extractall("/w/streams")
print("downloaded shard", os.environ["SHARD"], len(os.listdir("/w/streams")), flush=True)
PY
TAXILA_FDB_STREAMS=/w/streams TAXILA_FDB_FEAT=/w/feat TAXILA_ST_EMB=/w/code/st32-emb.onnx TAXILA_MEL_NPY=/w/code/mel80x201.npy python3 /w/code/st_features.py --workers 4
python3 - <<'PY'
import os, urllib.request, tarfile, io
B = "https://%s.blob.core.windows.net/%s/%s" % (os.environ["ACCOUNT"], os.environ["CONTAINER"], os.environ["RUN"])
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w") as t:
    for f in sorted(os.listdir("/w/feat")):
        t.add(os.path.join("/w/feat", f), arcname=f)
data = buf.getvalue()
req = urllib.request.Request(B + "/out-%s.tar?%s" % (os.environ["SHARD"], os.environ["SAS"]), data=data, method="PUT",
    headers={"x-ms-blob-type": "BlockBlob", "content-type": "application/x-tar", "content-length": str(len(data))})
print("uploaded", urllib.request.urlopen(req, timeout=600).status, len(data), flush=True)
PY
echo SHARD_DONE $SHARD`;

async function main() {
  if (!ACCOUNT || !KEY) throw new Error("AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY missing");
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(FEAT, { recursive: true });
  // 1. private container (409 = exists); never public
  const c = await blob("PUT", CONTAINER, { query: "restype=container" });
  if (c.status !== 201 && c.status !== 409) throw new Error(`container: ${c.status} ${(await c.text()).slice(0, 200)}`);
  const ids = fs.readdirSync(STREAMS).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort()
    .filter((id) => !fs.existsSync(path.join(FEAT, `${id}.f32`)));
  console.log(`run ${RUN}: ${ids.length} streams to featurise in ${SHARDS} shards`);
  if (!ids.length) return;
  const code = path.join(WORK, "code");
  fs.mkdirSync(code, { recursive: true });
  for (const f of ["stmel.py", "st_features.py"]) fs.copyFileSync(path.join(HERE, f), path.join(code, f));
  for (const f of ["st32-emb.onnx", "mel80x201.npy"]) fs.copyFileSync(path.join(MODELS, f), path.join(code, f));
  execFileSync("tar", ["-cf", path.join(WORK, "code.tar"), "-C", code, "."]);
  await putFile("code.tar", path.join(WORK, "code.tar"));
  const n = Math.min(SHARDS, ids.length);
  let bytes = 0;
  for (let s = 0; s < n; s++) {
    const mine = ids.filter((_, i) => i % n === s);
    const list = path.join(WORK, `shard-${s}.list`);
    // slim gold json (the window needs herSpan / childOnset / where / childWords only; frames are not shipped)
    const dir = path.join(WORK, `shard-${s}`);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (const id of mine) {
      const d = JSON.parse(fs.readFileSync(path.join(STREAMS, `${id}.json`), "utf8"));
      const g = d.gold;
      fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify({ id, meta: { endMs: d.meta.endMs }, gold: { where: g.where, herSpan: g.herSpan, childOnset: g.childOnset, childWords: g.childWords, overlays: [] } }));
      fs.symlinkSync(path.join(STREAMS, `${id}.s16`), path.join(dir, `${id}.s16`));
    }
    fs.writeFileSync(list, mine.join("\n"));
    execFileSync("tar", ["-chf", path.join(WORK, `shard-${s}.tar`), "-C", dir, "."]);
    bytes += await putFile(`shard-${s}.tar`, path.join(WORK, `shard-${s}.tar`));
    process.stdout.write(`uploaded shard ${s} (${mine.length} streams)\n`);
  }
  console.log(`uploaded ${(bytes / 1e6).toFixed(0)} MB`);

  // 2. the ACA job
  const RG = `/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${process.env.AZURE_RESOURCE_GROUP}`;
  const envName = process.env.AZURE_CONTAINERAPPS_ENV || "taxila-env";
  const JOB = `${RG}/providers/Microsoft.App/jobs/${JOB_NAME}`;
  const e = await arm("GET", `${RG}/providers/Microsoft.App/managedEnvironments/${envName}?${API}`);
  const wp = (e.properties.workloadProfiles || []).length ? { workloadProfileName: "Consumption" } : {};
  const sas = containerSas(8);
  const plain = (name, value) => ({ name, value: String(value) });
  const container = (shard) => ({ name: "feat", image: "docker.io/library/python:3.12-slim", command: ["bash", "-c"], args: [JOB_SH], resources: { cpu: 4, memory: "8Gi" },
    env: [plain("ACCOUNT", ACCOUNT), plain("CONTAINER", CONTAINER), plain("RUN", RUN), plain("SHARD", shard), { name: "SAS", secretRef: "fdb-sas" }] });
  const execs = [];
  try {
    await arm("PUT", `${JOB}?${API}`, { location: e.location, properties: { environmentId: e.id, ...wp,
      configuration: { triggerType: "Manual", replicaTimeout: 5400, replicaRetryLimit: 1, manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 },
        secrets: [{ name: "fdb-sas", value: sas }] },
      template: { containers: [container(0)] } } });
    await until(async () => (await arm("GET", `${JOB}?${API}`)).properties.provisioningState === "Succeeded", { everyMs: 4000, maxMs: 300_000, what: "job provisioned" });
    for (let s = 0; s < n; s++) {
      const ex = await arm("POST", `${JOB}/start?${API}`, { containers: [container(s)] });
      execs.push({ s, name: ex.name || ex.id.split("/").pop(), status: "Running" });
    }
    console.log(`started ${execs.length} executions`);
    const t0 = Date.now();
    while (execs.some((x) => !/^(Succeeded|Failed|Stopped|Degraded)$/.test(x.status))) {
      await sleep(15000);
      for (const x of execs) {
        if (/^(Succeeded|Failed|Stopped|Degraded)$/.test(x.status)) continue;
        const r = await arm("GET", `${JOB}/executions/${x.name}?${API}`, undefined, { allow404: true });
        x.status = r?.properties?.status ?? x.status;
      }
      const tally = execs.reduce((a, x) => ((a[x.status] = (a[x.status] || 0) + 1), a), {});
      console.log(`${Math.round((Date.now() - t0) / 1000)} s`, JSON.stringify(tally));
      if (Date.now() - t0 > 90 * 60_000) throw new Error("timeout");
    }
  } finally {
    await arm("DELETE", `${JOB}?${API}`, undefined, { allow404: true }).catch((err) => console.error("job delete failed:", err.message));
    console.log("job deleted");
  }
  // 3. collect
  let got = 0;
  for (const x of execs) {
    const r = await blob("GET", `${CONTAINER}/${RUN}/out-${x.s}.tar`);
    if (r.status !== 200) { console.log(`shard ${x.s}: ${x.status}, no output (${r.status})`); continue; }
    const f = path.join(WORK, `out-${x.s}.tar`);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    execFileSync("tar", ["-xf", f, "-C", FEAT]);
    got++;
  }
  console.log(`collected ${got}/${execs.length} shards → ${FEAT} (${fs.readdirSync(FEAT).filter((f) => f.endsWith(".f32")).length} feature files)`);
  if (!argv.includes("--keep-blobs")) {
    for (const name of ["code.tar", ...Array.from({ length: n }, (_, s) => [`shard-${s}.tar`, `out-${s}.tar`]).flat()]) await blob("DELETE", `${CONTAINER}/${RUN}/${name}`);
    console.log("blobs deleted");
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
