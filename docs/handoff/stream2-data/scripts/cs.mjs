const { resolveLane } = await import("/home/user/Taxila/server/endpoints.js");
const { endpoint, key } = resolveLane("SAFETY");
const host = endpoint.replace(/(https:\/\/[^/]+).*/, "$1");
const b = (await import("node:fs")).readFileSync("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/potato.jpeg").toString("base64");
const t0 = Date.now();
const res = await fetch(`${host}/contentsafety/image:analyze?api-version=2024-09-01`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "content-type": "application/json" }, body: JSON.stringify({ image: { content: b }, outputType: "FourSeverityLevels" }) });
console.log(res.status, Date.now() - t0, "ms", JSON.stringify(await res.json().catch(() => null)).slice(0, 300));
