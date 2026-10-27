import { chromium } from "playwright";
const b = await chromium.launch(); const p = await b.newPage(); await p.setContent("<p>hi</p>"); console.log(await p.textContent("p"), b.version()); await b.close();
