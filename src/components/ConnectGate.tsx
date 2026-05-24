"use client";

import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "./ConnectButton";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackBody?: string;
};

/**
 * Wrapper that hides paywall-style sections from disconnected users and shows
 * a Connect CTA inline instead. Saves duplicating `if (!isConnected)` in
 * panel files.
 */
export function ConnectGate({
  children,
  fallbackTitle = "Connect to continue",
  fallbackBody = "Penny reads balances directly from your wallet — no email signup.",
}: Props) {
  const { isConnected } = useAccount();
  if (isConnected) return <>{children}</>;
  return (
    <div className="rounded-2xl border border-stone-border bg-white p-6 text-center">
      <h3 className="font-display text-lg font-semibold text-midnight">{fallbackTitle}</h3>
      <p className="mt-2 text-sm text-stone-text">{fallbackBody}</p>
      <div className="mt-4 inline-flex">
        <ConnectButton />
      </div>
    </div>
  );
}
