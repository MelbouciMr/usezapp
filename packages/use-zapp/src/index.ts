// ─────────────────────────────────────────────
//  ZAPP Protocol — SDK exports
// ─────────────────────────────────────────────

export { useZappPayment }                         from "./useZappPayment";
export { useX402Payment }                         from "./useX402Payment";
export type { UseX402PaymentReturn }              from "./useX402Payment";
export { ZappProvider }                           from "./context";
export { ZappOnchainClient, generateNullifier, generateSecret, deriveCommitment } from "./client";
export type {
  ZappChain,
  ZappAsset,
  ZappPaymentStatus,
  ZappPaymentRequest,
  ZappPaymentResult,
  ZappConfig,
  ZappWalletAdapter,
  ZappTransaction,
  ZKProof,
  CommitmentHash,
  Nullifier,
  UseZappPaymentReturn,
} from "./types";
