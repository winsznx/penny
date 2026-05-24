"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, disconnectStacks, readStacksSession } from "@/chain/stacksSession";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function ConnectButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [picker, setPicker] = useState(false);
  const [stxAddr, setStxAddr] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== "stacks") return;
    const t = window.setTimeout(() => {
      const snap = readStacksSession();
      setStxAddr(snap.address);
    }, 0);
    return () => window.clearTimeout(t);
  }, [kind]);

  const isStacksConnected = useMemo(() => kind === "stacks" && !!stxAddr, [kind, stxAddr]);

  if (kind === "stacks") {
    if (isStacksConnected && stxAddr) {
      return (
        <button
          type="button"
          onClick={() => {
            disconnectStacks();
            setStxAddr(null);
          }}
          className="btn-secondary font-mono text-sm"
          title="Click to disconnect"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          {short(stxAddr)}
        </button>
      );
    }
    return (
      <button
        type="button"
        disabled={isPending}
        className="btn-pill-dark disabled:opacity-50"
        onClick={async () => {
          try {
            await connectStacks();
          } finally {
            const snap = readStacksSession();
            setStxAddr(snap.address);
          }
        }}
      >
        Connect Stacks
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="btn-secondary font-mono text-sm"
        title="Click to disconnect"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        {short(address)}
      </button>
    );
  }

  if (!picker) {
    return (
      <button
        type="button"
        onClick={() => setPicker(true)}
        disabled={isPending}
        className="btn-pill-dark disabled:opacity-50"
      >
        Connect wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setPicker(false)} className="btn-pill-dark">
        Choose wallet
      </button>
      <div className="absolute right-0 top-full mt-2 w-64 feature-card p-3 z-50 space-y-2">
        {connectors.length === 0 ? (
          <p className="text-xs text-stone-text">
            No wallet found. Install MiniPay, Valora, or MetaMask first.
          </p>
        ) : (
          connectors.map((c) => (
            <button
              key={c.uid}
              type="button"
              onClick={() => {
                connect({ connector: c });
                setPicker(false);
              }}
              disabled={isPending}
              className="w-full text-left px-3 py-2 rounded-lg bg-stone-surface hover:bg-white border border-stone-border hover:border-sky-blue transition-colors text-sm text-midnight disabled:opacity-50"
            >
              {c.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
