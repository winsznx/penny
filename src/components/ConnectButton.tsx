"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { useStacksSession } from "@/chain/useStacksSession";
import {
  connectStacks,
  disconnectStacks,
  isStacksWalletAvailable,
} from "@/chain/stacksSession";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function ConnectButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [picker, setPicker] = useState(false);
  const [stxAvail, setStxAvail] = useState<boolean | null>(null);
  const [stxBusy, setStxBusy] = useState(false);
  const [stxInstallOpen, setStxInstallOpen] = useState(false);
  const { address: stxAddr } = useStacksSession();

  useEffect(() => {
    if (kind !== "stacks") return;
    isStacksWalletAvailable().then(setStxAvail);
  }, [kind]);

  const isStacksConnected = useMemo(() => kind === "stacks" && !!stxAddr, [kind, stxAddr]);

  if (kind === "stacks") {
    if (isStacksConnected && stxAddr) {
      return (
        <button
          type="button"
          onClick={async () => {
            await disconnectStacks();
          }}
          className="btn-secondary font-mono text-sm"
          title="Click to disconnect"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          {short(stxAddr)}
        </button>
      );
    }

    if (stxAvail === false) {
      return (
        <div className="relative">
          <button
            type="button"
            className="btn-pill-dark"
            onClick={() => setStxInstallOpen((v) => !v)}
          >
            Install Stacks wallet
          </button>
          {stxInstallOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 feature-card space-y-2 p-3 text-sm">
              <p className="text-xs text-stone-text">
                Penny needs Leather or Xverse to sign Stacks transactions.
              </p>
              <a
                href="https://leather.io/install-extension"
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-stone-border bg-stone-surface px-3 py-2 hover:border-sky-blue"
              >
                Install Leather ↗
              </a>
              <a
                href="https://www.xverse.app/download"
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-stone-border bg-stone-surface px-3 py-2 hover:border-sky-blue"
              >
                Install Xverse ↗
              </a>
              <button
                type="button"
                onClick={async () => {
                  const next = await isStacksWalletAvailable();
                  setStxAvail(next);
                  if (next) setStxInstallOpen(false);
                }}
                className="block w-full rounded-lg border border-stone-border bg-white px-3 py-2 text-xs text-stone-text hover:text-midnight"
              >
                I just installed one — retry
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        disabled={stxBusy}
        className="btn-pill-dark disabled:opacity-50"
        onClick={async () => {
          setStxBusy(true);
          try {
            await connectStacks();
          } finally {
            setStxBusy(false);
          }
        }}
      >
        {stxBusy ? "Opening wallet…" : "Connect Stacks"}
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
