# Harvest: web-sites (vyakti-website + cs-website)

Segment `web-sites`. Harvested 2026-10-02 from local clones, read-only via `git show <ref>:<path>`. Every claim cites `path@ref`. No secrets were printed; the cs-website workflow only references repo secrets by name, and the IndexNow key in `scripts/indexnow-submit.mjs` is a public domain-verification key by design (not reproduced here).

Refs used:
- **vyakti-website**: `claude/vyakti-research-website-a47qnq@904b370` (production lab site; `codex/vyakti-rebuild` points at the same commit) and `claude/vyakti-cloning-platform-aq05n4@4a7cbef` (5 commits ahead: the Vyakti Rooms rewrite).
- **cs-website** (carbonsettle.com): `main@27d3ee00` (daily automation commits, contains b8b4e691 IndexNow fix, still tracks 303 MB `carbonsettle-main/`), `claude/seo-phase1-lead-pages@27781178` (cleanest, most current tree, unmerged: content guards, phase-1 lead pages), `claude/seo-phase0-organic-leads@448145cf`, `claude/carbonsettle-importer-redesign-e3dpci@ba6be984` (unmerged dual-ICP redesign + Impeccable/taste skill pass), `analytics-full-tracking@d9666c63`, `wip/design-blogger-20260703@1dea2225`, and 6 small fix branches (commit messages only).

## 1. What this is

Two marketing-site repos. vyakti-website (Next.js 16 + Tailwind v4 + R3F/GSAP/Lenis) is the vyakti.ai relational-intelligence lab site: an editorial light token system, a scroll-driven WebGL story where the Noor face forms out of particles and speaks through a semantic jaw/viseme rig, a research section in which every number has to carry n/method/date/source and retracted claims are shown struck through, and a dated decision log full of rejections (procedural hair, topology morph, TripoSR 3D Meera, scrub on touch). Branch research-website@904b370 (same commit as codex/vyakti-rebuild) is the production lab site with the mobile scroll-performance fix. cloning-platform@4a7cbef pivots the copy to 'Vyakti Rooms' and adds a boundary model drawn as a figure.

cs-website (Next.js 16, 12 branches) is carbonsettle.com, a heavily SEO-driven B2B site for Indian exporters. Its most valuable harvest is the hard-won content-automation safety stack: a daily LLM article generator that once destroyed ~65% of search impressions by re-dating slugs, now rebuilt around topic-only slugs, update-in-place, a slug manifest with a never-404 build guard, a 308 alias resolver, a corpus lint with banned phrases, link validation and injection, a duplicate-title guard, and IndexNow wired to postbuild. It also has a full first-party analytics tracker (beacon batching, 30-min sessions, section read-rate, rage/dead clicks, web vitals, stale-chunk self-heal, staff suppression), honest-proof guardrails (fabricated ratings were tried and removed), a 6-language hreflang cluster, llms.txt, security headers, and an Impeccable/taste/emil skill pass with mechanically checkable UI rules. A founder-rejected homepage redesign and five preview homepages are documented rejections.

For Taxila: copy the content guards (Forge output and SEO pages), the Measure/evidence-rail honesty components (parent reports), the reveal/smooth-scroll/navbar/motion tokens, the one-field +91 phone-or-email capture and dual-channel lead API, and the first-party tracker with child-surface stripping. Adapt the WebGL budget, context-loss fallback and semantic viseme rig for the 3D tutor. Skip PostHog session replay, GA4, OpenRouter and the Mitra provider path (Azure-only, child safety). Measured numbers are mostly SEO/conversion (GSC 90d 13,457 impressions, 0/310 sessions reaching contact, 80% proposal download rate, 40 replies with zero price objections) plus asset-size wins; there are no fps or lip-sync metrics.

