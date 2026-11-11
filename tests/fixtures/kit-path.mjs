// dc-r7-script-walk-v2 (main: "never detect the test runner in product code"): a test suite that exercises the KIT path pins lesson
// scripts off itself (TAXILA_R7_SCRIPT=off before, the old value restored after). Call it inside a describe, so the hook is
// scoped to that suite in a single-process run (--experimental-test-isolation=none), never wrapping other files.
import { before, after } from "node:test";
export function kitPath() {
  let keep;
  before(() => { keep = process.env.TAXILA_R7_SCRIPT; process.env.TAXILA_R7_SCRIPT = "off"; });
  after(() => { if (keep === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = keep; });
}
