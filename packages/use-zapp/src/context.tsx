"use client";
// ─────────────────────────────────────────────
//  ZAPP Protocol — Provider + Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useMemo } from "react";
import type { ZappConfig, ZappAsset, ZappChain } from "./types";
import { ZappOnchainClient } from "./client";

// ── Ethereum mainnet contract addresses ───────────────────────────────────────
// Replace with your deployed addresses once contracts are live.
const PLACEHOLDER = "0x0000000000000000000000000000000000000000" as `0x${string}`;

const DEFAULT_CHAIN: ZappChain = "ethereum";
const DEFAULT_ASSET: ZappAsset = "USDC";

interface ZappContextValue {
  client: ZappOnchainClient;
  config: Required<ZappConfig>;
}

const ZappContext = createContext<ZappContextValue | null>(null);

export function ZappProvider({
  config,
  children,
}: {
  config: ZappConfig;
  children: React.ReactNode;
}) {
  const full: Required<ZappConfig> = {
    shieldedPoolAddress: config.shieldedPoolAddress ?? PLACEHOLDER,
    verifierAddress:     config.verifierAddress     ?? PLACEHOLDER,
    usdcAddress:         config.usdcAddress         ?? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    usdsAddress:         config.usdsAddress         ?? "0xdC035D45d973E3EC169d2276DDab16f1e407384F",
    defaultChain:        config.defaultChain        ?? DEFAULT_CHAIN,
    defaultAsset:        config.defaultAsset        ?? DEFAULT_ASSET,
    walletAdapter:       config.walletAdapter,
    proverUrl:           config.proverUrl           ?? "",
    debug:               config.debug               ?? false,
  };

  const client = useMemo(() => new ZappOnchainClient(full), [
    full.shieldedPoolAddress,
    full.proverUrl,
    full.debug,
  ]);

  const value = useMemo(() => ({ client, config: full }), [client, full]);

  return <ZappContext.Provider value={value}>{children}</ZappContext.Provider>;
}

export function useZappContext(): ZappContextValue {
  const ctx = useContext(ZappContext);
  if (!ctx) throw new Error("[zapp] Must be used inside <ZappProvider>.");
  return ctx;
}
