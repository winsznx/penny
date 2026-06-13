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
 * full chat → onchain loop on either chain. We surface the resulting tx hash
 * (and any error) inline so the user can see something actually happened.
 */
export function ChatComposerClient() {
  const { kind } = useChainKind();
  const { isConnected } = useAccount();
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });
  const stx = useStacksWrite();
  const [busy, setBusy] = useState(false);
  const [lastMsgHash, setLastMsgHash] = useState<`0x${string}` | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLocalError(null);
    resetWrite();
    stx.reset();

    const msgHash = keccak256(toBytes(trimmed));
    setLastMsgHash(msgHash);

    if (kind === "celo") {
      if (!isConnected) {
        setLocalError("Connect a wallet first.");
        return;
      }
      if (!isPennyDeployed) {
        setLocalError("Penny contract not deployed on this network.");
        return;
      }
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
        if (!s.isConnected) {
          setLocalError("Stacks wallet not connected.");
          return;
        }
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

  const errorMessage =
    localError ??
    (kind === "celo"
      ? writeError
        ? writeError.message.split("\n")[0]
        : null
      : stx.error);

  const txid = kind === "celo" ? hash : stx.txid;

  return (
    <div className="space-y-2">
      {(errorMessage || txid || lastMsgHash) && (
        <div className="mx-auto max-w-2xl px-3 text-[12px] font-mono text-stone-text">
          {errorMessage && <p className="text-red-600">{errorMessage}</p>}
          {txid && (
            <p>
              tx <span className="text-midnight">{txid.slice(0, 12)}…</span>
              {mining && " · mining…"}
            </p>
          )}
          {lastMsgHash && !errorMessage && (
            <p className="text-stone-text/70">
              msg hash <span className="text-midnight">{lastMsgHash.slice(0, 12)}…</span>{" "}
              (paste in Dispute panel if needed)
            </p>
          )}
        </div>
      )}
      <ChatComposer onSubmit={send} disabled={disabled} placeholder={placeholder} />
    </div>
  );
}
