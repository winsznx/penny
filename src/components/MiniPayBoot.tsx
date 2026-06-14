"use client";

import { useEffect, useRef } from "react";
import { useAccount, useConnect } from "wagmi";

/**
 * MiniPay auto-connect. When the app is loaded inside the MiniPay in-app
 * browser, `window.ethereum.isMiniPay` is true — we auto-connect the injected
 * wallet so the user never sees a connect button. Outside MiniPay this is a
 * no-op.
 *
 * We resolve the connector through `useConnect().connectors` (the actual
 * wagmiConfig-registered injected connector) instead of constructing a
 * fresh `injected({ target: "metaMask" })`. The fresh-construct path:
 *   1. targets MetaMask via `window.ethereum.isMetaMask` — MiniPay never sets
 *      that flag, so it gets skipped and the auto-connect silently no-ops.
 *   2. returns a connector not registered in wagmiConfig, so wagmi's state
 *      doesn't track it.
 * Pulling the registered injected connector avoids both.
 */
export function MiniPayBoot() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current || isConnected) return;
    const eth = (globalThis as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    if (!eth?.isMiniPay) return;
    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (!injectedConnector) return;
    tried.current = true;
    connect({ connector: injectedConnector });
  }, [isConnected, connect, connectors]);

  return null;
}
