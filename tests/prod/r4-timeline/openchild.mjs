// prints the open command for a child: node openchild.mjs <account> <childKey> <sid> <view> <url-suffix>
import { readFileSync } from "node:fs";
const all = JSON.parse(readFileSync(new URL("./run/accounts.json", import.meta.url), "utf8"));
const [acct, kid, sid, view, suffix] = process.argv.slice(2);
const a = all[acct]; const cid = a.children[kid];
const url = (suffix ?? "").replace("{cid}", cid);
process.stdout.write(JSON.stringify({ op: "open", sid, cookie: a.cookie, url, view }));
