// Shim: the voicesig gates live in evals/voicesig/tests/ (the workstream's own folder); importing them here puts them
// under `npm test` (node --test tests/) so they gate every build.
import "../evals/voicesig/tests/voicesig.test.mjs";
