import styles from "./CodeSection.module.css";

function CodeBlock({ filename, code }: { filename: string; code: string }) {
  return (
    <div className={styles.codeWrap}>
      <div className={styles.codeHeader}>
        <span className={styles.dot1} />
        <span className={styles.dot2} />
        <span className={styles.dot3} />
        <span className={styles.filename}>{filename}</span>
      </div>
      <pre className={styles.pre}><code>{code}</code></pre>
    </div>
  );
}

export function CodeSection() {
  return (
    <section className={styles.section} id="how-it-works">

      <div className={styles.row}>
        <div className={styles.prose}>
          <p className={styles.eyebrow}>002 · basic usage</p>
          <h2 className={styles.h2}>One hook.<br /><em className={styles.em}>Fully private.</em></h2>
          <p className={styles.body}>
            Wrap your app in ZappProvider with your deployed contract addresses,
            connect your wallet adapter, call{" "}
            <code className={styles.inlineCode}>pay()</code>. Approve, deposit,
            prove, and withdraw happen under the hood — all on-chain.
          </p>
          <div className={styles.pills}>
            {["TypeScript", "React 18+", "wagmi v2", "viem"].map(p => (
              <span key={p} className={styles.pill}>{p}</span>
            ))}
          </div>
        </div>
        <CodeBlock filename="PayButton.tsx" code={`import { useZappPayment } from "use-zapp"

export function PayButton() {
  const {
    pay, status, isLoading, result
  } = useZappPayment()

  const handlePay = async () => {
    await pay({
      amount:    "10.00",     // USDC
      recipient: "0xFresh…", // any address
      asset:     "USDC",
    })
  }

  return (
    <button onClick={handlePay} disabled={isLoading}>
      {isLoading ? status : "Pay 10 USDC privately"}
    </button>
  )
}`} />
      </div>

      <div className={styles.divider} />

      <div className={styles.row}>
        <div className={styles.prose}>
          <p className={styles.eyebrow}>003 · x402 endpoints</p>
          <h2 className={styles.h2}>Pay APIs<br /><em className={styles.em}>privately.</em></h2>
          <p className={styles.body}>
            <code className={styles.inlineCode}>fetchWithPayment()</code> wraps
            fetch. On HTTP 402, pays via the shielded pool and retries with
            X-Payment-Proof. The API never learns which wallet paid.
          </p>
          <div className={styles.pills}>
            {["x402 protocol", "X-Payment-Proof", "auto-retry", "zero identity"].map(p => (
              <span key={p} className={styles.pill}>{p}</span>
            ))}
          </div>
        </div>
        <CodeBlock filename="AgentFetcher.tsx" code={`import { useX402Payment } from "use-zapp"

export function AgentFetcher() {
  const { fetchWithPayment, isPaying }
    = useX402Payment()

  const fetchData = async () => {
    // 402 → auto-pay → retry
    const res = await fetchWithPayment(
      "https://api.example.com/premium"
    )
    const data = await res.json()
    console.log(data)
  }

  return (
    <button onClick={fetchData}>
      {isPaying ? "paying…" : "fetch data"}
    </button>
  )
}`} />
      </div>

      <div className={styles.divider} />

      <div className={styles.row}>
        <div className={styles.prose}>
          <p className={styles.eyebrow}>004 · setup</p>
          <h2 className={styles.h2}>One provider.<br /><em className={styles.em}>Your contracts.</em></h2>
          <p className={styles.body}>
            Pass your deployed{" "}
            <code className={styles.inlineCode}>shieldedPoolAddress</code> and{" "}
            <code className={styles.inlineCode}>verifierAddress</code> once.
            The SDK talks directly to those contracts — no intermediary.
          </p>
          <div className={styles.pills}>
            {["immutable contracts", "wagmi v2", "viem", "Ethereum mainnet"].map(p => (
              <span key={p} className={styles.pill}>{p}</span>
            ))}
          </div>
        </div>
        <CodeBlock filename="layout.tsx" code={`import { ZappProvider } from "use-zapp"
import { myWalletAdapter } from "@/lib/wallet"

export default function Layout({ children }) {
  return (
    <ZappProvider
      config={{
        shieldedPoolAddress: "0x…",
        verifierAddress:     "0x…",
        walletAdapter: myWalletAdapter,
        defaultChain:  "ethereum",
        defaultAsset:  "USDC",
        debug: true,
      }}
    >
      {children}
    </ZappProvider>
  )
}`} />
      </div>

    </section>
  );
}
