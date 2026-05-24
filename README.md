# penny

> Pay only when it answers. Premium AI chat without the monthly subscription.

Pay-per-message AI billed in cUSD on Celo. Top up once, send messages, settle on chain.

- Live worker: <https://penny.timjosh507.workers.dev>
- Network: Celo mainnet (chain id 42220)
- Penny contract: [`0x48767c49a9d81e90fd07363ecc030f864f454769`](https://celoscan.io/address/0x48767c49a9d81e90fd07363ecc030f864f454769)
- Settlement token: cUSD ([`0x765DE816845861e75A25fCA122bb6898B8B1282a`](https://celoscan.io/address/0x765DE816845861e75A25fCA122bb6898B8B1282a))

## Stack

- Next.js 16 on Cloudflare Workers via OpenNext
- React 19 + TypeScript
- Tailwind CSS v4
- wagmi v3 + viem v2 for chain reads/writes
- Foundry for Solidity

## Develop

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

## Deploy

```bash
pnpm exec opennextjs-cloudflare build
pnpm exec opennextjs-cloudflare deploy
```

Build-time env vars: `NEXT_PUBLIC_PENNY_ADDRESS`, `NEXT_PUBLIC_CUSD_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID`.

## Contracts

```bash
forge build
forge test
```

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Marketing landing + balance + lock-rate explainer |
| `/chat` | Wallet-aware chat where each message debits the prepaid balance |
| `/leaderboard` | All-time on-chain activity |

## License

MIT — see [LICENSE](./LICENSE).
