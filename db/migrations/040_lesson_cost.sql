-- Round 7, stream G (platform-cost-ledger): what one lesson cost, by meter and by lane, rolled up from its flight-recorder
-- spend events (model.call, speech.tts, stt.session, d5.session, image.call; each carries its own usd from
-- server/cost/prices.js). Written by server/cost/rollup.js when the lesson ends, and by `node scripts/cost.mjs --lesson
-- ID --write` for a backfill. Numbers only: no text, no child data beyond the row it sits on.
--   { "v": 1, "priceBook": "2026-11-04", "usd": 0.0123, "minutes": 14.2, "usdPerMin": 0.00087,
--     "meters": { "chat": { "usd": .., "calls": .. }, "tts": { "usd": .., "chars": .. }, "stt": { "usd": .., "sec": .. },
--                 "s2s": { "usd": .., "sec": .. }, "image": { "usd": .., "n": .. } },
--     "lanes": { "hot": .., "bg": .., "-": .. }, "unpriced": 0, "at": "..." }
alter table lesson add column if not exists cost jsonb;
