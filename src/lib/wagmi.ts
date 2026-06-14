import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { stringToHex } from "viem";

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://penny.timjosh507.workers.dev";

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(wcProjectId
      ? [
          walletConnect({
            projectId: wcProjectId,
            metadata: {
              name: "Penny",
              description: "Pay only when it answers.",
              url: siteUrl,
              icons: [],
            },
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [celoAlfajores.id]: http(),
    [celo.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

const ZERO = "0x0000000000000000000000000000000000000000" as const;

export const PENNY_ADDRESS = (process.env.NEXT_PUBLIC_PENNY_ADDRESS ?? ZERO) as `0x${string}`;
export const CUSD_ADDRESS = (process.env.NEXT_PUBLIC_CUSD_ADDRESS ?? ZERO) as `0x${string}`;
export const ACTIVE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? celo.id);
export const isPennyDeployed = PENNY_ADDRESS !== ZERO;

// model ids match Penny.sol's tier registry seeded by the deploy script
export const HAIKU_TIER = stringToHex("haiku-4-5", { size: 32 });
export const SONNET_TIER = stringToHex("sonnet-4-6", { size: 32 });
export const OPUS_TIER = stringToHex("opus-4-7", { size: 32 });
