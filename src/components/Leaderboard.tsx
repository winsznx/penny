"use client";

import { useMemo } from "react";
import { useChainId, useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { useQuery } from "@tanstack/react-query";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";
import { fetchActorAggregates, formatCusd, shortAddr, type ActorEvent } from "@/lib/leaderboard";

const ACTOR_EVENTS: ActorEvent[] = [
  { name: "ToppedUp", actorArg: "account", valueArg: "amount" },
  { name: "Withdrawn", actorArg: "account", valueArg: "amount" },
  { name: "MessageRegistered", actorArg: "user", valueArg: "cost" },
  { name: "MessageSettled", actorArg: "user", valueArg: "cost" },
  { name: "MessageDisputed", actorArg: "user" },
  { name: "Tapped", actorArg: "user" },
  { name: "Introduced", actorArg: "user" },
  { name: "RateLocked", actorArg: "user" },
  { name: "MilestoneClaimed", actorArg: "user" },
];

const PAGE_SIZE = 25;

export function Leaderboard() {
  const chainId = useChainId();
  const config = useConfig();

  const query = useQuery({
    queryKey: ["penny-leaderboard", chainId, PENNY_ADDRESS],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId });
      if (!client) return [];
      return fetchActorAggregates({
        client,
        address: PENNY_ADDRESS,
        abi: pennyAbi,
        events: ACTOR_EVENTS,
      });
    },
    enabled: isPennyDeployed,
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  const rows = query.data ?? [];
  const top = useMemo(() => rows.slice(0, PAGE_SIZE), [rows]);
  const totalActions = useMemo(() => rows.reduce((s, r) => s + r.actions, 0), [rows]);
  const totalCusd = useMemo(() => rows.reduce((s, r) => s + r.valueWei, 0n), [rows]);

  if (!isPennyDeployed) {
    return (
      <div className="bg-white border border-stone-border rounded-2xl p-12 text-center">
        <p className="text-stone-text font-mono">Penny contract not deployed on this network.</p>
      </div>
    );
  }

  return (
    <div>
      <StatStrip uau={rows.length} actions={totalActions} cusd={totalCusd} loading={query.isLoading} />

      <div className="mt-8 bg-white border border-stone-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[56px_1fr_100px_140px_110px] items-center gap-4 px-6 py-4 bg-stone-surface border-b border-stone-border">
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold">Rank</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold">Address</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold text-right">Actions</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold text-right">cUSD moved</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold text-right">Last block</div>
        </div>

        {query.isLoading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-stone-text font-mono">Indexing on-chain events…</p>
          </div>
        ) : top.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-stone-text font-mono">No on-chain activity yet.</p>
          </div>
        ) : (
          <ul>
            {top.map((row, idx) => (
              <li
                key={row.address}
                className="grid grid-cols-[56px_1fr_100px_140px_110px] items-center gap-4 px-6 py-4 border-b border-stone-border last:border-b-0 hover:bg-stone-surface transition-colors"
              >
                <RankCell rank={idx + 1} />
                <AddressCell address={row.address} breakdown={row.eventBreakdown} />
                <div className="text-right font-display font-bold text-[16px] text-midnight tabular-nums">{row.actions}</div>
                <div className="text-right text-sm text-stone-text font-mono tabular-nums">{formatCusd(row.valueWei)}</div>
                <div className="text-right text-xs text-stone-text font-mono tabular-nums">#{row.lastBlock.toString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rows.length > PAGE_SIZE && (
        <p className="mt-4 text-xs text-stone-text font-mono text-center">
          Showing top {PAGE_SIZE} of {rows.length} unique addresses · ranked by total on-chain actions
        </p>
      )}

      {query.dataUpdatedAt > 0 && (
        <p className="mt-2 text-xs text-stone-text font-mono text-center">
          Indexed at {new Date(query.dataUpdatedAt).toLocaleTimeString()} · refreshes every 90s
        </p>
      )}
    </div>
  );
}

function StatStrip({ uau, actions, cusd, loading }: {
  uau: number; actions: number; cusd: bigint; loading: boolean;
}) {
  const stats = [
    { label: "UNIQUE ACTORS", value: loading ? "…" : uau.toString() },
    { label: "TOTAL ACTIONS", value: loading ? "…" : actions.toString() },
    { label: "cUSD MOVED", value: loading ? "…" : formatCusd(cusd) },
    { label: "NETWORK", value: "CELO" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-stone-border rounded-2xl px-6 py-5">
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono">{s.label}</div>
          <div className="mt-2 text-[28px] md:text-[32px] font-display font-bold text-midnight leading-tight tabular-nums">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function RankCell({ rank }: { rank: number }) {
  const color = rank === 1 ? "text-ember-orange" : rank <= 3 ? "text-midnight" : "text-stone-text";
  return (
    <div className={`text-[15px] font-bold font-mono tabular-nums ${color}`}>
      {rank.toString().padStart(2, "0")}
    </div>
  );
}

function AddressCell({ address, breakdown }: { address: string; breakdown: Record<string, number> }) {
  const top3 = Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <div className="min-w-0">
      <a
        href={`https://celoscan.io/address/${address}`}
        target="_blank"
        rel="noreferrer"
        className="text-[15px] font-bold text-midnight font-mono hover:text-sky-blue transition-colors block truncate"
      >
        {shortAddr(address)}
      </a>
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        {top3.map(([name, count]) => (
          <span
            key={name}
            className="text-[10px] uppercase tracking-[0.04em] text-stone-text font-mono px-1.5 py-0.5 bg-stone-surface border border-stone-border rounded"
          >
            {name} <span className="text-midnight font-semibold">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
