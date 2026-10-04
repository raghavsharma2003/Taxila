// W2-C production acceptance (BUILD-PLAN §4 W2-C): personalisation diff (c) guidance and (d) pace, n ≥ 3 per arm, over
// two days on the account's test clock. The logic is evals/personalisation-diff.mjs (also runnable on its own).
import { run } from "../../evals/personalisation-diff.mjs";
import { done } from "./lib.mjs";

await run();
done();
