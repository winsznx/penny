# Security

## Disclosure

Found something exploitable? Open a private security advisory on the repo. Do NOT open a public issue for:

- Anything that lets you debit another user's balance
- Anything that lets you bypass the dispute window
- Anything that mints a milestone NFT you didn't earn
- Compromise of `relay` privilege

## Out of scope

- Front-end XSS that needs attacker-injected JS already
- Forno RPC availability — not our surface
- Anything requiring the owner key to first leak

## What we ship today

`Penny.sol` uses OZ `ReentrancyGuard`, `Ownable`, `Pausable`. Tier registry is owner-managed. The relay role is rotatable. Tests in `test/` cover top-up, register, settle, dispute, milestone happy paths and a few edge cases. Audit is informal — independent eyes welcome.
