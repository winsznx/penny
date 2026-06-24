"use client";

import { useEffect, useState } from "react";
import { formatUnits, stringToHex } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

type PendingMessageTuple = readonly [
  user: `0x${string}`,
  cost: bigint,
  registeredAt: bigint,
  settledAt: bigint,
  modelId: `0x${string}`,
  disputed: boolean,
  resolved: boolean,
];

const REASON_CODES = [
  { code: "hallucinated", label: "Output was hallucinated" },
  { code: "wrong-tier", label: "Charged the wrong model tier" },
  { code: "incomplete", label: "Reply cut off / incomplete" },
  { code: "model-down", label: "Model errored before completing" },
  { code: "other", label: "Other" },
] as const;

const isHex = (v: string): v is `0x${string}` => /^0x[0-9a-fA-F]{64}$/.test(v);

/**
 * Dispute a debit inside the 24h window. The contract enforces:
 *   - sender is the user the message was registered against
 *   - the message hasn't already been resolved or disputed
 *   - block.timestamp < registeredAt + 24h
 * We probe pendingMessages(msgHash) and surface the exact gating live, so
 * the user only signs an actually-eligible dispute.
 */
export function DisputeMessagePanel() {
  // Hooks-first: every hook must run on both chain branches so the order
  // stays stable across chain toggle. The Stacks gate is rendered AFTER.
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [msgHash, setMsgHash] = useState("");
  const [reason, setReason] = useState<typeof REASON_CODES[number]["code"]>("hallucinated");
  const [nowSec, setNowSec] = useState(0);

  useEffect(() => {
    const initial = window.setTimeout(() => setNowSec(Math.floor(Date.now() / 1000)), 0);
    const id = window.setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, []);

  const validHash = isHex(msgHash);

  const { data: pending } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "pendingMessages",
    args: validHash ? [msgHash] : undefined,
    query: { enabled: validHash && isPennyDeployed && isConnected, refetchInterval: 20_000 },
  });

  const tuple = pending as PendingMessageTuple | undefined;
  const isYours = tuple && address ? tuple[0].toLowerCase() === address.toLowerCase() : false;
  const resolved = tuple?.[6] ?? false;
  const alreadyDisputed = tuple?.[5] ?? false;
  const cost = tuple?.[1] ?? 0n;
  const registeredAt = Number(tuple?.[2] ?? 0n);
  const windowEnds = registeredAt + 24 * 60 * 60;
  // Gate on nowSec > 0 so a freshly-registered message doesn't flicker as
  // "windowClosed" when nowSec is still 0 on first paint.
  const windowClosed = registeredAt > 0 && nowSec > 0 && nowSec > windowEnds;
  const exists =
    tuple && tuple[0] !== "0x0000000000000000000000000000000000000000" && registeredAt > 0;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash });

  const eligible =
    isConnected &&
    isPennyDeployed &&
    validHash &&
    exists &&
    isYours &&
    !resolved &&
    !alreadyDisputed &&
    !windowClosed;

  function submit() {
    if (!eligible) return;
    writeContract({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "disputeMessage",
      args: [msgHash as `0x${string}`, stringToHex(reason, { size: 32 })],
    });
  }

  const status = (() => {
    if (!isPennyDeployed) return "Penny contract not deployed yet.";
    if (!isConnected) return "Connect a wallet to dispute.";
    if (!msgHash.trim()) return "Paste the message hash from your receipt.";
    if (!validHash) return "Hash must be a 0x-prefixed 32-byte hex string.";
    if (!exists) return "No pending message recorded for that hash.";
    if (!isYours) return "That message wasn't billed against your wallet.";
    if (resolved) return "Message already resolved — too late to dispute.";
    if (alreadyDisputed) return "Already disputed. Owner will resolve.";
    if (windowClosed) {
      const passed = Math.floor((nowSec - windowEnds) / 3600);
      return `Dispute window closed (${passed}h past 24h).`;
    }
    const hoursLeft = Math.max(0, Math.ceil((windowEnds - nowSec) / 3600));
    return `Eligible — ${hoursLeft}h left in the dispute window.`;
  })();

  const costStr = cost > 0n ? Number(formatUnits(cost, 18)).toFixed(4) : "—";

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Message disputes" />;
  }

  return (
    <div className="rounded-xl border border-stone-border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-midnight text-sm">Dispute a debit</span>
        <span className="font-mono text-xs text-stone-text">24h window</span>
      </div>

      <div>
        <label
          htmlFor="dispute-msg-hash"
          className="text-xs font-mono uppercase tracking-widest text-stone-text block mb-1"
        >
          Message hash
        </label>
        <input
          id="dispute-msg-hash"
          type="text"
          value={msgHash}
          onChange={(e) => setMsgHash(e.target.value.trim())}
          placeholder="0x… 32-byte hash from the relay receipt"
          className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-stone-border bg-warm-stone text-midnight"
        />
      </div>

      <div>
        <label
          htmlFor="dispute-reason"
          className="text-xs font-mono uppercase tracking-widest text-stone-text block mb-1"
        >
          Reason
        </label>
        <select
          id="dispute-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as typeof reason)}
          className="w-full font-body text-sm px-3 py-2 rounded-lg border border-stone-border bg-warm-stone text-midnight"
        >
          {REASON_CODES.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <p
        className={`text-xs ${
          eligible ? "text-emerald-600" : "text-stone-text"
        } font-mono leading-snug`}
      >
        {status}
      </p>
      {exists && (
        <p className="text-xs text-stone-text font-mono">
          debit was <span className="text-midnight">${costStr}</span>
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!eligible || mining || isPending}
        aria-busy={mining || isPending}
        className="w-full btn-pill-dark text-sm disabled:opacity-40"
      >
        {mining ? "Mining…" : isPending ? "Waiting for wallet…" : "Open dispute"}
      </button>

      {hash && (
        <div className="text-xs text-stone-text flex items-center gap-2">
          <a
            href={`https://celoscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-sky-blue underline"
          >
            view tx ↗ <span className="font-mono">({hash.slice(0, 10)}…)</span>
          </a>
          {confirmed && <span className="text-emerald-600">disputed ✓</span>}
          <button type="button" onClick={() => reset()} className="ml-auto underline">
            reset
          </button>
        </div>
      )}
    </div>
  );
}
