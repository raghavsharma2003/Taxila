# Taxila — working notes for whoever picks this up next

Taxila is a frontier AI tutor for Indian students in classes 1-9 (CBSE/NCERT, RBSE, other boards): an
exactly-human Hindi-English voice teacher (later a selectable 3D tutor) driven by a server-side Director, an
interpretable learner model that detects covertly whether the child understood, a content factory (Forge) that
builds personalised games/simulations/animations/videos while the teacher teaches, and a Conductor that runs the
child's whole learning day and reports deeply to parents.

## Binding constraints (owner directives)
- **Azure-only compute and AI (2026-10-02).** Every paid AI/compute resource must come from the owner's Azure
  startup grant: Azure AI Foundry **first-party (Azure OpenAI) models** and Azure services (Container Apps,
  Storage, Container Registry). No Anthropic/Claude-on-Foundry or other Marketplace models, no third-party AI
  APIs (ElevenLabs, Sarvam, Simli, HeyGen, Suno, …) — research may cite them, builds may not call them.
  Neon Postgres is allowed (owner's separate Neon grant). Hosting moves from Vercel to Azure Container Apps.
- **Model policy:** main loop and every build/review agent on the top model at high effort; no downgrades.
- **Compliance is deprioritised** for now — but the child-safety floor (never deny being an AI, Childline 1098 /
  Tele-MANAS 14416, no romance/companion register, safeguarding hand-off) is product, not compliance, and stays.

## Read before changing anything
`context/` is the project memory: `graph.json` (index), `decisions.md` (with reversal conditions),
`measurements.md` (n, method, date), `rejected.md` (read FIRST), `architecture.md`. Query with
`node scripts/context.mjs` (`--check` validates). Workflows drop proposed entries in `context/inbox/*.json`;
the main loop merges them.

Inherited laws from the html-portfolio products (measured there, see `docs/harvest/`): sentence-shaped prompt
text gets recited → write shapes, not lines; position is mechanism → rules that must fire go LAST; truncation is
silent → budget gates throw; one `compile()` for every lane; safety by predicate, not instruction; a model never
grades — classify against verified keys; identity is an authenticated child id, never a device.

## Layout
- `server/` plain JS ESM API (one router; `routes/*.js` export route tables), `api/[...route].js` Vercel shim
- `src/` React 19 + TS client; `src/lesson/` live-lesson runtime; `src/modules/` sandboxed engines
- `shared/contracts.ts` — the seams between client, server and content
- `data/curriculum/` NCERT syllabus graph; `data/kits/` verified teaching kits (blind-solved answer keys)
- `docs/research/**` research; `docs/harvest/**` what was inherited from earlier products
- `db/migrations/` (apply with `node scripts/migrate.mjs`), `evals/` measured harnesses

## Deploy
`git push` first (ACR builds from GitHub), then `node scripts/deploy-azure.mjs` → Azure Container Apps `taxila-web`.
The Vercel project `taxila` is paused (Azure-only directive); `api/[...route].js` is kept only as a shim.

## Gates
`npx tsc -b && npx vite build && npm test` must pass before any commit that touches code. Secrets live only in
gitignored `.env.local` (and the hosting provider's secret store) — never commit or print them.
