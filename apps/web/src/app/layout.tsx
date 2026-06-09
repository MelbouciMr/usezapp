import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "ZAPP Protocol · Private payments on Ethereum",
  description: "React hooks for zero-knowledge private payments on Ethereum. Deposit → prove → withdraw. No on-chain link between sender and receiver.",
  keywords: ["zapp", "zero-knowledge", "privacy", "ethereum", "shielded-pool", "react", "hooks", "x402"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
