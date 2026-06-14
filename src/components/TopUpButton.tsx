"use client";

import { useEffect, useState } from "react";
import { erc20Abi, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { readStacksSession, connectStacks } from "@/chain/stacksSession";
import { useStacksWrite } from "@/chain/useStacksWrite";
import {
  PENNY_STX_CONTRACT,
  PENNY_STX_DEPLOYER,
  PENNY_STX_TOP_UP_FN,
} from "@/chain/stacksContracts";
import { pennyAbi } from "@/lib/abi/penny";
import { CUSD_ADDRESS, PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

const PRESETS_CELO = [1, 5, 10, 25];
const PRESETS_STACKS = [1, 5, 10, 25];

/**
 * Top-up entry point. On Celo this is a two-step ERC20 approve + Penny.topUp
 * write through wagmi. On Stacks it dynamically loads @stacks/connect and
 * fires top-up(uint) directly on the Clarity contract for the chosen amount.
 */
export function TopUpButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState<number>(5);
  const [phase, setPhase] = useState<"idle" | "approving" | "depositing">("idle");

  const wei = parseUnits(amount.toString(), 18);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, PENNY_ADDRESS] : undefined,
    query: { enabled: kind === "celo" && isConnected && isPennyDeployed && !!address },
  });

  const { writeContract, data: hash, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });
  const stx = useStacksWrite();

  // Refetch allowance after the approve receipt confirms so the next click
  // actually fires Penny.topUp instead of sending a second approve.
  useEffect(() => {
    if (confirmed && phase === "approving") {
      void refetchAllowance();
      setPhase("depositing");
    }
  }, [confirmed, phase, refetchAllowance]);

  const [stxAddr, setStxAddr] = useState<string | null>(null);
  useEffect(() => {
    if (kind !== "stacks") return;
    setStxAddr(readStacksSession().address);
  }, [kind]);

  const presets = kind === "celo" ? PRESETS_CELO : PRESETS_STACKS;
  const needsApprove = kind === "celo" && (!allowance || (allowance as bigint) < wei);

  async function topUp() {
    if (kind === "celo") {
      if (!isConnected) return;
      if (needsApprove) {
        setPhase("approving");
        writeContract({
          abi: erc20Abi,
          address: CUSD_ADDRESS,
          functionName: "approve",
          args: [PENNY_ADDRESS, wei],
        });
        return;
      }
      setPhase("depositing");
      writeContract({
        abi: pennyAbi,
        address: PENNY_ADDRESS,
        functionName: "topUp",
        args: [wei],
      });
      return;
    }

    // Stacks branch — ensure connected, then call top-up(uint)
    let s = readStacksSession();
    if (!s.isConnected) {
      s = await connectStacks();
      setStxAddr(s.address);
      if (!s.isConnected) return;
    }
    const microStx = BigInt(amount) * 1_000_000n;
    // NOTE on post-condition mode: the deployed `penny.top-up` Clarity is
    // currently a stub that does not stx-transfer? from tx-sender — so a
    // `deny + willSendEq(microStx)` post-condition would make the wallet
    // refuse to sign (no transfer == post-condition violated). We stay on
    // `allow` until the contract is finished; flip to `deny` + exact STX
    // post-condition the same day the SIP-010 transfer lands in penny.clar.
    await stx.call({
      contractAddress: PENNY_STX_DEPLOYER,
      contractName: PENNY_STX_CONTRACT,
      functionName: PENNY_STX_TOP_UP_FN,
      args: [{ type: "uint", value: microStx }],
    });
  }

  const ctaCelo = mining
    ? phase === "approving"
      ? "Approving…"
      : "Depositing…"
    : needsApprove
      ? `Approve $${amount} cUSD`
      : `Top up $${amount}`;

  const ctaStacks = stx.pending
    ? "Confirm in wallet…"
    : stxAddr
      ? `Top up ${amount} STX`
      : `Connect Stacks to top up`;

  const enabledCelo = isConnected && isPennyDeployed && !mining;
  const enabledStacks = !stx.pending;
  const enabled = kind === "celo" ? enabledCelo : enabledStacks;
  const cta = kind === "celo" ? ctaCelo : ctaStacks;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={`px-3 py-1.5 rounded-full font-mono text-xs border transition-colors ${
              amount === p
                ? "border-sky-blue text-sky-blue"
                : "border-stone-border text-stone-text hover:text-midnight"
            }`}
          >
            {kind === "celo" ? `$${p}` : `${p} STX`}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={topUp}
        disabled={!enabled}
        className="btn-pill-dark text-sm disabled:opacity-40"
      >
        {cta}
      </button>
      {(hash || stx.txid) && (
        <button
          type="button"
          onClick={() => {
            reset();
            stx.reset();
          }}
          className="text-xs text-stone-text underline"
        >
          reset
        </button>
      )}
      {stx.error && (
        <span className="text-xs text-red-600 font-mono">{stx.error}</span>
      )}
    </div>
  );
}
