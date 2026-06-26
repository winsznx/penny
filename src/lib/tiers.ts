export function readTierActive(tierTuple: unknown): boolean | null {
  if (!tierTuple) return null;
  if (typeof tierTuple === "object" && "active" in tierTuple) {
    const active = (tierTuple as { active?: unknown }).active;
    if (typeof active === "boolean") return active;
  }
  if (Array.isArray(tierTuple)) {
    const active = tierTuple[2];
    return typeof active === "boolean" ? active : Boolean(active);
  }
  return null;
}
