"use client";

import { ReactNode, useMemo } from "react";
import {
  WagmiProvider, createConfig, http,
  useAccount, useSignMessage, useSendTransaction,
} from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, coinbaseWallet } from "@wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZappProvider } from "use-zapp";
import type { ZappWalletAdapter, ZappTransaction } from "use-zapp";

const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "ZAPP Protocol" }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

// ── Replace with deployed addresses once contracts are live ──────────────────
const SHIELDED_POOL_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const VERIFIER_ADDRESS      = "0x0000000000000000000000000000000000000000" as `0x${string}`;

function ZappWrapper({ children }: { children: ReactNode }) {
  const { address, chain }       = useAccount();
  const { signMessageAsync }     = useSignMessage();
  const { sendTransactionAsync } = useSendTransaction();

  const walletAdapter: ZappWalletAdapter = useMemo(() => ({
    address: address ?? null,
    chainId: chain?.id ?? null,
    signMessage:     (msg: string) => signMessageAsync({ message: msg }),
    sendTransaction: async (tx: ZappTransaction) =>
      sendTransactionAsync({ to: tx.to, data: tx.data, value: tx.value }),
  }), [address, chain, signMessageAsync, sendTransactionAsync]);

  return (
    <ZappProvider config={{
      shieldedPoolAddress: SHIELDED_POOL_ADDRESS,
      verifierAddress:     VERIFIER_ADDRESS,
      walletAdapter,
      defaultChain: "ethereum",
      defaultAsset: "USDC",
      debug: true,
    }}>
      {children}
    </ZappProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZappWrapper>{children}</ZappWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
