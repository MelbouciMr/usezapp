import styles from "./Features.module.css";

const FEATURES = [
  {
    num: "01",
    title: "useZappPayment()",
    body: "Full approve → deposit → prove → withdraw flow in one hook. Status, errors, and ZK proof — all typed and reactive. Abort on unmount included.",
  },
  {
    num: "02",
    title: "useX402Payment()",
    body: "Drop-in fetch wrapper. Detects 402 responses, pays via the shielded pool privately, and retries with X-Payment-Proof. Agents pay APIs without revealing identity.",
  },
  {
    num: "03",
    title: "ZappProvider",
    body: "Context-based config. Pass your contract addresses and wallet adapter once, use hooks anywhere in the tree. Works with wagmi, viem, and custom adapters.",
  },
  {
    num: "04",
    title: "On-chain only",
    body: "No backend, no custody, no API keys. Every interaction goes directly to the ShieldedPool contract on Ethereum. Immutable and unstoppable by design.",
  },
  {
    num: "05",
    title: "PLONK verified",
    body: "Every withdrawal is verified on-chain by the PlonkVerifier contract. Proofs are generated client-side via WASM — your nullifier and secret never leave the browser.",
  },
  {
    num: "06",
    title: "Fully typed",
    body: "End-to-end TypeScript. ZKProof, CommitmentHash, Nullifier, and all request/result types exported. ZappConfig enforces your contract addresses at compile time.",
  },
];

export function Features() {
  return (
    <section className={styles.section} id="hooks">
      <div className={styles.header}>
        <span className={styles.num}>001</span>
        <span className={styles.title}>What you get</span>
      </div>
      <div className={styles.grid}>
        {FEATURES.map(f => (
          <div key={f.num} className={styles.card}>
            <span className={styles.cardNum}>{f.num}</span>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardBody}>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
