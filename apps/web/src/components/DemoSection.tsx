import { PaymentDemo } from "./PaymentDemo";
import styles from "./DemoSection.module.css";

export function DemoSection() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.num}>005</span>
        <span className={styles.title}>Live demo</span>
        <span className={styles.badge}>Base Sepolia</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>Connect your wallet</p>
          <h2 className={styles.h2}>Try it now.</h2>
          <p className={styles.body}>
            Connect a wallet with Base Sepolia testnet funds and send a
            private payment. Watch the three phases in real time —
            deposit, prove, withdraw.
          </p>
          <div className={styles.note}>
            <span className={styles.noteLabel}>Need testnet funds?</span>
            <a
              href="https://faucet.base.org"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.noteLink}
            >
              faucet.base.org ↗
            </a>
          </div>
        </div>

        <div className={styles.right}>
          <PaymentDemo />
        </div>
      </div>
    </section>
  );
}
