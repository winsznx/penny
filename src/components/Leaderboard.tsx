"use client";

import { useMemo, useState } from "react";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { useQuery } from "@tanstack/react-query";
import { celo } from "wagmi/chains";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";
import { fetchActorAggregates, formatCusd, shortAddr, type ActorEvent } from "@/lib/leaderboard";
import {
  fetchStacksAggregates,
  shortStxAddress,
  type StacksAggregateEntry,
} from "@/lib/stacksLeaderboard";

type ChainTab = "celo" | "stacks";

const STACKS_CONTRACTS = [
  "SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.penny",
  "SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.penny-streak",
] as const;

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

type Row = {
  address: string;
  actions: number;
  valueLabel: string;
  lastBlock: string;
  eventBreakdown: Record<string, number>;
};

export function Leaderboard() {
  const config = useConfig();
  const [chain, setChain] = useState<ChainTab>("celo");

  const celoQuery = useQuery({
    queryKey: ["penny-leaderboard-celo", celo.id, PENNY_ADDRESS],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: celo.id });
      if (!client) return [];
      return fetchActorAggregates({
        client,
        address: PENNY_ADDRESS,
        abi: pennyAbi,
        events: ACTOR_EVENTS,
      });
    },
    enabled: chain === "celo" && isPennyDeployed,
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  const stacksQuery = useQuery<StacksAggregateEntry[]>({
    queryKey: ["penny-leaderboard-stacks"],
    queryFn: () => fetchStacksAggregates({ contractIds: [...STACKS_CONTRACTS], perContractLimit: 50 }),
    enabled: chain === "stacks",
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  const rows: Row[] = useMemo(() => {
    if (chain === "celo") {
      return (celoQuery.data ?? []).map((r) => ({
        address: r.address,
        actions: r.actions,
        valueLabel: formatCusd(r.valueWei),
        lastBlock: `#${r.lastBlock.toString()}`,
        eventBreakdown: r.eventBreakdown,
      }));
    }
    return (stacksQuery.data ?? []).map((r) => ({
      address: r.address,
      actions: r.actions,
      valueLabel: (Number(r.microStxMoved) / 1_000_000).toFixed(4),
      lastBlock: `#${r.lastBlock}`,
      eventBreakdown: r.eventBreakdown,
    }));
  }, [chain, celoQuery.data, stacksQuery.data]);

  const top = useMemo(() => rows.slice(0, PAGE_SIZE), [rows]);
  const totalActions = useMemo(() => rows.reduce((s, r) => s + r.actions, 0), [rows]);
  const totalValue = useMemo(() => {
    if (chain === "celo") return (celoQuery.data ?? []).reduce((s, r) => s + r.valueWei, 0n);
    return (stacksQuery.data ?? []).reduce((s, r) => s + r.microStxMoved, 0n);
  }, [chain, celoQuery.data, stacksQuery.data]);
  const isLoading = chain === "celo" ? celoQuery.isLoading : stacksQuery.isLoading;
  const dataUpdatedAt = chain === "celo" ? celoQuery.dataUpdatedAt : stacksQuery.dataUpdatedAt;

  if (chain === "celo" && !isPennyDeployed) {
    return (
      <div className="bg-white border border-stone-border rounded-2xl p-12 text-center">
        <p className="text-stone-text font-mono">Penny contract not deployed on this network.</p>
      </div>
    );
  }

  return (
    <div>
      <ChainToggle chain={chain} onChange={setChain} />

      <div className="mt-6">
        <StatStrip
          uau={rows.length}
          actions={totalActions}
          value={totalValue}
          chain={chain}
          loading={isLoading}
        />
      </div>

      <div className="mt-8 bg-white border border-stone-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[56px_1fr_100px_140px_110px] items-center gap-4 px-6 py-4 bg-stone-surface border-b border-stone-border">
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold">Rank</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold">Address</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold text-right">Actions</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold text-right">
            {chain === "celo" ? "cUSD moved" : "STX fees"}
          </div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-stone-text font-mono font-semibold text-right">Last block</div>
        </div>

        {isLoading ? (
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
                <AddressCell address={row.address} breakdown={row.eventBreakdown} chain={chain} />
                <div className="text-right font-display font-bold text-[16px] text-midnight tabular-nums">{row.actions}</div>
                <div className="text-right text-sm text-stone-text font-mono tabular-nums">{row.valueLabel}</div>
                <div className="text-right text-xs text-stone-text font-mono tabular-nums">{row.lastBlock}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rows.length > PAGE_SIZE && (
        <p className="mt-4 text-xs text-stone-text font-mono text-center">
          Showing top {PAGE_SIZE} of {rows.length} unique addresses on {chain}
        </p>
      )}

      {dataUpdatedAt > 0 && (
        <p className="mt-2 text-xs text-stone-text font-mono text-center">
          Indexed at {new Date(dataUpdatedAt).toLocaleTimeString()} · refreshes every 90s
        </p>
      )}
    </div>
  );
}

function ChainToggle({ chain, onChange }: { chain: ChainTab; onChange: (c: ChainTab) => void }) {
  const tabs: { id: ChainTab; label: string; hint: string }[] = [
    { id: "celo", label: "Celo", hint: "cUSD events" },
    { id: "stacks", label: "Stacks", hint: "Hiro mainnet" },
  ];
  return (
    <div className="inline-flex rounded-full border border-stone-border bg-stone-surface p-1" role="tablist" aria-label="Chain selector">
      {tabs.map((t) => {
        const active = t.id === chain;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-mono transition-colors ${
              active ? "bg-white text-midnight shadow-sm" : "text-stone-text hover:text-midnight"
            }`}
          >
            {t.label}
            <span className="ml-2 text-[10px] opacity-60">{t.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatStrip({
  uau,
  actions,
  value,
  chain,
  loading,
}: {
  uau: number;
  actions: number;
  value: bigint;
  chain: ChainTab;
  loading: boolean;
}) {
  const valueLabel = chain === "celo" ? "cUSD MOVED" : "STX IN FEES";
  const valueValue = loading
    ? "…"
    : chain === "celo"
      ? formatCusd(value)
      : (Number(value) / 1_000_000).toFixed(4);
  const networkLabel = chain === "celo" ? "CELO" : "STACKS";
  const stats = [
    { label: "UNIQUE ACTORS", value: loading ? "…" : uau.toString() },
    { label: "TOTAL ACTIONS", value: loading ? "…" : actions.toString() },
    { label: valueLabel, value: valueValue },
    { label: "NETWORK", value: networkLabel },
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

function AddressCell({
  address,
  breakdown,
  chain,
}: {
  address: string;
  breakdown: Record<string, number>;
  chain: ChainTab;
}) {
  const top3 = Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const href =
    chain === "celo"
      ? `https://celoscan.io/address/${address}`
      : `https://explorer.hiro.so/address/${address}?chain=mainnet`;
  const label = chain === "celo" ? shortAddr(address) : shortStxAddress(address);
  return (
    <div className="min-w-0">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-[15px] font-bold text-midnight font-mono hover:text-sky-blue transition-colors block truncate"
      >
        {label}
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
