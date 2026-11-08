# Putting Taxila on the child's own device (r7 App, 2026-11-08)

The client is built against Platform's routes at claude/r7-platform 703b1968 (draft PR #79).

## Routes

| Route | Auth | Answer |
|---|---|---|
| `POST /api/pair/code { childId }` | parent | `{ code, expiresAt }`. 6 characters from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`, 10 minutes, one use; a new code replaces the old one |
| `POST /api/pair/redeem { code, label? }` | none | `{ childId, name }`. Sets `tx_child=d.<token>` (HttpOnly) and `tx_paired=<childId>` (readable), 180 days. A wrong, used or expired code: `400 pair.invalid`. Too many tries: `429 pair.rate_limited` |
| `GET /api/pair/devices[?childId=]` | parent | `{ devices: [{ id, childId, childName, label, pairedAt, lastSeenAt }] }`, newest first |
| `DELETE /api/pair/devices?id=` (and the body `{ id }`) | parent | `{ ok: true }`. The device's next request is a 401 |

**On a device-only browser,** `/api/me` and every parent route answer `403 { code: "scope.child_device" }`. A parent who signs in on the device wins.

## The client

- **Boot** (`src/app/device.ts`):
  - When `/api/me` is refused with `scope.child_device` (or answers 401 while `tx_paired` is set), the app reads the paired child id from `tx_paired`.
  - It then calls `GET /api/child/boot?childId=` and cuts the boot's `me` to `{ scope: "child", guardian: null, children: [that child], consents: [] }`.
  - Both `loadMe` (`src/app/api.ts`) and the child shell's `getMe` (`src/child/api.ts`) go through it.
- **Who:** opens the paired child at once.
- **Parent corner:** `/parent/*` shows "Ask your parent to sign in", linking to the grown-up's own sign-in (`src/app/ParentOnly.tsx`). The sign-in screen treats the device session as no parent sign-in.
- **The landing:** greets a paired device as signed in ("Go to Taxila").
- **Unpaired:** a 401 in the child shell while `tx_paired` is set goes to `/pair?unpaired=1`, "This device was unpaired. Ask your grown-up for a new code to use it again."
- **`/pair`** (`src/app/Pair.tsx`): the code field forgives case, spaces and dashes. A QR link's `?code=` goes on by itself. Success opens `/c/{childId}`.
- **Parent corner, Children** (`src/app/PairCard.tsx`, one line in `src/parent/Pages.tsx`): "Put Taxila on {name}'s device".
  - The code is shown in two halves with a QR to `{origin}/pair?code=` (`qrcode-generator`, loaded only then), a countdown, "New code" and "Done".
  - Paired devices show "{label} · added … · last used …" with "Unpair", which asks once.

## For Platform

`GET /api/child/boot` on a device-only browser answers the guardian's whole `me`: their email, and every child's name. The client
keeps only the paired child, but the device still receives the rest. Cutting it server-side (the same shape the client builds)
would keep a sibling's name and the parent's email off the child's device.

Shots: `shots-pair/` at 360/412/1280:
- the corner's code box;
- `/pair` refused and typed;
- the device's home (Riya only);
- `/parent` on the device;
- the unpaired note.

Tests: `tests/r7-app-pair.test.mjs`.
