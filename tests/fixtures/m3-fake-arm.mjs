// A fake ARM for `scripts/m3.mjs apply` dry runs (tests/m4-break.test.mjs): loaded with `node --import` into the CLI's
// child process only, it replaces fetch with a table of read routes (token, Retail Prices, the VM and its network, ACA,
// Cognitive Services, locks, permissions) and THROWS on any write: a dry run that tries a PUT, PATCH, DELETE or a
// non-list POST fails its test. Scenario from M3_FAKE_ARM: fresh (the VM exists, nothing M4 does yet, Contributor, no
// locks), done (every M4 resource exists, locks and lock rights present), open-nsg (fresh + an inbound Internet rule),
// rights (fresh, no locks, but the principal may create them: User Access Administrator, as on 2026-11-06).
import * as P from "../../infra/m3/plan.js";
import * as V from "../../infra/m3/vm.js";

const SC = process.env.M3_FAKE_ARM || "fresh", SUB = `/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}`, RG = process.env.AZURE_RESOURCE_GROUP;
const ids = V.m4Ids(SUB), done = SC === "done";
const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
const NF = () => J({ error: { code: "ResourceNotFound" } }, 404);
const rule = (name, access, prio, src) => ({ name, properties: { direction: "Inbound", access, priority: prio, sourceAddressPrefix: src, destinationAddressPrefix: "*", protocol: "*", destinationPortRange: "*" } });
const nsg = { id: ids.nsg, properties: { securityRules: SC === "open-nsg" ? [rule("ssh-anywhere", "Allow", 100, "Internet")] : [],
  defaultSecurityRules: [rule("AllowVnetInBound", "Allow", 65000, "VirtualNetwork"), rule("AllowAzureLoadBalancerInBound", "Allow", 65001, "AzureLoadBalancer"), rule("DenyAllInBound", "Deny", 65500, "*")] } };
const nic = { id: ids.nic, location: "centralindia", properties: { networkSecurityGroup: { id: ids.nsg }, ipConfigurations: [{ name: "ipconfig1", properties: { primary: true, privateIPAddress: "10.73.0.4",
  subnet: { id: ids.subnetDefault }, ...(done ? { publicIPAddress: { id: ids.pip(1) }, loadBalancerBackendAddressPools: [{ id: ids.lbPool }] } : {}) } }] } };
const accounts = [
  { name: "taxila-ai-southindia", location: "southindia", kind: "AIServices", deps: [{ name: "taxila-fast", model: "gpt-5.6-luna" }, { name: "taxila-fast-bg", model: "gpt-5.6-luna" }, { name: "taxila-image", model: "gpt-image-2", chat: false }] },
  { name: "taxila-ai-swc", location: "swedencentral", kind: "AIServices", deps: [{ name: "taxila-image", model: "gpt-image-2", chat: false }] },
  { name: "taxila-ai-centralindia", location: "centralindia", kind: "AIServices", deps: [] },
  { name: "raghavsharma1729-compan-resource", location: "eastus2", kind: "AIServices", deps: [] },
].map((a) => ({ ...a, id: `${SUB}/resourceGroups/${RG}/providers/Microsoft.CognitiveServices/accounts/${a.name}` }));
const lockOf = (scope) => ({ id: `${scope}/providers/Microsoft.Authorization/locks/${V.LOCK_NAME}`, name: V.LOCK_NAME, properties: { level: "CanNotDelete" } });
const CONTRIBUTOR = [{ actions: ["*"], notActions: ["Microsoft.Authorization/*/Delete", "Microsoft.Authorization/*/Write", "Microsoft.Authorization/elevateAccess/Action"] }];

