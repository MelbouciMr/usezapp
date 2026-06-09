import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <img src="/pfp_zapp.png" alt="ZAPP Protocol" className={styles.logoMark} width={28} height={28} />
          <span>ZAPP</span>
        </div>
        <p className={styles.tagline}>
          Privacy is for all, including your agents.
        </p>
      </div>

      <div className={styles.links}>
        <div className={styles.col}>
          <p className={styles.colTitle}>Package</p>
          <a href="https://npmjs.com" target="_blank" rel="noopener noreferrer">npm</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">github</a>
          <a href="/docs">docs</a>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Protocol</p>
          <a href="#how-it-works">shielded pool</a>
          <a href="https://x402.org" target="_blank" rel="noopener noreferrer">x402</a>
          <a href="https://ethereum.org" target="_blank" rel="noopener noreferrer">Ethereum</a>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Research</p>
          <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4563364" target="_blank" rel="noopener noreferrer">Privacy Pools paper</a>
          <a href="https://docs.circom.io" target="_blank" rel="noopener noreferrer">Circom</a>
          <a href="https://docs.snarkjs.io" target="_blank" rel="noopener noreferrer">snarkjs</a>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© 2026 ZAPP Protocol · MIT License · ZK shielded pool · PLONK · x402</p>
      </div>
    </footer>
  );
}
