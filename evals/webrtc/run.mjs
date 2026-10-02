import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", proxy: { server: "http://127.0.0.1:32825", bypass: "localhost,127.0.0.1" }, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${process.cwd()}/session.wav`, "--autoplay-policy=no-user-gesture-required", "--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="] });
const p = await (await b.newContext({ permissions: ["microphone"] })).newPage();
p.on("requestfailed", r => console.log("REQFAIL", r.url().slice(0,90), r.failure()?.errorText)); await p.goto("http://localhost:8787/");
await p.waitForFunction(() => window.__done, null, { timeout: 70000 });
console.log(JSON.stringify(await p.evaluate(() => window.__log), null, 0).replace(/\},\{/g, "},\n{"));
await b.close();