/** GET routes: [regex on the path (no query), () => Response]. First match wins. */
const routes = [
  [/\/virtualMachines\/taxila-m3-vm\/instanceView$/i, () => J({ statuses: [{ code: "ProvisioningState/succeeded" }, { code: "PowerState/running" }], vmAgent: { vmAgentVersion: "2.16.0.2", statuses: [{ displayStatus: "Ready" }] } })],
  [/\/virtualMachines\/taxila-m3-vm\/runCommands\/m3-runner$/i, () => (done ? J({ tags: { "m3-spec": "0000000000000000" }, properties: { instanceView: { executionState: "Succeeded", exitCode: 0, output: "M3-RUNNER-OK node v22.23.4" } } }) : NF())],
  [/\/virtualMachines\/taxila-m3-vm$/i, () => J({ id: ids.vm, properties: { hardwareProfile: { vmSize: "Standard_D2as_v5" }, provisioningState: "Succeeded" } })],
  [/\/locations\/centralindia\/usages$/i, () => J({ value: [{ name: { value: "standardDASv5Family" }, currentValue: 2, limit: 10 }, { name: { value: "cores" }, currentValue: 2, limit: 10 }] })],
  [/\/networkSecurityGroups\/taxila-m3-nsg$/i, () => J(nsg)],
  [/\/virtualNetworks\/taxila-m3-vnet\/subnets\/lb$/i, () => (done ? J({ properties: { addressPrefix: P.LB.subnetPrefix } }) : NF())],
  [/\/virtualNetworks\/taxila-m3-vnet$/i, () => J({ properties: { addressSpace: { addressPrefixes: ["10.73.0.0/24"] } } })],
  [/\/networkInterfaces\/taxila-m3-nic$/i, () => J(nic)],
  [/\/publicIPAddresses\/taxila-m3-pip-(\d+)$/i, (m) => (done ? J({ sku: { name: "Standard", tier: "Regional" }, properties: { publicIPAllocationMethod: "Static", publicIPAddressVersion: "IPv4", ipAddress: `20.0.0.${Number(m[1])}`,
    ...(Number(m[1]) === 1 ? { ipConfiguration: { id: `${ids.nic}/ipConfigurations/ipconfig1` } } : {}) } }) : NF())],
  [/\/loadBalancers\/taxila-m3-lb$/i, () => (done ? J(V.lbBody(ids)) : NF())],
  [/\/resourceGroups\/taxila-m3-rg$/i, () => J({ location: "centralindia" })],
  [/\/providers\/Microsoft\.Authorization\/locks$/i, (m, path) => J({ value: done ? [lockOf(path.replace(/\/providers\/Microsoft\.Authorization\/locks$/i, ""))] : [] })],
  [/\/providers\/Microsoft\.Authorization\/permissions$/i, () => J({ value: done || SC === "rights" ? [...CONTRIBUTOR, { actions: ["*/read", "Microsoft.Authorization/*"], notActions: [] }] : CONTRIBUTOR })],
  [/\/managedEnvironments\/taxila-env$/i, () => J({ id: `${SUB}/resourceGroups/${RG}/providers/Microsoft.App/managedEnvironments/taxila-env`, location: "East US 2", properties: {} })],
  [/\/containerApps\/taxila-web$/i, () => J({ properties: { configuration: { registries: [{ server: "taxilacr.azurecr.io", username: "taxilacr", passwordSecretRef: "acr-pw" }] } } })],
  [/\/jobs\/m3-(keeper|verify)$/i, () => NF()],
  [/\/providers\/Microsoft\.CognitiveServices\/accounts$/i, () => J({ value: accounts.map((a) => ({ id: a.id, name: a.name, location: a.location, kind: a.kind })) })],
  [/\/accounts\/([^/]+)\/deployments$/i, (m) => J({ value: (accounts.find((a) => a.name === m[1])?.deps || []).map((d) => ({ name: d.name, properties: { model: { format: "OpenAI", name: d.model },
    provisioningState: "Succeeded", capabilities: d.chat === false ? { imageGenerations: "true" } : { chatCompletion: "true" } } })) })],
];
const POSTS = [
  [/\/containerApps\/taxila-web\/listSecrets$/i, () => J({ value: [{ name: "acr-pw", value: "fake-acr-password-secret" }] })],
  [/\/accounts\/([^/]+)\/listKeys$/i, (m) => J({ key1: m[1] === "taxila-ai-centralindia" ? process.env.AZURE_SPEECH_KEY_SIN : `fake-${m[1]}-key-secret`, key2: "fake-key2-secret" })],
];

globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url), method = (init.method || "GET").toUpperCase();
  if (u.hostname === "login.microsoftonline.com") return J({ access_token: "fake-token", expires_in: 3600 });
  if (u.hostname === "prices.azure.com") {
    const f = u.searchParams.get("$filter") || "";
    const id = /meterId eq '([^']+)'/.exec(f)?.[1], region = /armRegionName eq '([^']+)'/.exec(f)?.[1];
    const p = Object.values(P.PRICES).find((x) => x.meterId === id && x.region === region);
    return J({ Items: p ? [{ retailPrice: p.usd, productName: p.productName || "", meterName: p.meterName || "", tierMinimumUnits: 0 }] : [], NextPageLink: null });
  }
  if (u.hostname !== "management.azure.com") throw new Error(`fake ARM: unexpected host ${u.hostname}`);
  const path = u.pathname;
  if (method === "GET") {
    for (const [re, fn] of routes) { const m = re.exec(path); if (m) return fn(m, path); }
    process.stderr.write(`fake ARM: no route for GET ${path}\n`);
    return NF();
  }
  if (method === "POST") for (const [re, fn] of POSTS) { const m = re.exec(path); if (m) return fn(m, path); }
  throw new Error(`fake ARM: a dry run must not ${method} ${path}`);
};
