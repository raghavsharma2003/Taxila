# Platform → B Voice: wiring the India D5 relay (round 7, platform-d5-relay-in-india)

**Platform built (on claude/r7-platform):**
- `server/relay-ticket.js`: `mintRelayTicket` / `verifyRelayTicket`. An HMAC ticket bound to one lesson that lives 60 s and is used once. Key: `TAXILA_D5_TICKET_KEY`.
- The relay-only server role `TAXILA_ROLE=d5relay` in `server/serve.mjs`. It serves `/api/health`, whose readiness has no database check, and the `/api/duplex/voicelive` upgrade. Nothing else.
- `scripts/region/d5-relay.mjs`. It deploys `taxila-d5-sin` in South India with only Voice Live's endpoint + key and the ticket key: no database, no cookie.

The relay refuses every socket until the three changes below land. Its `code` step checks for `verifyRelayTicket` under `server/duplex/` at the release sha.

## Why a ticket
Today `handleD5Upgrade` refuses cross-origin upgrades and `authorizeD5` reads the taxila.dev session cookie. A relay on its own host gets neither. taxila-web keeps doing the full authorization: the child's own open lesson, consent, the rate and the lane. It then hands the browser a ticket the relay can check with no database.

## The three changes (Voice's files)

1. **Mint**, in a new route or in `server/duplex/config.js`. Suggested shape: `POST /api/duplex/ticket { lessonId }`.
   - Run `authorizeD5` exactly as the upgrade does today.
   - When `TAXILA_D5_RELAY_URL` is set, return `{ url: TAXILA_D5_RELAY_URL, ticket: mintRelayTicket({ lessonId, childId, guardianId, mode }) }`.
   - When it isn't set, return `{ url: null }`, and the client uses today's same-origin path. That's also the rollback: unset the one variable.

2. **Accept**, in `server/duplex/d5route.js` `handleD5Upgrade`. When `process.env.TAXILA_ROLE === "d5relay"`:
   - Skip the same-origin check and `authorizeD5`.
   - Read `ticket` and `lessonId` from the query, then call `verifyRelayTicket(ticket, { lessonId, seen })`. `seen` is a module-level `Set` that refuses a reused ticket.
   - On `ok`, continue with `{ lessonId, childId, guardianId, mode }` from the ticket. Otherwise `refuseUpgrade(socket, 401, reason)`.
   - Everything after authorization (the Voice Live session, frames, `d5Session` metering, the shutdown drain's 1012) stays as it is.

3. **Client**, in `src/duplex/d5Stream.ts` (`d5Url`).
   - Before opening, ask for the ticket.
   - If `url` is set, open `${url}?lessonId=…&ticket=…`.
   - If that fails to open (refused, or no `d5.session` within the open timeout), fall back once to today's same-origin URL, so a relay outage costs one retry and not the lane.

## Tests Platform suggests
- The upgrade with `TAXILA_ROLE=d5relay`: a valid ticket is accepted; another lesson's, an expired or a reused ticket is refused with 401.
- Without the role, today's behaviour is unchanged.
- The ticket route mints only after `authorizeD5` passes.
