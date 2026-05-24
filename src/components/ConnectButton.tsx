"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [picker, setPicker] = useState(false);

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
