// Milestone 4 hardening (round 7, 2026-11-06; owner page docs/design/round7/M3.md): the PURE builders for what
// scripts/m3.mjs creates in taxila-m3-rg next to the VM, and for the keeper's second runner on it. No I/O.
//
//   pips    11 Standard static IPv4 public IPs ($1.32/day on Virtual Network by themselves); taxila-m3-pip-01 sits on
//           the VM's NIC and gives it outbound (its subnet has defaultOutboundAccess false). The NSG keeps Azure's
//           default inbound rules only, so nothing from the internet gets in (nsgDeniesInternetInbound checks).
//   lb      taxila-m3-lb, a Standard INTERNAL load balancer on a new subnet: one private frontend, one backend pool
//           holding the VM's NIC, one TCP probe, 8 TCP rules ($1.32/day on Load Balancer by itself). The VM is in the
//           pool so the rules are "configured" with a real backend; Microsoft's pricing page bills "configured
//           load-balancing and outbound rules" and says nothing about empty pools, so we do not depend on that.
//   runner  a managed Run Command (no SSH) that installs Node (official tarball, sha256-pinned), the keeper script and
//           a systemd timer every 3 hours at :47 past 01, 04, ... UTC (90 minutes after the ACA job), with the keeper's
//           env in a root-only file. Secrets ride as a protectedParameter (never returned by a GET) and are never echoed.
//   locks   CanNotDelete management locks: needs Microsoft.Authorization/locks/write, which Contributor lacks; canDo()
//           decides, lockSteps() prints what the owner does instead.
import { KEEPER, LB, NODE, PIPS, VM } from "./plan.js";

