# Putting Taxila on the child's own device (r7 App, 2026-11-08)

The client is built (App) against main's route shape for Platform (server/auth.js). Until Platform's routes land, the
client's calls return 404. The card then makes no code and shows "The code could not be made…". `/pair` says the code
did not work.

## The routes the client calls

| Route | Auth | Answer |
|---|---|---|
| `POST /api/pair/code { childId }` | parent | `{ code, expiresAt }`. 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I), 10 minutes, one use; a new code replaces the old one |
| `POST /api/pair/redeem { code }` | none | `{ childId, name }` plus the child-scoped session cookie. Rate-limited per IP and per code; a wrong, used or expired code is a 400/404/410 that names nothing |
| `GET /api/pair/devices?childId=` | parent | `{ devices: [{ id, label?, createdAt, lastSeenAt? }] }` |
| `DELETE /api/pair/devices/:id` | parent | `{ ok }`. That device's session ends server-side at once |

## Two things the client also needs from Platform

1. **`GET /api/me` on a child-scoped session** answers `{ scope: "child", guardian: null, children: [that child only], consents: [] }`. A parent session may send `scope: "parent"` (absent is read as parent).
   - **Who:** goes straight to that child, with no picker and no other names.
   - **Parent corner:** `/parent/*` shows "Grown-ups only" with "Sign in as the grown-up" (`/start/phone?login=1&next=/parent`).
   - **Sign-in screen:** treats the child session as no parent sign-in.
2. **A separate cookie for the child session**, not the parent's session cookie. A grown-up who signs in on the paired device then does not erase the pairing, and signing out returns the device to the child.
   - When both are present, `/api/me` answers the parent's.
   - Parent routes accept only the parent's session. A child session on any parent route is a 401 or 403.

## Where it is in the app

- **`/pair`** (`src/app/Pair.tsx`): the code field. Spaces, dashes and lower case are fine, and the read-alikes are dropped. A QR link's `?code=` goes on by itself. Success refreshes `/api/me` and opens `/c/{childId}`.
- **Parent corner, Children** (`src/app/PairCard.tsx`, one line in `src/parent/Pages.tsx`): "Put Taxila on {name}'s device".
  - The code is shown large in two halves, with a QR to `{origin}/pair?code=` (`qrcode-generator`, loaded only then) and a countdown. "New code" and "Done".
  - The device list has "Unpair", which asks once ("Remove it" / "Keep").
- **Shell:** `Me.scope` and `guardian: null` (`src/app/api.ts`), Who, the `ParentOnly` guard (`src/app/ParentOnly.tsx`) and `Account.tsx`.

Shots: `shots-pair/` (the corner's code box, `/pair` typed and refused, and `/parent` on a paired device) at 360/412/1280.
Tests: `tests/r7-app-pair.test.mjs`.
