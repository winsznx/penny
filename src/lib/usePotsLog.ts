"use client";

import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { celo } from "wagmi/chains";
import { getPublicClient } from "wagmi/actions";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

const LOOKBACK = 200_000n;

/**
 * Recent MessageRegistered event slice. Used by the chat + topup history so
 * react-query dedupes the underlying getLogs call.
 */
export function useRecentMessages() {
  const config = useConfig();
  return useQuery({
    queryKey: ["penny-msg-log", celo.id, PENNY_ADDRESS],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: celo.id });
      if (!client) return [];
      const head = await client.getBlockNumber();
      const from = head > LOOKBACK ? head - LOOKBACK : 0n;
      const eventAbi = pennyAbi.find(
        (i) => i.type === "event" && i.name === "MessageRegistered",
      ) as Extract<(typeof pennyAbi)[number], { type: "event"; name: "MessageRegistered" }>;
      return client.getLogs({
        address: PENNY_ADDRESS,
        event: eventAbi,
        fromBlock: from,
        toBlock: head,
      });
    },
    enabled: isPennyDeployed,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
