# ZAPP Protocol — React SDK

Monorepo for the `use-zapp` React SDK and its demo web app.
Private payments on Ethereum via a ZK shielded pool.

```
zapp/
├── packages/
│   └── use-zapp/           ← npm package (the hook SDK)
│       └── src/
│           ├── types.ts         ← types + contract ABIs
│           ├── client.ts        ← viem-based on-chain client
│           ├── context.tsx      ← ZappProvider
│           ├── useZappPayment.ts
│           └── useX402Payment.ts
└── apps/
    └── web/                ← Next.js demo site
```

## How it works

1. **Deposit** — user approves ERC-20, then deposits into `ShieldedPool.sol` with a commitment hash
2. **Prove** — ZK proof of Merkle membership generated client-side (WASM) or via optional prover service
3. **Withdraw** — proof submitted on-chain; funds sent to recipient with zero link to depositor

## Getting started

```bash
npm install
cd apps/web && npm run dev
```

## ZappConfig

```ts
import { ZappProvider } from "use-zapp"

<ZappProvider config={{
  shieldedPoolAddress: "0x…",   // your deployed ShieldedPool.sol
  verifierAddress:     "0x…",   // your deployed PlonkVerifier.sol
  walletAdapter:       adapter,
  defaultChain:        "ethereum",
  defaultAsset:        "USDC",
  proverUrl:           "",      // optional external prover; omit for client-side WASM
  debug:               false,
}}>
```

## Roadmap

- [ ] Circom circuit + compiled WASM/zkey for client-side proving
- [ ] ShieldedPool.sol + PlonkVerifier.sol (Ethereum mainnet)
- [ ] Poseidon hash replacing SHA-256 in commitment derivation
- [ ] Bonding curve + $ZAPP token
- [ ] ShieldedLending.sol

## Stack

| Layer       | Tech |
|-------------|------|
| Framework   | Next.js (App Router) |
| React       | 19 |
| Wallet      | wagmi v2 + viem |
| ZK          | PLONK (Circom + snarkjs) |
| Monorepo    | npm workspaces + Turbo |
| Language    | TypeScript 5 |
