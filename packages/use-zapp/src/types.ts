// ─────────────────────────────────────────────
//  ZAPP Protocol — Types
// ─────────────────────────────────────────────

export type ZappChain = "ethereum" | "ethereum-sepolia";
export type ZappAsset = "USDC" | "USDS";

export type ZappPaymentStatus =
  | "idle"
  | "depositing"
  | "proving"
  | "withdrawing"
  | "complete"
  | "error";

export interface ZappPaymentRequest {
  amount: string;
  recipient: string;
  asset?: ZappAsset;
  memo?: string;
  x402PaymentPointer?: string;
}

export type CommitmentHash = `0x${string}`;
export type Nullifier      = `0x${string}`;

export interface ZKProof {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  publicInputs: string[];
}

export interface ZappPaymentResult {
  commitmentHash:    CommitmentHash;
  nullifier:         Nullifier;
  proof:             ZKProof;
  withdrawalTxHash:  string;
  resolvedRecipient: string;
  chain:             ZappChain;
  asset:             ZappAsset;
  amount:            string;
  completedAt:       Date;
}

export interface UseZappPaymentReturn {
  status:         ZappPaymentStatus;
  isLoading:      boolean;
  error:          Error | null;
  commitmentHash: CommitmentHash | null;
  proof:          ZKProof | null;
  result:         ZappPaymentResult | null;
  pay:            (request: ZappPaymentRequest) => Promise<ZappPaymentResult | null>;
  reset:          () => void;
}

export interface ZappConfig {
  // Ethereum contract addresses (deployed on mainnet)
  shieldedPoolAddress:  `0x${string}`;
  verifierAddress:      `0x${string}`;
  usdcAddress?:         `0x${string}`;
  usdsAddress?:         `0x${string}`;

  defaultChain?:  ZappChain;
  defaultAsset?:  ZappAsset;
  walletAdapter:  ZappWalletAdapter;

  // Optional: external prover service URL.
  // If omitted, proofs are generated client-side via WASM.
  proverUrl?: string;

  debug?: boolean;
}

export interface ZappWalletAdapter {
  address:         string | null;
  chainId:         number | null;
  sendTransaction: (tx: ZappTransaction) => Promise<string>;
  signMessage:     (message: string) => Promise<string>;
}

export interface ZappTransaction {
  to:    `0x${string}`;
  data:  `0x${string}`;
  value?: bigint;
}

// ── Contract ABIs (minimal, used by viem encodeFunctionData) ──────────────────

export const SHIELDED_POOL_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset",          type: "address" },
      { name: "amount",         type: "uint256" },
      { name: "commitmentHash", type: "bytes32" },
    ],
    outputs: [{ name: "merkleIndex", type: "uint32" }],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proof",     type: "bytes"   },
      { name: "nullifier", type: "bytes32" },
      { name: "recipient", type: "address" },
      { name: "asset",     type: "address" },
      { name: "amount",    type: "uint256" },
      { name: "root",      type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "merkleRoot",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "nullifierUsed",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "nullifier", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
