# Contributing

Quick guide for sending changes.

## Setup

```bash
pnpm install
cp .env.example .env # if present
```

Foundry needed for any change under `contracts/`.

## Style

- Branch off `main`. One concern per branch.
- Brief, specific commits. Lowercase prefix (`/chat:`, `Header:`, `cusd:`).
- No co-authored-by, no backdating, no `--no-verify`.

## Checks

```bash
pnpm lint
pnpm exec tsc --noEmit
forge test
```

## UI

- Light "warm-stone" palette is the canonical theme. Don't introduce hard-coded greys — use `--color-*` tokens.
- Mobile-first. Verify at 375px before submitting.
- All cooldown UIs need a state-driven ticker (or `useNowSec`) — `Date.now()` in render is a bug.

## Solidity

- Custom errors over `require("string")`.
- One event per state change, indexed actor first where present.
- Reentrancy guards on every external call that moves cUSD.
