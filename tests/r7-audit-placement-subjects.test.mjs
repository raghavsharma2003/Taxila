// r7 audit LEARN-06: the onboarding cold start inserts a placement row per subject, but the table's check (036, and any
// later migration) allows only some subjects; an English/Hindi/SST answer failed the save with a 500. The loop now inserts
// only subjects the migrations allow. This pins that set to the SQL, so a widening migration and the code move together.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PLACEMENT_TABLE_SUBJECTS } from "../server/routes/placement.js";

const dir = new URL("../db/migrations/", import.meta.url);
const allowed = () => {
  let last = null;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    const sql = readFileSync(new URL(f, dir), "utf8");
    for (const m of sql.matchAll(/subject\s+text[^,]*check\s*\(subject in \(([^)]*)\)\)|placement_subject_check check \(subject in \(([^)]*)\)\)/g)) {
      if (/placement/.test(sql)) last = (m[1] ?? m[2]).split(",").map((s) => s.trim().replace(/'/g, ""));
    }
  }
  return last;
};

test("the onboarding loop inserts only subjects the placement table accepts", () => {
  assert.deepEqual([...PLACEMENT_TABLE_SUBJECTS].sort(), [...allowed()].sort());
  const src = readFileSync(new URL("../server/routes/placement.js", import.meta.url), "utf8");
  assert.match(src, /if \(!PLACEMENT_TABLE_SUBJECTS\.includes\(subject\)\) continue;/);
});

