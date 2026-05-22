"use client";

import { useState } from "react";
import { formatUnits, keccak256, stringToHex } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { pennyAbi } from "@/lib/abi/penny";
import { HAIKU_TIER, PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

type SendState = "idle" | "blocked-noconn" | "blocked-nofunds" | "signing" | "mining" | "sent";

/**
 * Billing-gated message composer. Send calls selfRegisterMessage so the on-chain
 * debit happens at the moment the user hits Send — no relay required. The
 * 24h dispute window still applies if a message wasn't actually delivered.
 */
export function ChatComposer() {
  const { address, isConnected } = useAccount();
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<SendState>("idle");

  const { data: rate } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "effectiveRate",
    args: address ? [address, HAIKU_TIER] : undefined,
    query: { enabled: isConnected && isPennyDeployed && !!address, refetchInterval: 60_000 },
  });

  const { data: account } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "getAccount",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && isPennyDeployed && !!address, refetchInterval: 30_000 },
  });

  const rateBn = typeof rate === "bigint" ? rate : 0n;
  const balanceBn = account?.balance ?? 0n;

  const costStr = `~$${Number(formatUnits(rateBn, 18)).toFixed(4)}`;
  const hasFunds = balanceBn >= rateBn && rateBn > 0n;

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash });

  function send() {
    if (!isConnected) {
      setState("blocked-noconn");
      return;
    }
    if (!isPennyDeployed) {
      setState("blocked-nofunds");
      return;
    }
    if (!hasFunds) {
      setState("blocked-nofunds");
      return;
    }
    setState("signing");
    const msgHash = keccak256(stringToHex(`${address}:${Date.now()}:${draft}`));
    writeContract({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "selfRegisterMessage",
      args: [msgHash, HAIKU_TIER, rateBn],
    });
  }

  if (confirmed && state !== "sent") {
    setState("sent");
    setDraft("");
    setTimeout(() => setState("idle"), 2400);
  } else if (mining && state !== "mining") {
    setState("mining");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="w-full bg-white border-t border-stone-border p-4 md:p-6 shrink-0">
      <div className="max-w-3xl mx-auto relative">
        <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none">
          <div
            className={`text-xs font-mono px-3 py-1 rounded-t-lg shadow-sm ${
              hasFunds || !isConnected
                ? "bg-sky-blue text-white"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            Cost per message: {costStr}
          </div>
        </div>

        <div
          className={`bg-warm-stone border rounded-xl p-2 flex items-end gap-2 shadow-sm transition-all ${
            state === "blocked-nofunds" || state === "blocked-noconn"
              ? "border-amber-200 ring-2 ring-amber-100"
              : "border-stone-border focus-within:border-sky-blue focus-within:ring-2 focus-within:ring-sky-blue/20"
          }`}
        >
          <textarea
            placeholder="Message Penny… (Shift+Enter for new line)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 min-h-[50px] max-h-[150px] resize-none font-body text-midnight"
            rows={1}
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || isPending || mining}
            className="bg-sky-blue hover:bg-sky-blue/90 text-white rounded-lg p-3 m-1 transition-colors shadow-sm flex items-center justify-center self-end disabled:opacity-40"
            aria-label="Send message"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div className="mt-3 text-xs text-stone-text/70 flex flex-wrap items-center justify-between gap-2">
          <span>AI can make mistakes. Paid messages are debited from your cUSD balance.</span>
          {isConnected && isPennyDeployed && (
            <span className="font-mono">
              Balance:{" "}
              <span className="text-midnight font-medium">
                ${Number(formatUnits(balanceBn, 18)).toFixed(2)}
              </span>
            </span>
          )}
        </div>

        {state === "blocked-noconn" && (
          <p className="mt-2 text-xs text-amber-700">Connect a wallet first.</p>
        )}
        {state === "blocked-nofunds" && (
          <p className="mt-2 text-xs text-amber-700">
            Top up your balance — message cost {costStr}.
          </p>
        )}
        {state === "signing" && (
          <p className="mt-2 text-xs text-stone-text">Waiting for wallet signature…</p>
        )}
        {state === "mining" && (
          <p className="mt-2 text-xs text-stone-text">Mining your debit…</p>
        )}
        {state === "sent" && (
          <p className="mt-2 text-xs text-emerald-600">
            Debited {costStr}. 24h dispute window open.
          </p>
        )}
      </div>
    </div>
  );
}
