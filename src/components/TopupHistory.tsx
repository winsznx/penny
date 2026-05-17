"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useChainId, useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

type Row = {
  kind: "topup" | "withdraw";
  amount: bigint;
  block: bigint;
  txHash: `0x${string}`;
};

const LOOKBACK_BLOCKS = 50_000n;

/**
 * Pulls the connected user's ToppedUp + Withdrawn events from the contract
 * within the last ~50k blocks and surfaces them as a chronological history.
 *
 * Uses viem's getLogs directly so it works without an indexer/subgraph —
 * fine for the current scale, will graduate to Chainhook + Supabase as volume
 * grows.
 */
export function TopupHistory() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !isPennyDeployed || !address) {
      setRows(null);
      return;
    }

    let cancelled = false;
    setErr(null);

    (async () => {
      try {
        const client = getPublicClient(config, { chainId });
        if (!client) {
          setErr("No public client");
          return;
        }
        const head = await client.getBlockNumber();
        const from = head > LOOKBACK_BLOCKS ? head - LOOKBACK_BLOCKS : 0n;

        const topupAbi = pennyAbi.find(
          (i) => i.type === "event" && i.name === "ToppedUp",
        ) as Extract<(typeof pennyAbi)[number], { type: "event"; name: "ToppedUp" }>;
        const withdrawAbi = pennyAbi.find(
          (i) => i.type === "event" && i.name === "Withdrawn",
        ) as Extract<(typeof pennyAbi)[number], { type: "event"; name: "Withdrawn" }>;

        const [topups, withdraws] = await Promise.all([
          client.getLogs({
            address: PENNY_ADDRESS,
            event: topupAbi,
            args: { account: address },
            fromBlock: from,
            toBlock: head,
          }),
          client.getLogs({
            address: PENNY_ADDRESS,
            event: withdrawAbi,
            args: { account: address },
            fromBlock: from,
            toBlock: head,
          }),
        ]);

        const collected: Row[] = [
          ...topups.map((l) => ({
            kind: "topup" as const,
            amount: l.args.amount ?? 0n,
            block: l.blockNumber,
            txHash: l.transactionHash,
          })),
          ...withdraws.map((l) => ({
            kind: "withdraw" as const,
            amount: l.args.amount ?? 0n,
            block: l.blockNumber,
            txHash: l.transactionHash,
          })),
        ].sort((a, b) => Number(b.block - a.block));

        if (!cancelled) setRows(collected);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address, chainId, config]);

  if (!isPennyDeployed) {
    return (
      <p className="text-sm text-stone-text">Penny contract not configured yet.</p>
    );
  }
  if (!isConnected) {
    return <p className="text-sm text-stone-text">Connect to see your activity.</p>;
  }
  if (err) {
    return <p className="text-sm text-amber-700">Could not load history: {err}</p>;
  }
  if (rows === null) {
    return <p className="text-sm text-stone-text font-mono">scanning…</p>;
  }
  if (rows.length === 0) {
    return <p className="text-sm text-stone-text">No top-ups or withdrawals yet.</p>;
  }

  return (
    <ul className="divide-y divide-stone-border">
      {rows.slice(0, 12).map((r) => (
        <li
          key={`${r.txHash}-${r.kind}`}
          className="py-3 flex items-center justify-between text-sm"
        >
          <span className="font-mono text-stone-text">
            {r.kind === "topup" ? "↓ top-up" : "↑ withdraw"}
          </span>
          <span className="font-mono text-midnight">
            ${Number(formatUnits(r.amount, 18)).toFixed(2)}
          </span>
          <a
            href={`https://celoscan.io/tx/${r.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-stone-text underline"
          >
            {r.txHash.slice(0, 8)}…
          </a>
        </li>
      ))}
    </ul>
  );
}
