"use client";
// ─────────────────────────────────────────────
//  ZAPP Protocol — useZappPayment
// ─────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import type {
  ZappPaymentRequest,
  ZappPaymentResult,
  ZappPaymentStatus,
  ZKProof,
  CommitmentHash,
  Nullifier,
  UseZappPaymentReturn,
  ZappAsset,
} from "./types";
import {
  deriveCommitment,
  generateNullifier,
  generateSecret,
} from "./client";
import { useZappContext } from "./context";

export function useZappPayment(): UseZappPaymentReturn {
  const { client, config } = useZappContext();

  const [status,         setStatus]         = useState<ZappPaymentStatus>("idle");
  const [error,          setError]          = useState<Error | null>(null);
  const [commitmentHash, setCommitmentHash] = useState<CommitmentHash | null>(null);
  const [proof,          setProof]          = useState<ZKProof | null>(null);
  const [result,         setResult]         = useState<ZappPaymentResult | null>(null);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus("idle");
    setError(null);
    setCommitmentHash(null);
    setProof(null);
    setResult(null);
    setTimeout(() => { abortRef.current = false; }, 0);
  }, []);

  const pay = useCallback(
    async (req: ZappPaymentRequest): Promise<ZappPaymentResult | null> => {
      abortRef.current = false;
      const { walletAdapter, defaultAsset } = config;
      const asset: ZappAsset = req.asset ?? defaultAsset;

      if (!walletAdapter.address) {
        const e = new Error("[zapp] Wallet not connected.");
        setError(e);
        setStatus("error");
        return null;
      }

      try {
        // ── 1. APPROVE ──────────────────────────────────────────────────────
        setStatus("depositing");
        setError(null);

        const approveTx = client.buildApproveTx(asset, req.amount);
        await walletAdapter.sendTransaction(approveTx);
        if (abortRef.current) return null;

        // ── 2. DEPOSIT ──────────────────────────────────────────────────────
        const nullifier  = generateNullifier() as Nullifier;
        const secret     = generateSecret();
        const commitment = await deriveCommitment(nullifier, secret);
        if (abortRef.current) return null;

        const depositTx = client.buildDepositTx(asset, req.amount, commitment);
        await walletAdapter.sendTransaction(depositTx);
        if (abortRef.current) return null;
        setCommitmentHash(commitment);

        // ── 3. PROVE ────────────────────────────────────────────────────────
        setStatus("proving");

        // merkleRoot and merkleIndex would be fetched via viem readContract
        // from ShieldedPool.merkleRoot() after the deposit tx confirms.
        // Placeholder until contract is deployed:
        const merkleRoot  = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
        const merkleIndex = 0;

        const { proof: zkProof, encodedProof } = await client.generateProof({
          commitmentHash: commitment,
          nullifier,
          secret,
          merkleIndex,
          merkleRoot,
          amount: req.amount,
          asset,
        });
        if (abortRef.current) return null;
        setProof(zkProof);

        // ── 4. WITHDRAW ─────────────────────────────────────────────────────
        setStatus("withdrawing");

        const withdrawTx = client.buildWithdrawTx({
          encodedProof,
          nullifier,
          recipient: req.recipient as `0x${string}`,
          asset,
          amount:    req.amount,
          merkleRoot,
        });
        if (abortRef.current) return null;

        const withdrawalTxHash = await walletAdapter.sendTransaction(withdrawTx);
        if (abortRef.current) return null;

        const paymentResult: ZappPaymentResult = {
          commitmentHash: commitment,
          nullifier,
          proof:          zkProof,
          withdrawalTxHash,
          resolvedRecipient: req.recipient,
          chain:   config.defaultChain,
          asset,
          amount:  req.amount,
          completedAt: new Date(),
        };

        setResult(paymentResult);
        setStatus("complete");
        return paymentResult;

      } catch (err) {
        if (abortRef.current) return null;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setStatus("error");
        return null;
      }
    },
    [client, config],
  );

  return {
    status,
    isLoading: ["depositing", "proving", "withdrawing"].includes(status),
    error,
    commitmentHash,
    proof,
    result,
    pay,
    reset,
  };
}
