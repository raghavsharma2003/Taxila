// A paired child device (r7 app-child-device-pairing; Platform's routes at claude/r7-platform 703b1968). The device holds
// tx_child (HttpOnly, the child-scoped session) and tx_paired=<childId> (readable): the app boots child mode from the
// readable cookie, never from /api/me, which answers a device-only browser 403 { code: "scope.child_device" }. The child's
// record comes from GET /api/child/boot (a child route), cut to that one child: no guardian, no brothers or sisters.
// A parent who signs in on the device wins (their session answers /api/me), so the corner opens only behind it.
import { ApiError, getJson } from "../lesson/api.ts";

export const PAIRED_COOKIE = "tx_paired";

/** PURE. The child this device is paired to, from the readable cookie (null when there is none). */
export function pairedChildId(cookie: string = typeof document !== "undefined" ? document.cookie : ""): string | null {
  const m = new RegExp(`(?:^|;\\s*)${PAIRED_COOKIE}=([^;]+)`).exec(cookie);
  const v = m ? decodeURIComponent(m[1]).trim() : "";
  return /^[0-9a-zA-Z-]{8,64}$/.test(v) ? v : null;
}

/** A parent route refused on a paired device (show "ask your grown-up to sign in", never an error). */
export const isChildDeviceRefusal = (e: unknown): boolean =>
  e instanceof ApiError && e.status === 403 && (e.body as { code?: string } | null)?.code === "scope.child_device";

/** PURE. The boot's `me` cut to the paired child: scope child, no guardian, only that child, no consents. null if absent. */
export function childDeviceMeOf<T extends { children?: { id: string }[] }>(bootMe: T | null | undefined, childId: string):
  (Omit<T, "children" | "guardian"> & { scope: "child"; guardian: null; children: NonNullable<T["children"]>; consents: [] }) | null {
  const kids = (bootMe?.children ?? []).filter((c) => c.id === childId);
  if (!bootMe || !kids.length) return null;
  const { guardian: _g, consents: _c, ...rest } = bootMe as T & { guardian?: unknown; consents?: unknown };
  return { ...(rest as Omit<T, "children" | "guardian">), scope: "child", guardian: null, children: kids as NonNullable<T["children"]>, consents: [] };
}

/** The paired child's Me on this device, read through the child route; null when this device is not paired. */
export async function childDeviceMe<T extends { children?: { id: string }[] }>(): Promise<ReturnType<typeof childDeviceMeOf<T>>> {
  const cid = pairedChildId();
  if (!cid) return null;
  const b = await getJson<{ me?: T }>(`/api/child/boot?childId=${encodeURIComponent(cid)}`);
  return childDeviceMeOf<T>(b.me ?? null, cid);
}

/** /api/me, or on a paired device the paired child's Me. A device that was unpaired (its session ended) reads 401. */
export async function meOrChildDevice<T extends { children?: { id: string }[] }>(read: () => Promise<T>): Promise<T> {
  // APP-35: a paired device with no parent sign-in marker never asks /api/me first (it always answers 403 there)
  if (pairedChildId() && !/(?:^|;\s*)tx_in=1/.test(typeof document !== "undefined" ? document.cookie : "")) {
    try { const m = await childDeviceMe<T>(); if (m) return m as unknown as T; } catch { /* fall through to the normal read */ }
  }
  try {
    return await read();
  } catch (e) {
    if (isChildDeviceRefusal(e) || (e instanceof ApiError && e.status === 401 && pairedChildId())) {
      const m = await childDeviceMe<T>();
      if (m) return m as unknown as T;
    }
    throw e;
  }
}