**Stack notes for porting.** Both sites are Next.js 16 App Router (metadata routes `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, middleware `proxy.ts`). Taxila is Vite + React 19 + plain-JS server on Azure Container Apps, so Next-specific pieces are *adapt* (port as build-time scripts or server routes), while plain React components, CSS tokens, Node scripts and the analytics client are close to *copy*. Every external provider in these repos (OpenRouter, Gemini, gpt-4o-mini direct, PostHog, GA4, EmailJS, Gmail SMTP) is disallowed by the Azure-only directive and is marked skip or replaced.

## 2. Reusable assets

| id | path@ref | what | maturity | Taxila use | target subsystem |
|---|---|---|---|---|---|
| ws-01 | vyakti-website: `src/app/globals.css` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Editorial light-theme token set (Tailwind v4 @theme)**. One @theme block mapping semantic names (void/ink/surface/raised/hairline/bone/ash/slate/ember/sage) to :root vars; fluid clamp() type scale eyebrow..h1 (h1 clamp(3.35rem,1.65rem+6.5vw,8.7rem), tight -0.068em tracking), easing tokens ease-out-quint cubic-bezier(0.23,1,0.32,1) / ease-out-expo, durations 140/260/320ms, .shell/.shell-narrow/.measure(62ch)/.eyebrow utilities, text-wrap balance/pretty, data-reveal component, touch + reduced-motion overrides. | shipped | **adapt** | design-system/ux (marketing site + parent app) |
| ws-02 | vyakti-website: `src/components/reveal.tsx`<br>`src/app/globals.css` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Reveal-once IntersectionObserver with index stagger**. One observer for every [data-reveal]; reveals once and never re-animates on scroll-back (comment: 're-animating on scroll-back is the single most reliable tell of a template'); stagger = data-reveal index * 80ms; rootMargin -12% so motion belongs to the scroll; reduced motion reveals all; CSS disables reveal entirely on (hover:none),(pointer:coarse). | shipped | **copy** | design-system/ux |
| ws-03 | vyakti-website: `src/components/smooth-scroll.tsx`<br>`src/types/lenis-global.d.ts` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Lenis smooth scroll gated to fine pointers, shared GSAP ticker**. Lenis only when (hover:hover) and (pointer:fine) and not reduced-motion; listens for live media-query changes and tears down; drives ScrollTrigger.update from Lenis scroll; exposes --scroll-progress CSS var and data-scrolled; gsap.ticker.lagSmoothing(0); window.__lenis for anchor nav. | shipped | **copy** | design-system/ux (marketing site only; never inside the lesson runtime) |
| ws-04 | vyakti-website: `src/components/home/relational-story.tsx`<br>`src/components/home/home.module.css`<br>`src/components/home/relational-story-canvas.tsx` @904b370 (Fix mobile story scroll performance) | **Mobile scroll-story performance fix (native progress, direct style writes)**. Touch layouts drive the story from ScrollTrigger self.progress directly (no scrub tween); desktop keeps scrub:true via a progress proxy tween. ScrollTrigger.config({ignoreMobileResize:true}) ignores browser-chrome resizes mid-swipe. gsap.set replaced by direct element.style writes; chapters already hidden are skipped (chapterWasVisible cache). Sticky stage gets contain:paint; removed a permanent will-change. | shipped | **copy** | design-system/ux; generative-ui/modules (scroll-driven explainers) |
| ws-05 | vyakti-website: `src/components/home/relational-story-canvas.tsx`<br>`src/components/home/relational-story.tsx` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **R3F canvas budget + geometry-stable WebGL fallback + dots-only first paint**. Canvas frameloop='demand' with invalidate() from scroll; dpr [1,1.25]; antialias off; particles 14,000 desktop / 4,800 compact; point DPR capped 1 on compact; webglcontextlost listener swaps only the visual layer without changing runway height or scroll position; dynamic(ssr:false) with an InitialSignalField loader so first paint is a lightweight dots field and never a solid poster; WebGL pauses offscreen (onToggle active flag). | shipped | **adapt** | avatar-visual (3D tutor canvas on budget Android), generative-ui/modules |
| ws-06 | vyakti-website: `src/components/home/relational-story-canvas.tsx`<br>`scripts/build-noor-rig.py`<br>`scripts/extend-ink-lab-mouth.py`<br>`public/models/ink-lab/noor-rig.bin` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Deterministic viseme keyframes + semantic oral rig weights**. VISEME_KEYS table [t, open, wide, round] sampled with smoothstep into a uViseme vec3 uniform; build-noor-rig.py bakes 4 UNORM8 channels (upper lip, lower lip, jaw, eyelids) in exact vertex order of the GNM skin mesh with ring-feathering over mesh adjacency, so skin, mouth socket and teeth move coherently from one jaw/viseme transform. Speech is time-based inside a scroll-gated chapter (1.42s phrase) so pausing scroll cannot freeze the mouth mid-viseme. | prototype | **idea** | avatar-visual (3D tutor lip-sync) |
| ws-07 | vyakti-website: `scripts/build-head-model.mjs`<br>`public/models/CREDITS.md` @8fc2ec3 | **Reproducible, hash-pinned 3D asset pipeline**. prebuild script fetches the source model from a pinned three.js tag, verifies SHA-256, welds, simplifies to 35%, strips every attribute except POSITION, prunes; no-op when the committed file exists. Result 76 KB / 3,361 vertices. CREDITS.md ties CC BY 3.0 attribution to the footer that renders it. | shipped | **adapt** | avatar-visual; infra (asset build) |
| ws-08 | vyakti-website: `src/components/research/measure.tsx` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Measure component: a number cannot render without n/method/date/source**. Typed props make n, method, date, source required and non-nullable; provenanceLine() renders 'n = .. · method · 18 Aug 2026 · source' inside the same block as the value; one accent number per page; stacked/split variants. | shipped | **copy** | design-system/ux (parent reports, public research/efficacy page) |
| ws-09 | vyakti-website: `src/components/research/evidence-rail.tsx`<br>`src/components/research/status-chip.tsx`<br>`src/components/research/seam-note.tsx`<br>`src/lib/research.ts` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Evidence rail with measured / in_preparation / struck / open states**. Each claim carries its evidence block; a retracted claim renders struck-through with the control that killed it (SeamNote, ember left rule) rather than being deleted; an unmeasured track says so in the same typography. Paper status is an enum (in_preparation..published) so a venue claim can't sneak into a chip. | shipped | **adapt** | design-system/ux (parent report 'what we know / what we are still checking'); growth (efficacy page) |
| ws-10 | vyakti-website: `src/lib/research.ts`<br>`src/lib/paper-body.ts`<br>`src/content/papers/*.md`<br>`src/app/research/papers/[slug]/page.tsx` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Research content module as single source of numbers**. Typed Paper/Result/Rail/Provenance records transcribed character-for-character from a generated content.json; limitations field required and non-empty (page does not build without it); sitemap and pages derive from the module so publishing is a data edit. | shipped | **adapt** | growth/seo (Taxila research/efficacy pages), learning/pedagogy (kit metadata pattern) |
| ws-11 | vyakti-website: `src/components/structured-data.tsx`<br>`src/app/sitemap.ts`<br>`src/app/robots.ts`<br>`src/app/opengraph-image.tsx` (+more) @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Single-graph JSON-LD + metadata routes**. Organization (+alternateName in Devanagari) + WebSite + SoftwareApplication in one @graph with @id cross-references; sitemap derived from content arrays with a fixed honest lastModified; generated OG image and favicon from brand tokens. | shipped | **adapt** | growth/seo |
| ws-12 | vyakti-website: `PROJECT_CONTEXT.md`<br>`docs/PRODUCT_AND_RESEARCH_STANDING.md` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **PROJECT_CONTEXT.md durable narrative + dated decision log**. Durable thesis, audiences, narrative order, visual/motion constraints, proof-and-copy guardrails and a dated decision log including rejections; standing doc defines a cross-repo source-of-truth boundary (site vs product repo) and requires fetching product context before changing claims. | shipped | **idea** | company-brain (Taxila marketing-site context) |
| ws-13 | vyakti-website: `.claude/skills/DESIGN-PRINCIPLES.md`<br>`.claude/skills/emil-design-eng/SKILL.md`<br>`.claude/skills/taste-skill/SKILL.md`<br>`.claude/skills/gsap-framer-scroll-animation/` (+more) @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Design/motion skill pack + DESIGN-PRINCIPLES synthesis**. 579-line synthesis across 12 skills: animate-or-not frequency gate, exact easing curves and decision order, ms duration budgets (UI < 300ms), spring configs, scroll rules (ease:none under scrub), review standards. Same pack (plus Impeccable) is installed in cs-website. | shipped | **copy** | design-system/ux (agent skills for Taxila UI builds) |
| ws-14 | vyakti-website: `PROJECT_CONTEXT.md#website-narrative`<br>`src/app/page.tsx`<br>`src/lib/site.ts` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Homepage narrative sequence + audience ordering**. Audiences ranked (users -> talent -> investors -> press); 8-beat story (tension -> open problem -> formation -> research -> independence -> product -> trust -> invitation); 'should not lead with market size, capability lists, fake metrics, investor language or an API diagram'. Shared copy module (SITE, NAV, FOOTER_GROUPS, PILLARS) so header/footer/pages cannot drift. | shipped | **adapt** | growth/seo (Taxila landing story for parents first, then schools) |
| ws-15 | vyakti-website: `PROJECT_CONTEXT.md#current-product-direction`<br>`src/app/page.tsx`<br>`src/components/home/home.module.css` @claude/vyakti-cloning-platform-aq05n4@4a7cbef | **Rooms boundary model drawn as a figure (structure, not policy)**. Boundary model: creator material flows down to every room; a follower's words stay in a private scope enforced at write time, never sideways to another follower; the creator sees themes only as counts, never names or verbatim; export/delete everything. Rendered as a static editorial figure, readiness described in words, never a mock number or invented screenshot. | shipped | **adapt** | safety-floor/honesty; relational-os; auth/accounts/consent (parent vs child vs teacher visibility) |
| ws-16 | vyakti-website: `src/lib/site.ts`<br>`src/components/site-header.tsx`<br>`src/app/company/page.tsx` @claude/vyakti-cloning-platform-aq05n4@4a7cbef | **Honest single CTA (prefilled mailto because there is no backend)**. One label for one intent everywhere (header, hero, apply, company, /meera); application is three questions in a prefilled mail draft because 'a form that pretends otherwise would be the first dishonest thing on the site'. | shipped | **idea** | growth/seo (waitlist before backend exists) |
| ws-17 | vyakti-website: `PROJECT_CONTEXT.md#proof-and-copy-guardrails`<br>`src/lib/research.ts (header comment)` @claude/vyakti-cloning-platform-aq05n4@4a7cbef | **Copy laws and vocabulary rules**. Distinguish shipped / active research / ambition; never invent user counts, scores, logos, quotes, funding; no em/en dashes in authored copy (scholarly verbatim excepted); 'Always AI'; vocabulary bans (clone/model/replica in user copy). | shipped | **copy** | safety-floor/honesty; growth/seo copy |
| ws-18 | vyakti-website: `src/components/meera/index.tsx`<br>`src/components/meera/meera-portrait.module.css` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Responsive portrait component with per-viewport compositions**. Square editorial portrait contained without crop below the fixed header with dedicated portrait / tablet / short-landscape compositions; compositor transforms instead of repainted clip-path scrubs. | shipped | **adapt** | avatar-visual (2D tutor portrait fallback), design-system/ux |
| ws-19 | vyakti-website: `src/components/face-lab/`<br>`src/components/ink-lab/`<br>`src/components/noor-study/`<br>`public/models/ink-lab/*.glb` (+more) @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Face/ink-lab GNM identity studies (8 generated heads, shader studies)**. Exploration routes (noindexed by policy): particle/ink shader treatments over 8 GNM identities, contact-sheet renderer, Noor study runtime (progress, velocity, pointer, invalidate). | prototype | **idea** | avatar-visual |
| ws-20 | vyakti-website: `docs/research/rumik-teardown.md`<br>`docs/research/competitive-landscape.md` @claude/vyakti-research-website-a47qnq@904b370 (identical to codex/vyakti-rebuild@904b370) | **Competitor teardown docs (Rumik/Ira, 15+ voice/avatar companies)**. Forensic teardown of rumik.ai (tokens, IA, verbatim copy, motion) and a landscape of Sesame, Hume, ElevenLabs, Cartesia, Character.AI, Inworld, Tavus, Synthesia, HeyGen etc. plus lab-site IA patterns and a human-likeness eval glossary. | spec-only | **idea** | growth/seo (positioning research method) |
| ws-21 | cs-website: `scripts_automation/generate_blog.py`<br>`.automation_state.json`<br>`src/content/blog/slugs-manifest.json` @claude/seo-phase1-lead-pages@27781178 | **Daily SEO article generator with stable slugs and update-in-place**. Python generator: slug = slugify(topic) only (no date/timestamp); topic_already_published() checks legacy stems, manifest history and >80% title-token overlap (deliberately aggressive); when the pool is exhausted it refreshes the least-recently-touched priority post IN PLACE (same slug, original date, updated: stamped); create opens with mode 'x' so overwrite is impossible; --dry-run needs no key or deps; throttled to 1 post/day; restricted to CI. | shipped-measured | **adapt** | growth/seo (Taxila parent-question articles); generative-ui/modules (guard pattern for any LLM content writer) |
| ws-22 | cs-website: `scripts_automation/generate_blog.py#normalise_generated_post`<br>`scripts/blog-links.mjs`<br>`scripts/blog-internal-links.json`<br>`scripts/repair-blog-posts.mjs` @claude/seo-phase1-lead-pages@27781178 | **Generated-content post-processor (fences, placeholder, H1, link validation/injection)**. strip_code_fences, MULTILINE frontmatter split, refuse to write when description equals placeholder, drop duplicate H1, validate_internal_links rewrites known invented routes and unwraps any link not in the real route set, inject 3-5 contextual pillar links on eligible lines (protects code/links/math). repair-blog-posts.mjs applies the same to the existing corpus. | shipped-measured | **copy** | evals/gates/verification (Forge output sanitiser); growth/seo |
| ws-23 | cs-website: `scripts/verify-blog-posts.mjs` @claude/seo-phase1-lead-pages@27781178 | **Corpus lint: verify-blog-posts.mjs with banned-phrase regexes**. Per-post checks: frontmatter parses (gray-matter), title/date present, no body H1, description 100-170 chars, no leading fence, no duplicate frontmatter, every internal link resolves, BANNED regex list (superlatives, 'we verify', expired offer strings, retired routes), coverage stats; --strict exits 1. | shipped | **copy** | evals/gates/verification (lint every generated lesson/module/article against banned register and claims) |
| ws-24 | cs-website: `scripts/check-blog-slugs.mjs`<br>`src/content/blog/slugs-manifest.json`<br>`package.json (build script)` @claude/seo-phase1-lead-pages@27781178 | **Slug-manifest build guard (a published URL may never 404)**. Mirrors resolveBlogSlugAlias() and fails `npm run build` if any manifest slug stops resolving (live post or 308 alias) or a live post is missing from the manifest; --seed; <1s, no network. | shipped-measured | **copy** | evals/gates/verification; growth/seo |
| ws-25 | cs-website: `src/lib/blog.ts#resolveBlogSlugAlias`<br>`src/app/blog/[slug]/page.tsx` @claude/seo-phase1-lead-pages@27781178 | **308 slug-alias resolver**. Before 404: stem match (date prefix / unix suffix stripped), explicit recovered-N consolidation, title match for de-duplicated files -> permanentRedirect(308). Junk slugs still 404 (no soft-404). | shipped-measured | **adapt** | growth/seo |
| ws-26 | cs-website: `src/lib/blog.ts#assertNoDuplicateTitles` @f5d17222 | **Build-time duplicate-title guard**. getBlogPosts() normalises every title and throws on collision in production builds (warns in dev). | shipped | **copy** | evals/gates/verification (duplicate module/kit titles) |
| ws-27 | cs-website: `.github/workflows/blog-automation.yml` @claude/seo-phase1-lead-pages@27781178 | **GitHub Actions daily content cron with IndexNow ping**. cron 09:00 UTC, pull --rebase, run generator, commit only src/content/blog + state, rebase again, push, then sleep 180s and ping IndexNow non-fatally. Keys referenced only as repo secrets. | shipped | **adapt** | infra/azure/vercel/deploy (Taxila: ACR builds from GitHub; content job can stay a GH Action calling Azure OpenAI or move to an Azure Container Apps job) |
| ws-28 | cs-website: `scripts/indexnow-submit.mjs`<br>`public/<indexnow-key>.txt`<br>`package.json (postbuild)` @main@27d3ee00 | **IndexNow submitter wired to postbuild, never throws**. --all (sitemap), --changed (git diff of src/content/blog AND src/app/<route>/page.tsx mapped to live URLs, dynamic/preview/dashboard skipped), --urls; never throws on shallow checkouts; postbuild guarded with `\|\| exit 0`. Key is a public domain-verification key by design. | shipped | **copy** | growth/seo (Bing feeds ChatGPT/Copilot answers) |
| ws-29 | cs-website: `src/app/sitemap.ts` @claude/seo-phase1-lead-pages@27781178 | **Honest sitemap: lastmod from file mtime, capped blog set**. lastModified from fs.statSync(renderingFile).mtime instead of new Date() (Google stops trusting lastmod that always equals crawl date); blog lastmod uses frontmatter updated\|\|date; programmatic pages excluded; core commercial routes prioritised. | shipped | **copy** | growth/seo |
| ws-30 | cs-website: `public/llms.txt`<br>`public/llms-full.txt` @claude/seo-phase1-lead-pages@27781178 | **llms.txt / llms-full.txt answer-engine files**. Curated entity description, current offer, dated key facts with sources/numbers, and annotated links to core, language and commercial pages for AI crawlers. | shipped-measured | **adapt** | growth/seo (AEO for parent questions like 'best AI tutor for class 5 CBSE Hindi') |
| ws-31 | cs-website: `src/app/cbam-guide-hindi/page.tsx`<br>`src/app/cbam-guide-gujarati/page.tsx`<br>`src/app/cbam-guide-tamil/page.tsx`<br>`src/app/cbam-guide-telugu/page.tsx` (+more) @claude/seo-phase1-lead-pages@27781178 | **Six-language hreflang guide cluster with x-default**. Native-script guides with metadata.alternates.languages (incl. x-default -> English), <div lang='hi'>, transliterated query targets ('cbam kya hai'); Hindi brought to parity with English (6a30986d); capture labels localisable. | shipped | **adapt** | growth/seo; learning/pedagogy (Hindi/regional parent pages) |
| ws-32 | cs-website: `src/components/analytics/tracker.ts`<br>`src/components/analytics/identity.ts`<br>`src/components/analytics/FirstPartyTracker.tsx` @claude/seo-phase1-lead-pages@27781178 | **First-party analytics tracker (batched beacon, identity, engagement)**. Visitor id (localStorage) + GA4-style 30-min inactivity session; queue flushed every 8s or at 30 events via navigator.sendBeacon with text/plain Blob (no CORS preflight); session_start context (viewport, dpr, lang, tz, connection, memory); scroll milestones; 15s engaged-time heartbeat counting only visible time; page_exit/session_end on pagehide; UTM + cs_ref attribution; every entry point try/catch so tracking never blocks render; internal/staff + localhost/LAN/*.vercel.app suppression via ?cs_staff=1 flag. | shipped-measured | **adapt** | telemetry/tracing (marketing site and parent app; NOT child lesson surfaces without DPDP consent design) |
| ws-33 | cs-website: `src/components/analytics/signals.ts` @claude/seo-phase1-lead-pages@27781178 | **Deep behavioural signals (section read-rate, dwell, rage/dead clicks, vitals, errors)**. web-vitals LCP/CLS/INP/FCP/TTFB; rage clicks (3 in 1s within 30px); dead clicks (non-interactive click with no DOM mutation/nav/scroll); auto section_view + section_dwell for every section/article/[id] block; accordion toggles; declarative [data-cs-event] + data-cs-* metadata; copy length only; JS errors truncated; ChunkLoadError one-shot self-heal reload (max 1 per 30s); first-interaction latency. Form-submit value harvesting of non-sensitive fields. | shipped-measured | **adapt** | telemetry/tracing; evals (UX dead-end detection in the lesson UI) |
| ws-34 | cs-website: `src/components/analytics/PostHogInit.tsx`<br>`src/components/analytics/GoogleAnalytics.tsx` @claude/seo-phase1-lead-pages@27781178 | **PostHog session replay + GA4**. PostHog with session recording on and 'no opt-out', distinct id tied to first-party visitor id; GA4 tag. | shipped | **skip** | telemetry/tracing |
| ws-35 | cs-website: `src/app/api/contact/route.ts` @claude/seo-phase1-lead-pages@27781178 | **Contact API: two durable channels with retry, fail only if both fail**. Accepts email OR phone; withRetry(fn, label, 3) around CRM mirror (structured store) and lead email; user sees failure only when both durable channels failed - never silently drops a submission. | shipped | **copy** | auth/accounts/consent (parent sign-up / callback requests); infra |
| ws-36 | cs-website: `src/lib/contact-detect.ts`<br>`src/components/LeadCaptureInline.tsx`<br>`src/components/home/CalculatorLeadCapture.tsx` @claude/seo-phase1-lead-pages@27781178 | **One-field phone-or-email capture with +91 normalisation and WhatsApp deep link**. Detects email vs phone, normalises Indian 10-digit mobiles (6-9 leading) to +91, stable per-visitor capture key, CRM ingest beacon, wa.me link with prefilled text; shared by every capture surface. | shipped-measured | **copy** | growth/seo; auth/accounts/consent (parent onboarding by phone/WhatsApp) |
| ws-37 | cs-website: `src/lib/offer.ts` @claude/seo-phase1-lead-pages@27781178 | **Offer copy single source of truth**. All offer strings and deadlines in one module consumed by modal, calculator, CTA, OG image, JSON-LD and llms.txt; deadline variants later removed entirely ('first report free', no date). | shipped | **idea** | growth/seo (pricing/trial copy) |
| ws-38 | cs-website: `src/proxy.ts`<br>`next.config.ts#headers` @claude/seo-phase1-lead-pages@27781178 | **Security headers + CSP middleware with next.config fallback**. www->apex 301; X-Frame-Options DENY, nosniff, strict-origin-when-cross-origin, HSTS preload, Permissions-Policy, explicit CSP allowlist; headers duplicated in next.config as fallback. | shipped | **adapt** | infra/azure/vercel/deploy |
| ws-39 | cs-website: `next.config.ts#images` @claude/seo-phase1-lead-pages@27781178 | **Image pipeline config: AVIF first, 31-day edge cache, trimmed size ladder**. formats avif,webp; minimumCacheTTL 2678400; deviceSizes 360..1920; imageSizes 16..384; plus manual PNG->WebP recompression. | shipped-measured | **adapt** | infra (static asset pipeline on Azure Storage/CDN) |
| ws-40 | cs-website: `src/components/RevealController.tsx`<br>`src/components/MotionProvider.tsx` @claude/seo-phase1-lead-pages@27781178 | **RevealController: pre-fire rootMargin + safety timeout**. Layout-effect adds cs-reveal to every main section client-side only (SSR renders visible), rootMargin '0px 0px 220px 0px' threshold 0 so sections reveal before the eye arrives, immediate reveal for anything above vh+220, 1600ms safety timeout forces all visible; MotionProvider wraps the app in MotionConfig reducedMotion='user'. | shipped | **copy** | design-system/ux |
| ws-41 | cs-website: `src/components/Jargon.tsx`<br>`src/app/glossary/page.tsx` @claude/seo-phase1-lead-pages@27781178 | **Jargon: CSS-only accessible glossary tooltip**. TERMS map; hover/focus on desktop, tap-to-focus (tabIndex) on touch, aria-describedby for screen readers, links to /glossary; no state, no library. | shipped | **adapt** | learning/pedagogy/curriculum (child vocabulary pop-ups in lesson text and parent reports) |
| ws-42 | cs-website: `src/lib/blog.ts#extractFaq`<br>`src/components/blog/FaqAccordion.tsx` @claude/seo-phase1-lead-pages@27781178 | **FAQ extraction -> accessible accordion + schema in sync**. Parses '**Q:**/A:' and '### Question' formats (334/335 posts), removes the section from the body, renders <details>/<summary>, reuses the same pairs for FAQPage JSON-LD; conservative (<2 pairs leaves body untouched). | shipped-measured | **adapt** | growth/seo |
| ws-43 | cs-website: `src/components/home/ShipScrollSection.tsx` @claude/seo-phase1-lead-pages@27781178 | **Pinned scroll scene on one deterministic timeline (framer useScroll)**. 300vh pinned section, single scrollYProgress drives backdrop, ship, wake, sun, birds and text beats via useTransform; no springs; single optimised text shadows instead of filter drop-shadow; radial gradients instead of filter:blur. | shipped | **idea** | generative-ui/modules (scroll-scrubbed science animations) |
| ws-44 | cs-website: `src/components/Navbar.tsx` @f5d17222 + 271f6c5d | **Navbar: rAF-throttled scroll + opacity crossfade background layers**. Scroll listener bounded to one rAF per frame with cached [data-dark-nav] queries (MutationObserver re-query); theme switch via two stacked absolute backgrounds crossfading opacity over 300ms because class-swapped gradients cannot interpolate. | shipped | **copy** | design-system/ux |
| ws-45 | cs-website: `.claude/skills/impeccable/SKILL.md`<br>`.claude/skills/impeccable/reference/*.md`<br>`.claude/skills/impeccable/scripts/detect.mjs`<br>`PRODUCT.md` (+more) @claude/carbonsettle-importer-redesign-e3dpci@ba6be984 | **Impeccable skill + anti-pattern detector, PRODUCT.md/DESIGN.md context**. Impeccable v4.0.2 (craft floor, audit, typeset, layout, android/ios references) with a CLI detector (`npx impeccable detect <files>`); PRODUCT.md names users/ICPs, mode (Persuade/Read), voice, hard guardrails, anti-references; DESIGN.md records incumbent tokens and traps. | shipped | **copy** | design-system/ux (agent UI verification gate); android/capacitor (reference/android.md) |
| ws-46 | cs-website: `docs/homepage-skill-pass-2026-07-25.md` @claude/carbonsettle-importer-redesign-e3dpci@ba6be984 | **Binding skill-pass brief (taste pre-flight rules for agent workers)**. Mechanically checkable rules: zero em/en dashes, max 4 kickers for 13 sections, no scroll cues, no decorative dots, no middle-dot chains, hero <= 4 text elements, pressables active:scale-[0.97] property-scoped 150ms, never animate from scale(0), stagger 30-80ms, exits faster than enters, only transform+opacity; verification = tsc + eslint + impeccable detect + screenshots at 1440x900 and 390x844 with an edit->reshoot loop. | shipped | **adapt** | design-system/ux; evals/gates/verification (UI review gate for Taxila build agents) |
| ws-47 | cs-website: `src/lib/assistant/knowledge.ts`<br>`src/app/api/assistant/route.ts`<br>`src/components/assistant/MitraChat.tsx` @claude/carbonsettle-importer-redesign-e3dpci@ba6be984 | **Mitra: grounded site-assistant knowledge contract + streaming proxy**. System prompt as a single verified-facts module with an 'Honest boundaries' section (not a verifier, no registry API, not legal advice, never invent clients); route streams OpenRouter SSE re-emitted as plain text deltas with an ordered model fallback list and max_tokens cap. | prototype | **idea** | prompt-compiler/persona-engineering (parent-help assistant on the marketing site) |
| ws-48 | cs-website: `src/app/cbam-tax-calculator/CalculatorTool.tsx`<br>`src/components/SavingsCheckTool.tsx`<br>`src/components/home/CalculatorLeadCapture.tsx`<br>`src/app/cbam-savings-check/page.tsx` @claude/seo-phase1-lead-pages@27781178 | **Calculator / savings-check lead magnet fused to the result**. Free tool as the top engagement asset; capture form visually fused to the result card so the ask is seen with the number; indexed + schema'd tool page; organic pages funnel into it. | shipped-measured | **idea** | growth/seo (free 'how does my child learn best' check for parents) |
| ws-49 | cs-website: `scripts/build-reply-pack.mjs`<br>`src/content/downloads/cbam-buyer-reply-pack.html`<br>`src/app/eu-buyer-asked-for-cbam-data/ReplyPackCapture.tsx` @claude/seo-phase1-lead-pages@27781178 | **Gated downloadable pack built from HTML**. HTML source rendered to a PDF lead magnet at build time and gated behind the one-field capture. | shipped | **idea** | growth/seo (printable worksheets / parent guides) |
| ws-50 | cs-website: `src/components/EmissionGapChart.tsx`<br>`src/components/CBAMFlowDiagram.tsx`<br>`src/components/PlatformModesDiagram.tsx`<br>`src/components/GuideTimeline.tsx` (+more) @claude/seo-phase1-lead-pages@27781178 | **Inline data visuals in articles (gap chart, flow diagrams, timelines)**. Topic-matched SVG/CSS visuals injected into long-form posts; CSS-only 3-step strips that stack at 390px; zero new JS libraries. | shipped | **idea** | generative-ui/modules (diagram library for Forge) |
| ws-51 | cs-website: `src/lib/pseo-data.ts`<br>`src/lib/city-pages-north.ts`<br>`src/lib/city-pages-west-south.ts`<br>`src/app/cbam-impact/[industry]/[location]/page.tsx` (+more) @claude/seo-phase1-lead-pages@27781178 | **Programmatic city/sector/language landers with noindex policy**. Hand-written city pages for real clusters are indexed; 5x20 template-generated pages are robots noindex,follow until each has substantive unique content. | shipped | **adapt** | growth/seo (board x class x subject x city pages for Taxila, only with unique content) |
| ws-52 | cs-website: `docs/website-domination-analysis.md`<br>`docs/website-domination-report.md`<br>`GOOGLE_SEARCH_CONSOLE_GUIDE.md`<br>`OFF_PAGE_SEO_BLUEPRINT.md` (+more) @claude/seo-phase1-lead-pages@27781178 | **SEO diagnosis method (GSC + first-party + proposal funnel + SERP)**. 90d GSC table by query/position, striking-distance list (pos 8-20), dead-URL audit, de-botted first-party KPIs, campaign funnel, competitor format analysis, prioritised plan, human TODOs; CTR surgery on titles of pages already earning impressions. | shipped-measured | **idea** | growth/seo |
| ws-53 | cs-website: `wikidata_carbonsettle_entity.csv`<br>`src/app/layout.tsx (JSON-LD)` @claude/seo-phase1-lead-pages@27781178 | **Wikidata entity + Organization sameAs**. Wikidata item created and linked via sameAs; founder Person entity; capability-framed About JSON-LD. | shipped | **idea** | growth/seo (entity for Taxila brand) |

### Asset notes and evidence

- **ws-01 Editorial light-theme token set (Tailwind v4 @theme)**. Evidence: Shipped on vyakti.ai; verified at 390x844 and desktop per PROJECT_CONTEXT 2026-08-14. Note: Swap palette for Taxila brand (child-friendly but not toy-like); keep the semantic-name indirection, fluid scale and easing/duration tokens. No dark mode in source (light-only by decision); Taxila needs a dark token set too.
- **ws-02 Reveal-once IntersectionObserver with index stagger**. Evidence: Decision log 2026-08-22: reduced generic reveal motion on desktop and disabled it on touch for a fast stable reading experience.
- **ws-04 Mobile scroll-story performance fix (native progress, direct style writes)**. Evidence: PROJECT_CONTEXT decision log 2026-08-24 (no numeric fps measurement recorded).
- **ws-05 R3F canvas budget + geometry-stable WebGL fallback + dots-only first paint**. Evidence: Particle/DPR numbers from commit 904b370; no frame-time measurement in repo. Note: Directly relevant to the selectable 3D tutor: on-demand rendering, DPR caps and context-loss fallback are the right defaults for budget Android WebView.
- **ws-06 Deterministic viseme keyframes + semantic oral rig weights**. Evidence: Visual review only (decision log 2026-08-22 removed a dark lip artifact); no lip-sync accuracy metric. Note: For Taxila the viseme stream must come from real TTS/realtime audio timing (Azure viseme events), not a fixed table; the semantic-rig idea (named-region weights baked offline, single shader transform) carries over.
- **ws-07 Reproducible, hash-pinned 3D asset pipeline**. Evidence: 324 KB -> 75 KB with no visible difference at point-cloud scale (commit e91ab0b); 2.9 MB -> 324 KB by shipping only the loaded model (94cca19).
- **ws-08 Measure component: a number cannot render without n/method/date/source**. Note: Exactly the rule Taxila's context/measurements.md enforces, moved into UI. Use for any learning-outcome number shown to parents or schools.
- **ws-09 Evidence rail with measured / in_preparation / struck / open states**. Note: Maps to Taxila covert-comprehension output: show confidence state honestly instead of a fake mastery percentage.
- **ws-11 Single-graph JSON-LD + metadata routes**. Note: Next.js metadata routes; Taxila is Vite, so port as a build-time script emitting sitemap.xml/robots.txt/JSON-LD.
- **ws-12 PROJECT_CONTEXT.md durable narrative + dated decision log**. Note: Taxila already has context/; adopt the cross-repo 'fetch product context before making a public claim' rule for the marketing site.
- **ws-15 Rooms boundary model drawn as a figure (structure, not policy)**. Note: Taxila analogue: content flows down from kits to every child; siblings never see each other; a school/teacher sees aggregates; parents see the child's learning but the child's private disclosures route through the safeguarding hand-off, not a transcript dump. Draw it on the parent page.
- **ws-18 Responsive portrait component with per-viewport compositions**. Evidence: Checked at 390x844, 430x932, 768x1024, 844x390, 1280x720, 1440x900 (decision log 2026-08-22).
- **ws-19 Face/ink-lab GNM identity studies (8 generated heads, shader studies)**. Note: Adult identities; not usable as child-tutor faces, but the contact-sheet review loop is a good art-direction process.
- **ws-21 Daily SEO article generator with stable slugs and update-in-place**. Evidence: Sandboxed e2e run with faked client: create, same-day throttle, next-day new topic, exhausted-pool update-in-place, overwrite guard (docs/blog-automation-fix.md, 2026-07-03). Note: Provider must become Azure OpenAI (source uses OpenRouter google/gemini-2.5-flash or gpt-4o-mini).
- **ws-22 Generated-content post-processor (fences, placeholder, H1, link validation/injection)**. Evidence: Corpus repair 2026-09-04: 354 posts, 17 structural repairs, 150 superlative replacements, 7 invented routes fixed, 1,445 links injected, posts with >=2 internal links 50 -> 354 (commit 555e6f8a).
- **ws-24 Slug-manifest build guard (a published URL may never 404)**. Evidence: 443 manifest entries (302 live + 141 recovered from git history) all resolve (2026-07-03).
- **ws-25 308 slug-alias resolver**. Evidence: All 10 known dead URLs 308 to canonical on prod; reclaims ~65% of 90d impressions that were landing on 404 (5b485833, report 2026-07-03).
- **ws-27 GitHub Actions daily content cron with IndexNow ping**. Evidence: Silent failure observed: OpenAI quota died and the daily post silently stopped after 2026-06-30 (workflow comment).
- **ws-28 IndexNow submitter wired to postbuild, never throws**. Evidence: Full sitemap 177 URLs submitted HTTP 200 (b8b4e691, 2026-09-05).
- **ws-29 Honest sitemap: lastmod from file mtime, capped blog set**. Note: Drift bug: the comment says 30 most recent posts but the code slices 100.
- **ws-30 llms.txt / llms-full.txt answer-engine files**. Evidence: AI answer engines already referring visitors: gemini.google.com 6, chatgpt.com 6 sessions in 90d (website-domination-analysis 2026-07-03).
- **ws-32 First-party analytics tracker (batched beacon, identity, engagement)**. Evidence: Insert-side verified: site_events receiving pageview/section_view/web_vital/session events from real browsers; synthetic curl 204 but filtered at ingest (report 2026-07-03). Note: Collector backend (pdf.carbonsettle.com/collect) lives in another repo, not read.
- **ws-33 Deep behavioural signals (section read-rate, dwell, rage/dead clicks, vitals, errors)**. Evidence: Dead-click signal found 151 dead clicks on one post's FAQ paragraph (1af018d3); section read-rates showed 4/10 calculator viewers reached a detached form and pricing readers 75% read-to-100% (2011780a). Note: Strip harvestFormValues and any free-text capture for Taxila child surfaces; keep counts/timings only.
- **ws-34 PostHog session replay + GA4**. Note: Third-party analytics and session replay of children violate the Azure-only directive and the child-safety floor; do not port.
- **ws-35 Contact API: two durable channels with retry, fail only if both fail**. Evidence: Real complete submissions mirrored to website_leads since June (report 2026-07-03).
- **ws-36 One-field phone-or-email capture with +91 normalisation and WhatsApp deep link**. Evidence: Collapsing a 3-field calculator form to 1 field was the fix for a #1-engagement tool that 'captured nobody' (74a928b9); no post-change conversion number recorded.
- **ws-38 Security headers + CSP middleware with next.config fallback**. Note: Must change for Taxila: Permissions-Policy there sets microphone=() and camera=() which would break voice lessons; use microphone=(self), add Azure realtime/WebRTC hosts to connect-src, drop unsafe-eval.
- **ws-39 Image pipeline config: AVIF first, 31-day edge cache, trimmed size ladder**. Evidence: port-v2.png 1.9 MB -> 158 KB WebP; ship section 3.0 MB -> 0.27 MB (271f6c5d); return traffic ~20% of real visitors (config comment).
- **ws-40 RevealController: pre-fire rootMargin + safety timeout**. Evidence: Commit ad4534fa: '0 stuck reveals' after fix (manual).
- **ws-42 FAQ extraction -> accessible accordion + schema in sync**. Evidence: Fix for 151 dead clicks on one post (1af018d3).
- **ws-45 Impeccable skill + anti-pattern detector, PRODUCT.md/DESIGN.md context**. Note: Branch unmerged into main; the skill itself is independent of the redesign outcome.
- **ws-47 Mitra: grounded site-assistant knowledge contract + streaming proxy**. Note: Provider skip (OpenRouter is not allowed under the Azure-only directive). The facts are also sentence-shaped prose that will be recited, which conflicts with the inherited 'write shapes, not lines' law.
- **ws-48 Calculator / savings-check lead magnet fused to the result**. Evidence: Only 4/10 calculator viewers scrolled to the detached form before the fusion (2011780a; n not recorded).


## 3. Key code excerpts worth porting

Short, verbatim, no secrets.

### 3.1 Touch layouts must not scrub (vyakti-website `src/components/home/relational-story.tsx@904b370`)

```ts
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
  // Mobile browser chrome changes the visual viewport while a swipe is still
  // moving. Refreshing trigger geometry for those small resizes causes jumps.
  ScrollTrigger.config({ ignoreMobileResize: true });
}
...
if (touchLayout) {
  // Native touch scrolling already supplies momentum. A second scrub
  // tween makes the scene trail the finger and continue after release.
  trigger = ScrollTrigger.create({
    ...triggerConfig,
    onUpdate: (self) => update(self.progress, self.getVelocity()),
  });
} else {
  const progress = { value: 0 };
  tween = gsap.to(progress, { value: 0.99999, ease: "none",
    onUpdate: () => update(progress.value, trigger?.getVelocity() ?? 0) });
  trigger = ScrollTrigger.create({ ...triggerConfig, animation: tween, scrub: true });
}
```

and inside `update()` the per-frame writes skip chapters that were already hidden:

```ts
const visible = opacity > 0;
if (!visible && chapterWasVisible[index] === false) return;
chapter.style.opacity = String(opacity);
chapter.style.visibility = visible ? "visible" : "hidden";
chapter.style.transform = `translate3d(0, ${direction * (1 - opacity) * 16}px, 0)`;
```

### 3.2 Canvas budget (vyakti-website `src/components/home/relational-story-canvas.tsx@904b370`)

```tsx
<Canvas
  frameloop="demand"
  camera={{ position: [0, 0, 4.12], fov: 37, near: 0.1, far: 20 }}
  dpr={[1, 1.25]}
  gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
```

```ts
const points = useMemo(
  () => (noor ? makePointGeometry(noor.face, compact ? 4_800 : 14_000) : null),
  [compact, noor],
);
// ...
canvas.addEventListener("webglcontextlost", lost); // swaps only the visual layer
```

### 3.3 Viseme keyframe sampler (same file)

```ts
const VISEME_KEYS = [            // [t, open, wide, round]
  [0, 0, 0, 0], [0.12, 0, 0, 0.85], [0.26, 0.55, 0, 0], [0.41, 0.05, 0.85, 0],
  [0.58, 0.88, 0, 0], [0.73, 0.4, 0.08, 0], [0.88, 0, 0, 0.65], [1, 0, 0, 0],
] as const;
function sampleViseme(progress: number, target: THREE.Vector3) {
  const value = THREE.MathUtils.clamp(progress, 0, 1);
  for (let index = 0; index < VISEME_KEYS.length - 1; index += 1) {
    const from = VISEME_KEYS[index]; const to = VISEME_KEYS[index + 1];
    if (value > to[0]) continue;
    const raw = THREE.MathUtils.clamp((value - from[0]) / Math.max(to[0] - from[0], 0.0001), 0, 1);
    const mix = raw * raw * (3 - 2 * raw);
    return target.set(THREE.MathUtils.lerp(from[1], to[1], mix),
      THREE.MathUtils.lerp(from[2], to[2], mix), THREE.MathUtils.lerp(from[3], to[3], mix));
  }
  return target.set(0, 0, 0);
}
```

Taxila adaptation: replace the fixed table with Azure TTS / realtime viseme events mapped onto the same 3-channel uniform; keep the speech clock time-based (`speechClock.elapsed += Math.min(delta, 0.05)`) so UI pauses never freeze the mouth.

### 3.4 A number cannot render without its provenance (vyakti-website `src/components/research/measure.tsx@904b370`)

```ts
/**
 * `n`, `method`, `date` and `source` are required and non-nullable, so a
 * number cannot reach the page without the line that makes it comparable to a
 * future re-measurement.
 */
export type MeasureProps = { value: string; n: string; method: string; date: string; source: string; /* ... */ };

export function provenanceLine({ n, method, date, source }: {...}): string {
  return `n = ${n} · ${method} · ${formatDate(date)} · ${source}`;
}
```

### 3.5 Reveal once (vyakti-website `src/components/reveal.tsx@904b370`)

```ts
/**
 * Elements reveal once and stay revealed. Re-animating on scroll-back is the
 * single most reliable tell of a template.
 */
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const el = entry.target as HTMLElement;
    el.style.setProperty("--reveal-delay", `${(Number(el.dataset.reveal) || 0) * 80}ms`);
    el.classList.add("is-revealed");
    observer.unobserve(el);
  }
}, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
```

with the CSS kill-switch on touch (`src/app/globals.css`):

```css
@media (hover: none), (pointer: coarse) {
  [data-reveal] { opacity: 1; transform: none; transition: none; }
}
```

### 3.6 Topic-only slugs and an aggressive "ever published" check (cs-website `scripts_automation/generate_blog.py@27781178`)

```python
def topic_already_published(topic, published_stems, existing_titles):
    """True when this topic was EVER published, under any historical naming
    scheme. Deliberately aggressive: a false positive merely skips one topic;
    a false negative recreates the duplicate/re-dating incident."""
    full = slugify(topic)
    for st in published_stems:
        if st == full:
            return True
        # Legacy filenames truncated the slug at 50-60 chars, often mid-word.
        if len(st) >= 40 and (full.startswith(st) or st.startswith(full)):
            return True
    topic_tokens = set(normalise_title(topic).split())
    for title in existing_titles:
        title_tokens = set(title.split())
        if title_tokens and len(topic_tokens & title_tokens) / len(topic_tokens) > 0.8:
            return True
    return False
```

### 3.7 Link validation by predicate (same file)

```python
def validate_internal_links(body, routes):
    """Rewrite the known invented routes; unwrap any other internal link that
    does not resolve to a real route (keeps the anchor text as plain text)."""
    def _fix(m):
        bang, text, href = m.group(1), m.group(2), m.group(3)
        if bang or not href.startswith("/"):
            return m.group(0)
        norm = normalise_href(href)
        if norm in INVENTED_ROUTES:
            return f"[{text}]({INVENTED_ROUTES[norm]})"
        if norm not in routes:
            return text
        return m.group(0)
    return _LINK_RE.sub(_fix, body), dropped, fixed
```

Worth noting: the same file's system prompt still instructs the model to link the retired `/cbam-service-india`. Only the validator stops it reaching the page. That is the "safety by predicate, not instruction" law shown in a second codebase.

### 3.8 Corpus lint (cs-website `scripts/verify-blog-posts.mjs@27781178`)

```js
const BANNED = [
  /India['’]s\s+(?:#\s?1|no\.?\s?1|number one|leading|premier|best|most advanced|top|foremost)\b/i,
  /\bpremier\b/i, /\bmost advanced\b/i, /\bwe verify\b/i, /EU-ready verified/i,
  /free this quarter/i, /(?:April|Apr)\s*[–-]\s*(?:June|Jun) 2026/, /30 September 2026/,
  /\/cbam-compliance-service-india|\/cbam-compliance-india\b|\/cbam-service-india\b/,
];
...
if (/^\s*```/.test(content)) fail('starts with a code fence');
if (/^\s*---\r?\n[\s\S]*?\r?\n---/.test(content)) fail('duplicate frontmatter block in body');
```

Taxila equivalent: a `BANNED` list for teacher utterances and Forge modules (romance/companion register, denial of being an AI, test-like quizzing phrasing, invented NCERT facts) applied as a gate.

### 3.9 Build guard (cs-website `package.json@27781178`)

```json
"build": "node scripts/check-blog-slugs.mjs && next build",
```

plus IndexNow on `main@27d3ee00`, which must never fail a deploy:

```js
// Never throws. On Vercel the checkout can be shallow (no HEAD~1) and a
// failed notification must never fail a deploy.
try {
  out = execSync("git diff --name-status HEAD~1 HEAD -- src/content/blog src/app", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
} catch { console.log("IndexNow: no usable git history for --changed, skipping."); return []; }
```

### 3.10 Honest sitemap lastmod (cs-website `src/app/sitemap.ts@27781178`)

```ts
// This used to be `new Date()`, which re-stamped all 123 URLs as "modified
// today" on every deploy. Google detects a sitemap whose lastmod always equals
// the crawl date and stops trusting the field altogether.
function routeLastModified(relFile: string): Date {
  try { return fs.statSync(path.join(process.cwd(), relFile)).mtime } catch { return new Date() }
}
```

(Bug to avoid when porting: the comment above the blog block says "30 most recent" but the code does `.slice(0, 100)`.)

### 3.11 First-party tracker essentials (cs-website `src/components/analytics/*@27781178`)

```ts
const FLUSH_INTERVAL_MS = 8000;
const MAX_QUEUE = 30;        // safety flush so the batch never grows unbounded
const HEARTBEAT_MS = 15000;  // engaged-time ping cadence
// text/plain Blob so sendBeacon to another origin needs no CORS preflight
navigator.sendBeacon(COLLECT_ENDPOINT, new Blob([body], { type: "text/plain" }));
```

```ts
// identity.ts: GA4-style session, rotates after 30 min idle
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
if (!id || !last || now - last > SESSION_TIMEOUT_MS) { id = uuid(); isNew = true; localStorage.setItem("cs_ses", id); }
```

```ts
// signals.ts: stale deploy self-heal, guarded so it can never loop
const CHUNK_ERR_RE = /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|error loading dynamically imported module/i;
function recoverFromStaleChunk() {
  const KEY = "cs.chunkReloadAt";
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last < 30_000) return; // at most one auto-reload / 30s
  sessionStorage.setItem(KEY, String(Date.now()));
  location.reload();
}
```

The stale-chunk recovery is directly useful for Taxila's SPA after every Azure deploy. For any surface a child uses, drop `harvestFormValues`, keep events to counts and timings, and route them to Taxila's own Azure collector. PostHog session replay ("no opt-out") must not be ported.

### 3.12 Reveal safety net (cs-website `src/components/RevealController.tsx@27781178`)

```ts
// Fire ~220px BEFORE a section enters the viewport ... at the first pixel
{ threshold: 0, rootMargin: "0px 0px 220px 0px" }
// Safety net: if the observer ever misses (rapid scroll, tab restore,
// throttled callback), force every still-hidden section visible shortly
// after mount. Content can never be permanently stuck at opacity:0.
const safety = window.setTimeout(() => { sections.forEach((s) => { if (!s.classList.contains("cs-reveal-in")) reveal(s); }); }, 1600);
```

### 3.13 Lead API: only fail if both durable channels fail (cs-website `src/app/api/contact/route.ts@27781178`)

```ts
// Retry a flaky async op a few times — the CRM DB and Gmail SMTP both throw
async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 3): Promise<T | null> { ... }
// ── Channel 1: mirror into the command-centre CRM (structured store) ──
// Only fail the user if BOTH durable channels failed (lead truly at risk).
```

For Taxila: channel 1 = Neon row, channel 2 = Azure Communication Services email (not Gmail SMTP).

### 3.14 Security headers (cs-website `src/proxy.ts@27781178`), with the change Taxila needs

```ts
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
```

Taxila must use `microphone=(self)` (voice lessons) and `camera=(self)` only if a vision feature ships, add the Azure OpenAI realtime / WebRTC hosts to `connect-src`, and drop `'unsafe-eval'` from `script-src`.

### 3.15 UI rules an agent can check mechanically (cs-website `docs/homepage-skill-pass-2026-07-25.md@ba6be984`)

> ZERO em-dashes ... max 4 kickers total ... No scroll cues ... No decorative status dots ... Hero stack discipline: max 4 text elements ... Every pressable element: `active:scale-[0.97]` with `transition-transform duration-150` (property-scoped, never `transition-all`) ... Never animate from scale(0) ... Stagger 30-80ms ... exits faster than enters ... Only transform+opacity animate ... Verification: `npx tsc --noEmit` clean; eslint clean; `npx impeccable detect <files>` clean; screenshots at 1440×900 + 390×844 with at least one edit→reshoot loop.

## 4. Measurements

All numbers as recorded in the source; none re-measured here. SEO and funnel numbers belong to CarbonSettle (B2B exporters), not to a children's product: use them for method and order of magnitude, not as Taxila priors.

| claim | n | method | date | source |
|---|---|---|---|---|
| GSC 90d totals: 126 clicks, 13,457 impressions, CTR 0.9%, avg position 46.7; 28d: 40 clicks, 3,666 impr, CTR 1.1%, pos 42.7 | 13,457 impressions | Google Search Console export | 2026-04-01..2026-06-29 | cs-website@claude/seo-phase1-lead-pages:docs/website-domination-analysis.md |
| ~8.7k impressions/90d (65% of all) resolved to 404 because the generator re-dated slugs; the #1 asset had 6,959 impressions at position 7.2; 11 of top-50 indexed URLs were 404 | top-50 indexed URLs | GSC + live URL checks | 2026-07-03 | cs-website:docs/website-domination-analysis.md; docs/blog-automation-fix.md |
| India is the click market: 1,666 impr / 57 clicks / 3.4% CTR / pos 23.1 vs US 7,157 impr / 4 clicks | 90d | GSC by country | 2026-07-03 | cs-website:docs/website-domination-analysis.md |
| First-party 90d: 186 visitors, 310 sessions, 400 pageviews, 1.3 pages/session, bounce 14.8%, median session 45s, 78% desktop; 0 of 310 sessions reached /contact; zero leads ever from a blog post | 310 sessions | first-party tracker, de-botted | 2026-07-03 | cs-website:docs/website-domination-analysis.md |
| AI answer engines referred traffic: gemini.google.com 6 and chatgpt.com 6 sessions | 310 sessions | first-party referrer | 2026-07-03 | cs-website:docs/website-domination-analysis.md |
| Cold-email funnel: 3,509 sent -> 274 opened -> 179 viewed proposal -> 144 downloaded (80% of viewers) -> 30 replied | 3,509 emails | proposal engagement tracking | all-time to 2026-07-03 | cs-website:docs/website-domination-analysis.md |
| 7,578 cold emails -> 40 replies with zero price objections and zero 'already have a consultant'; every objection was a legitimacy check | 40 replies | manual reply coding | 2026-07-24 | cs-website@claude/carbonsettle-importer-redesign-e3dpci:docs/positioning-dual-icp-2026-07-24.md |
| Section read-rate: only 4/10 calculator viewers scrolled to the detached lead form; pricing readers 75% read to 100%; blog readers hit a drop-off wall around 50% (CTA moved to 38%) | not recorded | section_view/section_dwell analytics | 2026-06-19 | cs-website@2011780a commit message |
| 151 dead clicks on a single blog post paragraph (inert FAQ text that looked clickable) | 1 post | dead_click signal | 2026-06-30 | cs-website@1af018d3 commit message |
| Blog corpus repair: 354 posts; 17 structural repairs, 150 superlative replacements, 7 invented routes, 1,445 links injected; posts with >=2 internal links 50 -> 354; 13 posts had rendered a raw code fence + duplicate H1; max_tokens 4000 had truncated 7 posts | 354 posts | repair-blog-posts.mjs + verify-blog-posts.mjs | 2026-09-04 | cs-website@555e6f8a, eeaab41b; generate_blog.py comments |
| Duplicate content: 139 posts in 38 duplicate-title groups (one title x11; 8 'archived v0..v7'); 402 -> 301 posts after dedupe; 100 pSEO pages noindexed | 402 posts | title normalisation | 2026-05-21 | cs-website@d869bd6c |
| Crawl budget: 343 pages 'Discovered - not indexed' with 341 AI posts + 100 pSEO in sitemap; sitemap planned ~464 -> ~53 URLs; cadence 4/day -> 1/day | ~464 URLs | GSC coverage report | 2026-03-16 | cs-website@9f863fb2 |
| Slug manifest seeded with 443 slugs (302 live + 141 recovered from git history), all resolving | 443 | check-blog-slugs.mjs | 2026-07-03 | cs-website:docs/blog-automation-fix.md |
| IndexNow: full sitemap 177 URLs submitted, HTTP 200 | 177 URLs | IndexNow API | 2026-09-05 | cs-website@b8b4e691 |
| Ship scroll section payload 3.0 MB -> 0.27 MB; port-v2.png 1.9 MB -> 158 KB WebP; ship-sunset.png 1.1 MB -> 102 KB | 3 images | file sizes | 2026-05-11 | cs-website@271f6c5d |
| Return traffic ~20% of real visitors (used to justify 31-day image cache) |  | first-party analytics | 2026-06-19 | cs-website:next.config.ts comment |
| Head model 324 KB -> 75 KB (3,361 vertices) by POSITION-only + 35% simplify, no visible difference; 3D assets 2.9 MB -> 324 KB by shipping only the loaded model | 1 model | file size + visual comparison on /meera | 2026-08-12 | vyakti-website@e91ab0b, 94cca19, 8fc2ec3 |
| Compact canvas particles 7,000 -> 4,800 (desktop 14,000); canvas DPR cap 1.5 -> 1.25; compact point DPR 1.25 -> 1 |  | config change (no fps metric recorded) | 2026-08-24 | vyakti-website@904b370 |
| Story runway 640/820/860svh -> 540/700/720svh when chapters went 6 -> 5 |  | config | 2026-09-03 | vyakti-website@4a7cbef PROJECT_CONTEXT 2026-09-03 |
| Layout verified at 390x844, 430x932, 768x1024, 844x390, 1280x720, 1440x900 | 6 viewports | manual screenshot review | 2026-08-22 | vyakti-website PROJECT_CONTEXT 2026-08-22 |
| (Cited from html-portfolio via standing doc) authored deterministic taste retrieval raised self-consistency 27% -> 63% over 480 turns; byte-identical prompt swap produced 38-2 incumbent preference; best LLM judge reproduced 77.1% of its own verdicts (< 80% bar); structural disclosure filtering leaked zero | 480 turns; 40 pairs | see html-portfolio context/measurements.md | 2026-08-21 | vyakti-website:docs/PRODUCT_AND_RESEARCH_STANDING.md (source: html-portfolio context/) |

Missing measurements worth flagging: no frame-time or INP numbers for either scroll story (the vyakti 2026-08-24 fix and the cs ship-scene perf commits are unmeasured beyond payload size); no lip-sync accuracy; no conversion-rate delta after the one-field capture or the 38% CTA move; the section read-rate numbers in 2011780a give no n.

## 5. Rejections (tried -> what broke)

| # | tried | what broke | source | Taxila relevance |
|---|---|---|---|---|
| R1 | Blog generator naming files <run-date>-<topic[:50]>-<unix-ts>.mdx and deleting older copies during cleanup | Every re-publish minted a new URL; cleanups 404'd ranked URLs, ~65% of 90d impressions incl. the #1 asset (6,959 impr, pos 7.2) landed on 'Article Not Found' | cs-website:docs/blog-automation-fix.md; 5b485833 | Any generated artifact with a public or shareable URL (kits, modules, parent report links) needs a stable id from content, a manifest and a never-404 build guard. |
| R2 | Generator fallback 're-write a priority topic from a fresh perspective' when the topic pool ran out | Same exemption-thresholds article regenerated every day for a month (31 copies) | cs-website:docs/blog-automation-fix.md; 06c4f270 | Forge must update-in-place or skip, never re-create, when its idea pool is exhausted. |
| R3 | Duplicate check comparing raw title strings (model emitted malformed/double-quoted titles) | Missed duplicates; 139 posts in 38 duplicate groups triggered Google duplicate-content clustering for the whole domain (brand searches collapsed into 'similar pages') | cs-website@d869bd6c, 527b2e06 | Normalise before comparing; aggressive dedupe where a false positive is cheap. |
| R4 | Publishing 4 AI posts/day and putting all 341 AI posts + 100 template pSEO pages in the sitemap | 343 pages 'Discovered - not indexed' - read as a content farm; crawl budget wasted | cs-website@9f863fb2, d869bd6c | Taxila SEO: quality over volume; noindex template pages until unique. |
| R5 | Trusting the model to emit clean MDX (frontmatter regex anchored at char 0, no MULTILINE) with max_tokens 4000 | Model wrapped output in ```mdx fences -> 13 live posts rendered raw fence, inner frontmatter and duplicate H1 with placeholder description; 7 posts truncated mid-article | cs-website@555e6f8a; generate_blog.py comments | Sanitise and validate every LLM artifact by predicate; refuse to write on placeholder/structural failure; budget output tokens and detect truncation. |
| R6 | Brand rules in the generator system prompt only (and a prompt that itself said 'India's #1') | 150 superlative instances, 7 invented internal routes, posts citing GDPR fines as CBAM, 10 near-identical stubs; prompt still links a retired route which only the post-validator catches | cs-website@555e6f8a, eeaab41b; generate_blog.py system_prompt | Confirms the inherited law 'safety by predicate, not instruction': banned-phrase lint + link validation must gate Forge output. |
| R7 | Fabricated AggregateRating (4.9/5, 47 reviews) and Review schema with 3 client reviews; named PR persona; named WhatsApp persona with reply-time promise | Unverifiable proof; removed sitewide (ae2b3ef4, b5e6b41c, d554ce7e, b8c83541, 3b547933) and made an absolute guardrail | cs-website@8c9ec969 then removals | Never fabricate parent testimonials, outcome stats or teacher personas on Taxila's site. |
| R8 | Homepage visual redesign (animated India->EU hero journey, gap chart + sector tiles, FAQ accordion) | Founder rejected it and promoted the previous deploy (fa5395f); CLAUDE.md now forbids redesign without explicit founder request; only the non-visual blog fix was kept | cs-website@bb415fbd, 8a97aff5, 74ee48d8; CLAUDE.md | Ship design changes as previews for owner review; keep functional fixes separable from visual changes. |
| R9 | Five preview homepages V1-V5 (Corridor, Platform, Night Freight dark, Vishwas, Precision) for dual-ICP repositioning | Removed in favour of polishing the original homepage through the skill stack (d02fede3); dark variant also conflicts with 'no dark themes' guardrail | cs-website@cd0676bc..f0851794, d02fede3 | Polish-in-place often beats parallel redesigns; but previews are the right review mechanism. |
| R10 | A 'Fix mobile ship scroll story' change | Reverted the next day (090a5829) with no recorded reason | cs-website@be3fe020, 090a5829 | Log reasons with reverts; an unexplained revert is a lost lesson. |
| R11 | Splitting the pinned ship scene's motion across separate springs | Numbers drifted past their focus stage; replaced by one deterministic scroll timeline | cs-website:src/components/home/ShipScrollSection.tsx comment | Scroll-linked explainer modules: one timeline, no springs. |
| R12 | filter:drop-shadow, triple text-shadows, filter:blur(22px) sun glow, backdrop-blur on navbar, redundant will-change, 1.9 MB PNGs | Per-frame GPU filter passes and re-rasterisation on opacity tweens; jank on mobile; 3.0 MB section payload | cs-website@b19551b0, 271f6c5d | Budget Android: no filters on animated layers; gradients and single shadows instead. |
| R13 | Swapping navbar CSS classes between gradient and solid backgrounds | Browsers cannot interpolate between them; the transition snapped | cs-website@f5d17222 | Crossfade two layers via opacity. |
| R14 | Scroll reveals with a late IntersectionObserver trigger | Sections stuck at opacity 0 / 'scroll slowly to load' blanks on fast scroll | cs-website@ad4534fa; RevealController.tsx | Pre-fire margin + safety timeout + SSR-visible default. |
| R15 | sitemap lastModified = new Date() on every deploy | Google stops trusting lastmod that always equals the crawl date, so real changes can't signal | cs-website:src/app/sitemap.ts comment (b8c83541) | Honest lastmod from content. |
| R16 | IndexNow script written but not wired; --changed watched only src/content/blog | Never ran automatically; every non-blog page shipped after it was never submitted | cs-website@b8b4e691 | Automation that is not wired to a hook does not exist. |
| R17 | Root .gitignore patterns anchored to repo root | 303 MB of nested carbonsettle-main/node_modules and .next logs tracked; still present on main (fix only on seo-phase0/1 branches) | cs-website@2b49ea9c (unmerged) | Check repo hygiene in CI. |
| R18 | Daily automation dependent on one provider key | OpenAI quota died and the daily post silently stopped after 2026-06-30 | cs-website:.github/workflows/blog-automation.yml comment | Content jobs need failure alerts, not silent no-ops. |
| R19 | FAQ as inert bold Q:/A: text | 151 dead clicks on one paragraph | cs-website@1af018d3 | Anything that looks tappable to a child must be tappable. |
| R20 | Three-field (phone+email+company) calculator capture | The #1 engagement tool captured nobody | cs-website@74a928b9 | Parent onboarding: one field (phone or email). |
| R21 | Separate /cbam-service-india and /cbam-consultant-india pages | Cannibalised the same queries; consolidated with a 308 | cs-website@a784d7bb; next.config.ts | One URL per intent. |
| R22 | Offer copy with quarters and deadlines ('free this quarter', 15 Jul then 30 Sep 2026) | Deadline drift across 66 files; replaced by dateless 'first report free' and the old strings added to the banned-phrase lint | cs-website@3b547933, 777ca3b8; verify-blog-posts.mjs | Time-bound claims rot; lint retired strings. |
| R23 | Factual CN-code directory listing 7312, 7323, 7325 as Annex I headings | Wrong; fixed to say they are not covered | cs-website@a1228906 | Programmatic content needs a verified key (Taxila: blind-solved kits). |
| R24 | Procedural particle-hair Meera prototype | Read as a wig rather than authored curly hair | vyakti-website PROJECT_CONTEXT 2026-08-14 | Avatar hair/details: author, don't proceduralise. |
| R25 | Noor-to-Meera topology morph / identity dissolve | Rejected; identities became separate scenes with a clear-paper beat | vyakti-website PROJECT_CONTEXT 2026-08-14/22 | Tutor selection: switch tutors with a clean cut, never morph one face into another. |
| R26 | TripoSR + MediaPipe single-image 3D reconstruction of Meera | Looked uncanny on direct live review; replaced by the canonical 2D editorial portrait | vyakti-website@3270669; PROJECT_CONTEXT 2026-08-14 | Single-image 3D is not good enough for a human tutor face; prefer art-directed rigs or 2D. |
| R27 | GSAP numeric scrub (0.24) on touch layouts | Face trailed the finger and kept catching up after a swipe; replaced by native progress | vyakti-website@904b370 | Never stack smoothing on native touch momentum. |
| R28 | Hardcoded mouth-region ripple and artificial mouth-band shading | Dark lip artifact; replaced by semantic jaw/viseme rig moving skin, socket and teeth together | vyakti-website PROJECT_CONTEXT 2026-08-22; a326142 | Lip-sync must move anatomy coherently. |
| R29 | Speech driven purely by scroll progress | Pausing a swipe froze the mouth mid-viseme; speech became time-based inside a scroll-gated chapter | vyakti-website PROJECT_CONTEXT 2026-08-22 | Avatar speech is clock-driven, never input-driven. |
| R30 | Solid face poster on first paint | Flash before the particle system was ready; replaced by a dots-only field with first-valid-frame handoff | vyakti-website PROJECT_CONTEXT 2026-08-22 |  |
| R31 | Overlapping chapter crossfades | Replaced with reversible fade-through handoffs | vyakti-website PROJECT_CONTEXT 2026-08-14 |  |
| R32 | Re-animating reveals on scroll-back | 'The single most reliable tell of a template'; reveals now fire once | vyakti-website:src/components/reveal.tsx |  |
| R33 | Math.random() point sampling during render; ref read during render; setState in effect for WebGL detection | Non-deterministic between server and client; React Compiler correctness errors; fixed with seeded mulberry32, useMemo box, useSyncExternalStore | vyakti-website@e2b5950 | Determinism in generated visuals (seeded RNG) for reproducible modules. |
| R34 | Public claim 'any model, same personality' | Program's own swap test measured 38-2 incumbent preference with a byte-identical prompt; claim retracted from public copy | vyakti-website:docs/PRODUCT_AND_RESEARCH_STANDING.md | Do not promise the tutor stays identical across model upgrades; gate swaps. |
| R35 | Research metadata implying submitted papers / benchmark release | False third-party claims; corrected to one preprint, one note in progress, artifact pending; status became an enum | vyakti-website PROJECT_CONTEXT 2026-08-22 |  |
| R36 | Deploying the research site from a local CLI build | Production source had no Git commit; recovered from Vercel's source archive | vyakti-website@7e9861b; PROJECT_CONTEXT 2026-08-21 | Taxila rule 'git push first' exists for this reason. |
| R37 | Shipping four candidate head models | Only one loaded; repo 2.9 MB of 3D assets | vyakti-website@94cca19 |  |
| R38 | Lab-thesis positioning ('Intelligence is becoming abundant. Continuity is not.', 'You do not configure Meera. You meet her.') | Retired 2026-09-03 for the Rooms product; kept in the log as superseded so it is not reintroduced | vyakti-website@4a7cbef PROJECT_CONTEXT |  |
| R39 | A form with no backend | Would 'pretend to post somewhere'; replaced with a prefilled mailto | vyakti-website@64345e8 |  |
| R40 | Research agent's product-codebase audit | Audited the wrong repository (an Expo voice-notes app 'Echo'), flagged as CRITICAL MISMATCH in the doc itself | vyakti-website:docs/research/product-codebase-audit.md | Harvest agents must verify repo identity before analysis. |

The pattern across both repos: content and visuals generated or tuned by agents failed in ways a prompt instruction did not prevent (re-dated slugs, fences, superlatives, invented routes, fabricated ratings), and every durable fix was a predicate or build guard. On the visual side, every durable fix *removed* smoothing or effects (scrub on touch, springs, filters, morphs, procedural hair, single-image 3D).

## 6. Concepts

- **Provenance-carrying numbers**: A number can only render together with n, method, date and source (type-enforced). *Taxila:* Parent reports and any efficacy claim on the marketing site.
- **Struck, not deleted**: Retracted claims stay visible, struck through, with the control that killed them. *Taxila:* Public learning-science page; parent report corrections ('we thought X, the check showed Y').
- **Safety and quality by predicate**: LLM content passes sanitisers, link validators, banned-phrase lints and build guards; the prompt is not trusted (the prompt even drifted and named a retired route). *Taxila:* Forge output gate; teacher-utterance lint.
- **URL permanence invariant**: Every published slug is in a manifest; the build fails if any stops resolving; retire by 308, never delete. *Taxila:* Shareable module/report links and SEO pages.
- **Update-in-place over re-create**: When a generator runs out of new topics it refreshes an existing artifact in place instead of minting a duplicate. *Taxila:* Forge module versions per child.
- **Quality over volume for crawlers**: Too many thin AI pages makes the whole domain read as a content farm. *Taxila:* Taxila SEO volume.
- **Answer-engine optimisation**: llms.txt + IndexNow (Bing feeds ChatGPT/Copilot) + self-contained FAQ answers and question-format headings. *Taxila:* Parents increasingly ask assistants which tutor to use.
- **Legitimacy is the conversion job**: Prospects never objected on price; every objection was a legitimacy check, so the site's job is proof and trust. *Taxila:* Indian parents choosing an AI tutor for a child: trust artefacts (who we are, safety floor, how data is used) above persuasion.
- **Section read-rate driven layout**: Auto section_view/dwell on every block reveals attention cliffs; move the differentiator above the cliff and put asks next to the number. *Taxila:* Lesson UI and parent dashboard layout tuning.
- **Budget-Android, English-second-language reader**: PRODUCT.md ICP: warm, concrete, phone-visible, WhatsApp-first, real imagery, distrusts abstract SaaS minimalism and dark themes. *Taxila:* Directly describes many Taxila parents.
- **Motion gate by frequency and purpose**: Animate only with a named purpose; UI < 300ms; reveal once; disable reveals on touch; one deterministic timeline for scroll scenes. *Taxila:* Lesson runtime should be nearly motionless at the chrome level; delight budget goes to modules and celebrations.
- **Boundary model as structure**: Separation enforced at write time and drawn as a figure: down to everyone, never sideways, up only as counts. *Taxila:* Parent/child/teacher/sibling data boundaries.
- **Honest CTA**: One label per intent; no fake forms or invented screenshots; readiness described in words. *Taxila:* Pre-launch waitlist.
- **First-party identity with internal suppression**: Own visitor/session ids, staff flag and dev-host suppression keep analytics clean without third parties. *Taxila:* Azure-only analytics.
- **Geometry-stable degradation**: If WebGL dies late, swap only the visual layer; never change layout or scroll position. *Taxila:* 3D tutor fallback to 2D portrait mid-lesson.

## 7. Recommended Taxila actions from this segment

1. **Forge and SEO content gate**: port `verify-blog-posts.mjs` (banned regexes, structure checks, link resolution), the `normalise_generated_post` sanitiser and the duplicate-title guard into `evals/` as a gate every generated module, lesson script and article passes. Add a slug/id manifest + never-404 check for shareable module and report URLs.
2. **Parent report honesty components**: port `Measure`, `EvidenceRail`, `StatusChip`, `SeamNote` to `src/` so comprehension and progress numbers always carry n/method/date and uncertain states render as uncertain.
3. **Marketing site (Vite)**: reuse the token structure, reveal-once, Lenis-on-fine-pointer-only, rAF navbar, RevealController safety net, MotionConfig reducedMotion='user', the Impeccable/taste/emil skill pack and the binding skill-pass rules. Generate sitemap.xml (honest lastmod), robots.txt, JSON-LD @graph, llms.txt and run IndexNow at postbuild. Build Hindi and English pages as an hreflang pair with x-default.
4. **Parent capture**: one field, phone or email, +91 normalisation, WhatsApp deep link; dual durable channels (Neon + Azure Communication Services) and fail only if both fail. No fabricated testimonials or outcome stats; legitimacy artefacts first.
5. **Analytics**: adapt tracker/identity/signals to an Azure collector; keep section read-rate, dead/rage clicks, web vitals and stale-chunk self-heal; strip form-value harvesting and any free text on child surfaces; no PostHog, GA4 or session replay.
6. **3D tutor**: adopt frameloop demand, DPR caps, reduced particle/vertex budgets on compact devices, context-loss fallback that keeps layout, a semantic oral rig driven by real viseme timing on a time-based clock, and a clean cut (never a morph) when switching tutors. Do not use single-image 3D reconstruction for a human tutor face.
7. **Headers**: start from `proxy.ts` but allow microphone for self and Azure realtime hosts.

## 8. Gaps / unread

- vyakti-website: full face-lab / ink-lab / noor-study shader code and runtime (only headers, viseme and canvas budget read)
- vyakti-website: src/app/research/page.tsx body, papers markdown (identity-ceiling, judge-qualification), figures components in full
- vyakti-website: docs/research/competitive-landscape.md and rumik-teardown.md bodies (headings only)
- vyakti-website: taste-skill (1206 lines), emil-design-eng, gsap references in full; only DESIGN-PRINCIPLES synthesis head read
- vyakti-website cloning-platform branch: new homepage page.tsx/home.module.css diff read only via commit messages and PROJECT_CONTEXT
- cs-website: the 356-post blog corpus content, pseo-data.ts, city-pages data, CalculatorTool, CBAMDiagnostic, SavingsCheckTool internals
- cs-website: Impeccable scripts/detector internals; IMAGE-PROMPTS.md; OFF_PAGE_SEO_BLUEPRINT.md; MANUAL_SEO_EXECUTION_GUIDE.md bodies
- cs-website branches find-latest-repo-4ZKUh, whatsapp-icon-mobile-fix-mIEBo, eur-currency-symbol-y78PW, improve-cbam-seo-4AmwF, fix-deployment-mobile-layout-PtG96, cbam-seo-optimization-i5RSq: commit messages only
- cs-website: analytics collector backend (pdf.carbonsettle.com/collect) and the CommandCentre repo docs/AGENT-CONTEXT.md - not in this segment
- .env.example in cs-website not opened (example file; api/_config-style secrets not present in these repos)
