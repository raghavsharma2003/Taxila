// Quota awareness (STAGECRAFT.md §3.4): per-deployment token buckets, 429 cool-down (Retry-After, else exponential from
// 2 s to 60 s), failover chains whose last link is "do not build", and the reply-lane pause. Pure: the state is a plain
// object the conductor keeps in Portfolio.meta.quota; `now` is passed in.

/** A fresh bucket. Reply lanes are recorded so their 429s pause Stagecraft, and so they can never be picked. */
export function bucket(deployment, cfg) {
  const rpm = cfg.rpm?.[deployment] ?? 30;
  return { deployment, tokens: rpm, refillPerMin: rpm, coolUntil: 0, recent429: 0, backoffMs: 0, at: 0, isReplyLane: !!cfg.replyLanes?.includes(deployment) };
}
function refill(b, now) {
  if (now > b.at) { b.tokens = Math.min(b.refillPerMin, b.tokens + ((now - b.at) / 60_000) * b.refillPerMin); b.at = now; }
}
/**
 * The first deployment in the tier's chain that is configured, not a reply lane, not cooling and has a token.
 * Returns null = "do not build" (the family stays served by the instant rung). Does not take the token.
 */
export function pickDeployment(quota, tier, cfg, now) {
  const chain = cfg.chains?.[tier] ?? [];
  for (const dep of chain) {
    if (cfg.absent?.includes(dep) || cfg.replyLanes?.includes(dep) || cfg.livePathLanes?.includes(dep)) continue;
    const b = quota[dep] ?? (quota[dep] = bucket(dep, cfg));
    refill(b, now);
    if (now < b.coolUntil) continue;
    if (b.tokens >= 1) return dep;
  }
  return null;
}
export function take(quota, dep, cfg, now) {
  const b = quota[dep] ?? (quota[dep] = bucket(dep, cfg));
  refill(b, now);
  b.tokens = Math.max(0, b.tokens - 1);
}
/** A 429 or a 200 from a deployment. Returns { pauseUntil } when the reply lane 429'd (Stagecraft spec launches pause). */
export function onQuota(quota, { deployment, status, retryAfterMs, at }, cfg) {
  const b = quota[deployment] ?? (quota[deployment] = bucket(deployment, cfg));
  if (status === 429) {
    b.recent429++;
    b.backoffMs = retryAfterMs ?? Math.min(60_000, b.backoffMs ? b.backoffMs * 2 : 2000);
    b.coolUntil = at + b.backoffMs;
    b.tokens = 0;
    b.at = at;
    if (b.isReplyLane || cfg.replyLanes?.includes(deployment)) return { pauseUntil: at + (cfg.reply429PauseMs ?? 60_000) };
  } else if (status === 200) {
    b.backoffMs = 0;
  }
  return {};
}
