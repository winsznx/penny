import { formatUnits } from "viem";

/**
 * Estimate the next-message cost given a token count. Real cost comes from
 * the contract; this is the optimistic preview UIs render before sending.
 */
export function estimateMessageCost(rateWei: bigint, estimatedTokens: number): bigint {
  if (estimatedTokens <= 0) return 0n;
  // tokens × per-token-rate. Rate stored as cost-per-1k-tokens to fit the
  // contract's resolution; convert here.
  const scale = BigInt(Math.round(estimatedTokens * 1_000_000));
  return (rateWei * scale) / 1_000_000_000n;
}

export function formatEstimate(rateWei: bigint, estimatedTokens: number): string {
  const wei = estimateMessageCost(rateWei, estimatedTokens);
  const cusd = Number(formatUnits(wei, 18));
  if (cusd < 0.001) return "<$0.001";
  return `$${cusd.toFixed(cusd < 1 ? 3 : 2)}`;
}
