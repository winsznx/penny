import { keccak256, toHex } from "viem";

/**
 * Deterministic message-hash builder. We don't include the model id or cost
 * because those are stored alongside on-chain; just need a unique label.
 */
export function buildMessageHash(input: { sender: `0x${string}`; text: string; nonce: number }): `0x${string}` {
  const payload = `${input.sender.toLowerCase()}|${input.nonce}|${input.text}`;
  return keccak256(toHex(payload));
}

export function isValidHash(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}
