import { keccak256, stringToHex } from "viem";

export type PennyModel = {
  id: `0x${string}`;
  key: string;
  label: string;
  tagline: string;
};

export const PENNY_MODELS: PennyModel[] = [
  { id: keccak256(stringToHex("haiku-4-5")), key: "haiku-4-5", label: "Haiku", tagline: "Cheapest" },
  { id: keccak256(stringToHex("sonnet-4-6")), key: "sonnet-4-6", label: "Sonnet", tagline: "Balanced" },
  { id: keccak256(stringToHex("opus-4-7")), key: "opus-4-7", label: "Opus", tagline: "Strongest" },
];

export function modelByKey(key: string): PennyModel | undefined {
  return PENNY_MODELS.find((m) => m.key === key);
}

export function modelById(id: `0x${string}`): PennyModel | undefined {
  return PENNY_MODELS.find((m) => m.id === id);
}