export const NET_API = "2023-11-01";
/** A log line without anything that could be a credential (query strings, long base64/hex runs), as the jobs' scrub. */
export const scrubLine = (s) => String(s ?? "").replace(/\?[^\s"']*/g, "?…").replace(/[A-Za-z0-9+/=_-]{32,}/g, "…").slice(0, 400);
export const RUNCMD = "m3-runner";
export const LOCK_NAME = "m3-credit-do-not-delete";   // the owner's name for the locks set by hand on 2026-11-06

/** Every resource id the M4 steps touch, from the subscription path ("/subscriptions/<id>"). */
export function m4Ids(subPath) {
  const RG = `${subPath}/resourceGroups/${VM.rg}`, N = `${RG}/providers/Microsoft.Network`;
  const lb = `${N}/loadBalancers/${LB.name}`;
  return { rg: RG, nsg: `${N}/networkSecurityGroups/taxila-m3-nsg`, vnet: `${N}/virtualNetworks/taxila-m3-vnet`,
    subnetDefault: `${N}/virtualNetworks/taxila-m3-vnet/subnets/default`, subnetLb: `${N}/virtualNetworks/taxila-m3-vnet/subnets/${LB.subnet}`,
    nic: `${N}/networkInterfaces/taxila-m3-nic`, vm: `${RG}/providers/Microsoft.Compute/virtualMachines/${VM.name}`,
    lb, lbFe: `${lb}/frontendIPConfigurations/fe`, lbPool: `${lb}/backendAddressPools/be`, lbProbe: `${lb}/probes/tcp${LB.probePort}`,
    pip: (i) => `${N}/publicIPAddresses/${pipName(i)}`, runCmd: `${RG}/providers/Microsoft.Compute/virtualMachines/${VM.name}/runCommands/${RUNCMD}` };
}
export const pipName = (i) => `${PIPS.prefix}${String(i).padStart(2, "0")}`;
const lc = (s) => String(s || "").toLowerCase();

// ───────────────────────────── public IPs ─────────────────────────────

export const pipBody = ({ location = PIPS.region, tags = {} } = {}) => ({ location, tags, sku: { name: "Standard", tier: "Regional" },
  properties: { publicIPAllocationMethod: "Static", publicIPAddressVersion: "IPv4", idleTimeoutInMinutes: 4 } });
/** Is a live public IP the kind we price (Standard, regional, static IPv4)? */
export const pipOk = (p) => p?.sku?.name === "Standard" && (p.sku.tier || "Regional") === "Regional"
  && p.properties?.publicIPAllocationMethod === "Static" && (p.properties?.publicIPAddressVersion || "IPv4") === "IPv4";

/**
 * Does the NSG keep every internet source out? Custom rules: none may allow inbound from Internet / * / 0.0.0.0/0 /
 * Any. Defaults: DenyAllInBound must be there (Azure adds AllowVnetInBound, AllowAzureLoadBalancerInBound,
 * DenyAllInBound; neither allow rule's source is the internet). PURE. → { ok, why }
 */
export function nsgDeniesInternetInbound(nsg) {
  const open = (r) => r.properties?.direction === "Inbound" && r.properties?.access === "Allow"
    && [r.properties.sourceAddressPrefix, ...(r.properties.sourceAddressPrefixes || [])].some((s) => /^(\*|internet|0\.0\.0\.0\/0|any)$/i.test(String(s || "")));
  const custom = (nsg?.properties?.securityRules || []).filter(open);
  if (custom.length) return { ok: false, why: `custom inbound rule(s) open to the internet: ${custom.map((r) => r.name).join(", ")}` };
  const defs = nsg?.properties?.defaultSecurityRules || [];
  const deny = defs.find((r) => r.name === "DenyAllInBound" && r.properties?.access === "Deny" && r.properties?.direction === "Inbound" && r.properties?.sourceAddressPrefix === "*");
  if (!deny) return { ok: false, why: "no DenyAllInBound default rule" };
  const openDefs = defs.filter(open);
  if (openDefs.length) return { ok: false, why: `default rule(s) open to the internet: ${openDefs.map((r) => r.name).join(", ")}` };
  return { ok: true, why: `${(nsg.properties.securityRules || []).length} custom rules; defaults ${defs.filter((r) => r.properties?.direction === "Inbound").map((r) => `${r.name} ${r.properties.access} ${r.properties.sourceAddressPrefix}`).join(", ")}` };
}

/**
 * The NIC with its primary ipconfig holding `publicIpId` and/or joined to `poolId` (others kept). → { changed: string[],
 * body } where body is the GET result with only those fields changed (a NIC PUT replaces the whole resource). PURE.
 */
export function nicWith(nic, { publicIpId = null, poolId = null } = {}) {
  const body = JSON.parse(JSON.stringify(nic));
  const ip = (body.properties?.ipConfigurations || []).find((c) => c.properties?.primary) || body.properties?.ipConfigurations?.[0];
  if (!ip) throw new Error("NIC has no ipConfiguration");
  const changed = [];
  if (publicIpId && lc(ip.properties.publicIPAddress?.id) !== lc(publicIpId)) {
    if (ip.properties.publicIPAddress?.id) throw new Error(`${ip.name} already holds another public IP (${ip.properties.publicIPAddress.id.split("/").pop()}); not replacing it`);
    ip.properties.publicIPAddress = { id: publicIpId };
    changed.push(`${ip.name}: + public IP ${publicIpId.split("/").pop()}`);
  }
  if (poolId) {
    const pools = ip.properties.loadBalancerBackendAddressPools || [];
    if (!pools.some((p) => lc(p.id) === lc(poolId))) {
      ip.properties.loadBalancerBackendAddressPools = [...pools, { id: poolId }];
      changed.push(`${ip.name}: + backend pool ${poolId.split("/").slice(-3).join("/")}`);
    }
  }
  return { changed, body };
}

// ───────────────────────────── the internal load balancer ─────────────────────────────

/** The subnet the LB's frontend lives on (no outbound of its own, the same NSG). */
export const lbSubnetBody = (ids) => ({ properties: { addressPrefix: LB.subnetPrefix, defaultOutboundAccess: false, networkSecurityGroup: { id: ids.nsg } } });

/** taxila-m3-lb: Standard, internal, 1 frontend, 1 pool, 1 TCP probe, LB.rules TCP rules on distinct ports. PURE. */
export function lbBody(ids, { location = LB.region, tags = {}, rules = LB.rules } = {}) {
  return { location, tags, sku: { name: "Standard", tier: "Regional" }, properties: {
    frontendIPConfigurations: [{ name: "fe", properties: { subnet: { id: ids.subnetLb }, privateIPAllocationMethod: "Dynamic", privateIPAddressVersion: "IPv4" } }],
    backendAddressPools: [{ name: "be" }],
    probes: [{ name: `tcp${LB.probePort}`, properties: { protocol: "Tcp", port: LB.probePort, intervalInSeconds: 15, numberOfProbes: 2, probeThreshold: 1 } }],
    // non-floating rules may not share a backend port in one pool, so each rule maps its own port straight through
    loadBalancingRules: Array.from({ length: rules }, (_, i) => ({ name: `r${String(i + 1).padStart(2, "0")}`, properties: {
      frontendIPConfiguration: { id: ids.lbFe }, backendAddressPool: { id: ids.lbPool }, probe: { id: ids.lbProbe },
      protocol: "Tcp", frontendPort: LB.firstPort + i, backendPort: LB.firstPort + i, idleTimeoutInMinutes: 4,
      enableFloatingIP: false, enableTcpReset: false, loadDistribution: "Default" } })),
  } };
}
/** The comparable shape of an LB (desired body or GET result): what bills and what we rely on. PURE. */
export function lbView(lb) {
  const p = lb?.properties || {};
  return { sku: lb?.sku?.name || null, frontends: (p.frontendIPConfigurations || []).map((f) => `${f.name}@${lc(f.properties?.subnet?.id).split("/").pop()}${f.properties?.publicIPAddress ? "+public" : ""}`).join(","),
    pools: (p.backendAddressPools || []).map((b) => b.name).join(","),
    probes: (p.probes || []).map((x) => `${x.properties?.protocol}:${x.properties?.port}`).join(","),
    rules: (p.loadBalancingRules || []).map((r) => `${r.properties?.protocol}:${r.properties?.frontendPort}>${r.properties?.backendPort}`).sort().join(",") };
}
/** The LB's billed rule count (load-balancing + outbound; inbound NAT rules are free). */
export const lbRuleCount = (lb) => (lb?.properties?.loadBalancingRules || []).length + (lb?.properties?.outboundRules || []).length;

// ───────────────────────────── locks ─────────────────────────────

/**
 * Does a permission list (GET {scope}/providers/Microsoft.Authorization/permissions → value) allow `action`? Azure's
 * rule: some entry whose actions match and whose notActions do not ('*' wildcards, case-insensitive). PURE.
 */
export function canDo(perms, action) {
  const re = (p) => new RegExp(`^${String(p).split("*").map((s) => s.replace(/[.+?^${}()|[\]\\/]/g, "\\$&")).join(".*")}$`, "i");
  return (perms || []).some((p) => (p.actions || []).some((a) => re(a).test(action)) && !(p.notActions || []).some((a) => re(a).test(action)));
}
/** Is `scopeId` already covered by a delete-blocking lock at it or above it? */
export function lockCovered(locks, scopeId) {
  const target = lc(scopeId);
  return (locks || []).some((l) => {
    if (!/^(CanNotDelete|ReadOnly)$/i.test(l.properties?.level || "")) return false;
    const at = lc(String(l.id).replace(/\/providers\/Microsoft\.Authorization\/locks\/[^/]+$/i, ""));
    return target === at || target.startsWith(`${at}/`);
  });
}
/** What the owner does by hand for one lock target (portal and Cloud Shell), when the deploy principal may not. PURE. */
export function lockSteps(t) {
  const isRg = t.kind === "rg";
  return [`Portal: ${isRg ? `Resource groups → ${t.name}` : `${t.rg} → ${t.name} (${t.type})`} → Settings → Locks → + Add → Lock name "${LOCK_NAME}", Lock type "Delete", Notes "M3/M4 credit unlock: do not delete" → OK`,
    `Cloud Shell: az lock create --name ${LOCK_NAME} --lock-type CanNotDelete --resource-group ${t.rg}${isRg ? "" : ` --resource ${t.name} --resource-type ${t.type}`} --notes "M3/M4 credit unlock"`];
}

// ───────────────────────────── the second keeper runner on the VM ─────────────────────────────

/** KEY=VALUE lines for systemd's EnvironmentFile. Values must be plain (no quotes, spaces or newlines): refuse otherwise. PURE. */
export function envFileText(pairs) {
  return pairs.map(([k, v]) => {
    const s = String(v ?? "");
    if (!/^[A-Z][A-Z0-9_]*$/.test(k)) throw new Error(`env name ${k}`);
    if (/[\s"'\\$`#]/.test(s)) throw new Error(`env ${k}: value has a character systemd would mangle`);
    return `${k}=${s}`;
  }).join("\n") + "\n";
}

/** The systemd units: a oneshot service as a throwaway user (DynamicUser; it still reads the root-only env file, which systemd opens as root) and its timer. */
export function runnerUnits() {
  const service = `[Unit]
Description=M3 keeper, second runner (shares the m3-ledger and its blob lease with the ACA job m3-keeper)
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
EnvironmentFile=/etc/m3/keeper.env
ExecStart=/opt/m3/node/bin/node /opt/m3/keeper-job.mjs
DynamicUser=yes
StateDirectory=m3
TimeoutStartSec=170min
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
Nice=10
`;
  const timer = `[Unit]
Description=M3 keeper every 3 hours at :47 past 01, 04, ..., 22 UTC (90 minutes after the ACA job's :17 runs)

[Timer]
OnCalendar=${KEEPER.vmOnCalendar}
Persistent=true
AccuracySec=1min

[Install]
WantedBy=timers.target
`;
  return { service, timer };
}

/**
 * The Run Command script (bash, runs as root). Idempotent: Node is fetched only when the pinned version is missing, and
 * checked against its sha256 before it is unpacked; the keeper, units and env file are rewritten in place (atomic mv).
 * The env file arrives base64 in $M3_ENV_B64 (a protectedParameter; positional $1 as a fallback) and is never printed.
 * The last lines (M3-RUNNER-NET / M3-RUNNER-OK) are what apply reads back from the instance view. PURE.
 * @param {{ keeperGzB64: string, keeperSha: string, hosts: string[] }} o
 */
export function runnerScript({ keeperGzB64, keeperSha, hosts = [] }) {
  const { service, timer } = runnerUnits();
  const wrap = (s) => s.match(/.{1,120}/g).join("\n");
  for (const h of hosts) if (!/^https:\/\/[a-z0-9.-]+\/?$/i.test(h)) throw new Error(`runner self-check host ${h}`);
  return `#!/bin/bash
# M3/M4 keeper, second runner on ${VM.name} (scripts/m3.mjs apply --only runner; docs/design/round7/M3.md)
set -euo pipefail
umask 022
ENV_B64="\${M3_ENV_B64:-\${1:-}}"
if [ -z "$ENV_B64" ]; then echo "M3-RUNNER-FAIL no env parameter"; exit 2; fi
NODE_VER=${NODE.version}
install -d -m 755 /opt/m3 /etc/m3
chmod 700 /etc/m3
if [ "$(/opt/m3/node/bin/node --version 2>/dev/null || true)" != "$NODE_VER" ]; then
  tmp=$(mktemp -d)
  curl -fsSL --retry 5 --retry-delay 5 -o "$tmp/node.tgz" "https://nodejs.org/dist/$NODE_VER/${NODE.file}"
  echo "${NODE.sha256}  $tmp/node.tgz" | sha256sum -c --quiet -
  rm -rf /opt/m3/node.new && mkdir -p /opt/m3/node.new
  tar -xzf "$tmp/node.tgz" -C /opt/m3/node.new --strip-components=1 --no-same-owner
  rm -rf /opt/m3/node && mv /opt/m3/node.new /opt/m3/node && rm -rf "$tmp"
fi
base64 -d <<'M3B64' | gunzip > /opt/m3/keeper-job.mjs.new
${wrap(keeperGzB64)}
M3B64
echo "${keeperSha}  /opt/m3/keeper-job.mjs.new" | sha256sum -c --quiet -
chmod 644 /opt/m3/keeper-job.mjs.new && mv -f /opt/m3/keeper-job.mjs.new /opt/m3/keeper-job.mjs
( umask 077; printf '%s' "$ENV_B64" | base64 -d > /etc/m3/keeper.env.new )
chown root:root /etc/m3/keeper.env.new && chmod 600 /etc/m3/keeper.env.new && mv -f /etc/m3/keeper.env.new /etc/m3/keeper.env
cat > /etc/systemd/system/m3-keeper.service <<'M3UNIT'
${service}M3UNIT
cat > /etc/systemd/system/m3-keeper.timer <<'M3UNIT'
${timer}M3UNIT
systemctl daemon-reload
systemctl enable --now m3-keeper.timer
systemctl is-active --quiet m3-keeper.timer
for h in ${hosts.join(" ")}; do echo "M3-RUNNER-NET $h $(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$h" || echo 000)"; done
echo "M3-RUNNER-OK node $(/opt/m3/node/bin/node --version) keeper ${keeperSha.slice(0, 12)} env $(stat -c '%a %U' /etc/m3/keeper.env) timer $(systemctl show m3-keeper.timer -p NextElapseUSecRealtime --value)"
`;
}
