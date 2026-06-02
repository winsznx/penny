"use client";

import { useState } from "react";
import { keccak256, toBytes } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, readStacksSession } from "@/chain/stacksSession";
import { useStacksWrite } from "@/chain/useStacksWrite";
import {
  PENNY_STX_CONTRACT,
  PENNY_STX_DEPLOYER,
  PENNY_STX_SELF_REGISTER_FN,
} from "@/chain/stacksContracts";
import { pennyAbi } from "@/lib/abi/penny";
import { HAIKU_TIER, PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";
import { ChatComposer } from "@/components/ChatComposer";

/**
 * Owns the chain-aware submit handler for the chat composer.
 *
 * - Celo: writes `selfRegisterMessage(msgHash, tierId, reportedCost)` directly
 *   so the user can sign their own message-debit without a relay.
 * - Stacks: invokes Clarity `penny.self-register-message(msg-hash, tier-id)`
 *   through @stacks/connect.
 *
 * The relay is still TODO — this is the user-self-debit path that proves the
 * full chat → onchain loop on either chain.
 */
export function ChatComposerClient() {
  const { kind } = useChainKind();
  const { isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({ hash });
  const stx = useStacksWrite();
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const msgHash = keccak256(toBytes(trimmed));

    if (kind === "celo") {
      if (!isConnected || !isPennyDeployed) return;
      // reportedCost left at 0 — the relay path normally fills this; here we
      // exercise the on-chain debit shape so the user can sign their own.
      writeContract({
        abi: pennyAbi,
        address: PENNY_ADDRESS,
        functionName: "selfRegisterMessage",
        args: [msgHash, HAIKU_TIER, 0n],
      });
      return;
    }

    setBusy(true);
    try {
      let s = readStacksSession();
      if (!s.isConnected) {
        s = await connectStacks();
        if (!s.isConnected) return;
      }
      await stx.call({
        contractAddress: PENNY_STX_DEPLOYER,
        contractName: PENNY_STX_CONTRACT,
        functionName: PENNY_STX_SELF_REGISTER_FN,
        args: [
          { type: "buff", value: msgHash },
          { type: "uint", value: BigInt(HAIKU_TIER) },
        ],
      });
    } finally {
      setBusy(false);
    }
  }

  const disabled = kind === "celo" ? mining || isPending : busy || stx.pending;
  const placeholder =
    kind === "celo"
      ? "Ask anything — sign on Celo to debit cUSD…"
      : "Ask anything — sign on Stacks to debit STX…";

  return <ChatComposer onSubmit={send} disabled={disabled} placeholder={placeholder} />;
}
