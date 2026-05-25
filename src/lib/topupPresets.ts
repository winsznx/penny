import { parseUnits } from "viem";

export const TOPUP_PRESETS = [
  { label: "$0.50", valueWei: parseUnits("0.5", 18) },
  { label: "$1", valueWei: parseUnits("1", 18) },
  { label: "$5", valueWei: parseUnits("5", 18) },
  { label: "$10", valueWei: parseUnits("10", 18) },
] as const;

export const COST_PER_MESSAGE_GUIDE = [
  { tier: "haiku", est: "~$0.001" },
  { tier: "sonnet", est: "~$0.005" },
  { tier: "opus", est: "~$0.02" },
] as const;
