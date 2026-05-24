# Architecture

Penny is a prepaid escrow: users top up cUSD into the contract, each message debits a tiered cost, the relayer (or user) settles the spend on-chain. The worker has no model — it just shows balance, signs the debit, and reads logs.

```
Browser ── HTML/JS ──> Cloudflare Worker (Next.js 16 / OpenNext)
                              │
                              ▼
                       wagmi v3 + viem v2
                              │
                              ▼
                    forno.celo.org (reads)
                       Celo mainnet (42220)
                              │
                              ▼
                    Penny.sol
                       │   │   │
                       │   │   └── claimMilestone (badge NFT)
                       │   └────── confirmBatch (relay-only)
                       └────────── topUp / selfRegister (user pay)
                              │
                              ▼
                    cUSD ERC20 (Mento Dollar)
```

## Tiers

Models are registered by the owner via `registerTier(modelId, baseCostWei)`. The user picks a tier, optionally locks the rate for a window, and message hashes get registered against that locked rate. Disputes flow through `disputeMessage` / `resolveDispute`.

## Trust boundary

- The relay is the only party that can call `confirmBatch`. It's wallet-controlled and rotatable via `setRelay`.
- Users can self-register (`selfRegisterMessage`) which debits their own balance immediately — no relay needed for the user-pays path.
- Refunds via `resolveDispute` are owner-controlled.
