const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

/**
 * MSTUDIO_AI_KILL=1 (or true/yes/on, case-insensitive) is the free-tier
 * emergency brake: every AI charge is refused while it is set. Only the
 * "ai" kind is affected — D1/R2 keep working so the studio stays usable.
 */
export function aiKillSwitchEnabled(
  env: Record<string, string | undefined>,
): boolean {
  const raw = env.MSTUDIO_AI_KILL?.trim().toLowerCase();
  return raw !== undefined && TRUE_VALUES.has(raw);
}
