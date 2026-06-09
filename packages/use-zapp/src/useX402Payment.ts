"use client";
// ─────────────────────────────────────────────
//  ZAPP Protocol — useX402Payment
// ─────────────────────────────────────────────

import { useState, useCallback } from "react";
import { useZappPayment } from "./useZappPayment";
import { useZappContext } from "./context";
import type { ZappAsset } from "./types";

export interface UseX402PaymentReturn {
  fetchWithPayment: (url: string, init?: RequestInit) => Promise<Response>;
  isPaying: boolean;
  error:    Error | null;
}

/**
 * useX402Payment — transparent x402 payment handler.
 *
 * On HTTP 402:
 *   1. Parses the X-Payment-Required header
 *   2. Pays privately via the ZAPP shielded pool
 *   3. Retries the request with X-Payment-Proof
 *
 * The API endpoint never learns which wallet paid.
 */
export function useX402Payment(): UseX402PaymentReturn {
  const { config }    = useZappContext();
  const { pay }       = useZappPayment();
  const [isPaying, setIsPaying] = useState(false);
  const [error,    setError]    = useState<Error | null>(null);

  const fetchWithPayment = useCallback(
    async (url: string, init?: RequestInit): Promise<Response> => {
      setError(null);

      const first = await fetch(url, init);
      if (first.status !== 402) return first;

      const header = first.headers.get("X-Payment-Required");
      if (!header) {
        const e = new Error("[zapp] 402 response missing X-Payment-Required header");
        setError(e);
        throw e;
      }

      let info: { recipient: string; amount: string; asset?: ZappAsset };
      try {
        info = JSON.parse(header);
      } catch {
        const e = new Error("[zapp] Could not parse X-Payment-Required header");
        setError(e);
        throw e;
      }

      setIsPaying(true);
      try {
        const result = await pay({
          amount:              info.amount,
          recipient:           info.recipient,
          asset:               info.asset ?? config.defaultAsset,
          x402PaymentPointer:  url,
        });

        if (!result) {
          const e = new Error("[zapp] Payment failed or was cancelled");
          setError(e);
          throw e;
        }

        return fetch(url, {
          ...init,
          headers: {
            ...(init?.headers ?? {}),
            "X-Payment-Proof": JSON.stringify({
              withdrawalTxHash: result.withdrawalTxHash,
              nullifier:        result.nullifier,
              chain:            result.chain,
            }),
          },
        });
      } finally {
        setIsPaying(false);
      }
    },
    [pay, config],
  );

  return { fetchWithPayment, isPaying, error };
}
