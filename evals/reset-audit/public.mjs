import { launch, ctxFor, watch, shot, textDump, probe, goto, save, sleep } from "./lib.mjs";
const b = await launch();
const pages = [["landing", "/"], ["promises", "/promises"], ["privacy", "/privacy"], ["help", "/help"], ["leaving", "/leaving"], ["signin", "/start/signin"], ["start", "/start"], ["who", "/who"], ["parent", "/parent"], ["404", "/nope-xyz"]];
const res = {};
for (const vp of ["m", "t", "d"]) {
  const ctx = await ctxFor(vp); const page = await ctx.newPage();
  for (const [name, path] of pages) {
    const log = { console: [], http: [] }; watch(page, log);
    const t0 = Date.now(); await goto(page, path); await sleep(2500);
    const ms = Date.now() - t0;
    await shot(page, `p-${name}-${vp}`); if (name === "landing" || name === "promises") await shot(page, `p-${name}-${vp}-full`, { full: true });
    res[`${name}-${vp}`] = { url: page.url(), ms, text: (await textDump(page)).slice(0, 6000), probe: await probe(page), log };
    page.removeAllListeners("console"); page.removeAllListeners("response"); page.removeAllListeners("pageerror");
  }
  await ctx.close();
}
save("public", res); await b.close(); console.log("done");
