// ─────────────────────────────────────────────
//  ZAPP Protocol — On-chain client (viem-based)
// ─────────────────────────────────────────────
//
//  Replaces the old HTTP mock client.
//  All interactions go directly to the ShieldedPool contract on Ethereum.
//  ZK proofs are generated client-side via WASM (snarkjs) or optionally
//  delegated to an external prover service URL.
//
//  Contract addresses are injected via ZappConfig — nothing is hardcoded
//  here so the same SDK works on mainnet and Sepolia testnet.

import { encodeFunctionData, parseUnits } from "viem";
import type {
  ZappTransaction,
  ZappAsset,
  CommitmentHash,
  Nullifier,
  ZKProof,
  ZappConfig,
} from "./types";
import {
  SHIELDED_POOL_ABI,
  ERC20_APPROVE_ABI,
} from "./types";

// ── Constants ─────────────────────────────────────────────────────────────────

// USDC has 6 decimals; USDS has 18.
const ASSET_DECIMALS: Record<ZappAsset, number> = {
  USDC: 6,
  USDS: 18,
};

// ── ZappOnchainClient ─────────────────────────────────────────────────────────

export class ZappOnchainClient {
  private readonly poolAddress:  `0x${string}`;
  private readonly usdcAddress:  `0x${string}`;
  private readonly usdsAddress:  `0x${string}`;
  private readonly proverUrl:    string | null;
  private readonly debug:        boolean;

  // Ethereum mainnet token addresses (canonical)
  private static readonly MAINNET_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as `0x${string}`;
  private static readonly MAINNET_USDS = "0xdC035D45d973E3EC169d2276DDab16f1e407384F" as `0x${string}`;

  constructor(config: ZappConfig) {
    this.poolAddress = config.shieldedPoolAddress;
    this.usdcAddress = config.usdcAddress ?? ZappOnchainClient.MAINNET_USDC;
    this.usdsAddress = config.usdsAddress ?? ZappOnchainClient.MAINNET_USDS;
    this.proverUrl   = config.proverUrl ?? null;
    this.debug       = config.debug ?? false;
  }

  private log(...args: unknown[]) {
    if (this.debug) console.log("[zapp]", ...args);
  }

  // ── 1. ERC-20 approve tx ───────────────────────────────────────────────────
  // The pool is nonpayable — user must approve the token first.
  buildApproveTx(asset: ZappAsset, amount: string): ZappTransaction {
    const tokenAddress = asset === "USDC" ? this.usdcAddress : this.usdsAddress;
    const decimals     = ASSET_DECIMALS[asset];
    const amountWei    = parseUnits(amount, decimals);

    this.log("buildApproveTx", { asset, amount, amountWei });

    return {
      to:   tokenAddress,
      data: encodeFunctionData({
        abi:          ERC20_APPROVE_ABI,
        functionName: "approve",
        args:         [this.poolAddress, amountWei],
      }),
    };
  }

  // ── 2. Deposit tx ──────────────────────────────────────────────────────────
  buildDepositTx(
    asset:          ZappAsset,
    amount:         string,
    commitmentHash: CommitmentHash,
  ): ZappTransaction {
    const tokenAddress = asset === "USDC" ? this.usdcAddress : this.usdsAddress;
    const decimals     = ASSET_DECIMALS[asset];
    const amountWei    = parseUnits(amount, decimals);

    this.log("buildDepositTx", { asset, amount, commitmentHash });

    return {
      to:   this.poolAddress,
      data: encodeFunctionData({
        abi:          SHIELDED_POOL_ABI,
        functionName: "deposit",
        args:         [tokenAddress, amountWei, commitmentHash as `0x${string}`],
      }),
    };
  }

  // ── 3. Generate ZK proof ───────────────────────────────────────────────────
  // If proverUrl is set, delegates to an external service.
  // Otherwise expects the caller to use snarkjs WASM directly in the browser.
  // Stub: replace with real snarkjs call once circuits are compiled.
  async generateProof(params: {
    commitmentHash: CommitmentHash;
    nullifier:      Nullifier;
    secret:         string;
    merkleIndex:    number;
    merkleRoot:     `0x${string}`;
    amount:         string;
    asset:          ZappAsset;
  }): Promise<{ proof: ZKProof; encodedProof: `0x${string}` }> {
    this.log("generateProof", params);

    if (this.proverUrl) {
      const res = await fetch(`${this.proverUrl}/prove`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`[zapp] Prover error ${res.status}: ${await res.text()}`);
      return res.json();
    }

    // ── Client-side proving (snarkjs) ─────────────────────────────────────
    // TODO: import snarkjs and load the compiled .wasm + .zkey once circuits
    // are finalized. Example:
    //
    //   const { groth16 } = await import("snarkjs");
    //   const { proof, publicSignals } = await groth16.fullProve(
    //     { nullifier: params.nullifier, secret: params.secret, ... },
    //     "/zapp_withdraw.wasm",
    //     "/zapp_withdraw.zkey",
    //   );
    //   return { proof, encodedProof: encodeProof(proof) };
    //
    throw new Error(
      "[zapp] Client-side proving not yet configured. " +
      "Pass proverUrl in ZappConfig or integrate snarkjs WASM."
    );
  }

  // ── 4. Withdraw tx ─────────────────────────────────────────────────────────
  buildWithdrawTx(params: {
    encodedProof: `0x${string}`;
    nullifier:    Nullifier;
    recipient:    `0x${string}`;
    asset:        ZappAsset;
    amount:       string;
    merkleRoot:   `0x${string}`;
  }): ZappTransaction {
    const tokenAddress = params.asset === "USDC" ? this.usdcAddress : this.usdsAddress;
    const decimals     = ASSET_DECIMALS[params.asset];
    const amountWei    = parseUnits(params.amount, decimals);

    this.log("buildWithdrawTx", params);

    return {
      to:   this.poolAddress,
      data: encodeFunctionData({
        abi:          SHIELDED_POOL_ABI,
        functionName: "withdraw",
        args: [
          params.encodedProof,
          params.nullifier as `0x${string}`,
          params.recipient,
          tokenAddress,
          amountWei,
          params.merkleRoot,
        ],
      }),
    };
  }
}

// ── Crypto helpers ─────────────────────────────────────────────────────────────
// Poseidon is the ZK-friendly hash used in the Merkle tree and commitments.
// Until the WASM Poseidon library is loaded, we derive commitments with SHA-256
// as a placeholder — replace once circomlibjs is integrated.

export async function deriveCommitment(nullifier: string, secret: string): Promise<CommitmentHash> {
  // TODO: replace with Poseidon(nullifier, secret) via circomlibjs:
  //   import { buildPoseidon } from "circomlibjs";
  //   const poseidon = await buildPoseidon();
  //   const hash = poseidon([BigInt(nullifier), BigInt(secret)]);
  //   return ("0x" + poseidon.F.toString(hash, 16).padStart(64, "0")) as CommitmentHash;
  const data = new TextEncoder().encode(nullifier + secret);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  const hex  = Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}` as CommitmentHash;
}

export function generateNullifier(): Nullifier {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")}` as Nullifier;
}

export function generateSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}
