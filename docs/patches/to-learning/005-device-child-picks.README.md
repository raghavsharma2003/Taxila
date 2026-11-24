# 005: a paired device saves the child's own picks only (audit PLAT-07, learning half)

Platform's half is on `claude/r7-audit-platform`: `server/pair/scope.js` now admits `PATCH /api/children` and
`POST /api/placement/onboarding` for a paired child device, and `server/router.js` refuses, before the handler runs, any
body field outside `DEVICE_FIELDS` from a device-only session (403 `scope.child_device`). So a device can save her
picture, interests and "Maths feels…" picks (today they 403 and the screens swallow it), and nothing else.

This patch is the same rule inside the two handlers, so it holds even if a route is ever called another way:
- `updateChild` (`server/routes/account.js`): a device-only session may send `childId`, `avatar`, `interests` only. Without
  it, with no parent PIN set, the device could change name, class, board, language and teacher.
- `onboarding` (`server/routes/placement.js`): a device-only session may not send `parentView`.

Apply: `git apply docs/patches/to-learning/005-device-child-picks.patch`. Test: `tests/r7-audit-platform-scope.test.mjs`
("PLAT-07") covers the router; after applying, the same calls still answer 403 `scope.child_device`.
