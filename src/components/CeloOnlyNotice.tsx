"use client";

/**
 * Renders when a feature only ships on the Celo deployment of a contract.
 * Use as an early return inside chain-aware panels so Stacks users see a
 * clear "switch to Celo" affordance instead of a silently disabled button
 * that secretly fires a Celo write.
 */
export function CeloOnlyNotice({ feature }: { feature: string }) {
  return (
    <div className="rounded-lg border border-stone-border bg-stone-surface px-4 py-3 text-[12px] text-stone-text">
      {feature} ships on Celo only — switch the chain toggle to Celo to use it.
    </div>
  );
}
