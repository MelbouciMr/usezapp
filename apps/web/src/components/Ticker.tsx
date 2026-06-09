"use client";

import styles from "./Ticker.module.css";

const ITEMS = [
  { label: "Base Batches 003", value: "Finalist ★" },
  { label: "Groth16", value: "On-chain" },
  { label: "Protocol", value: "ASP-compliant" },
  { label: "Standard", value: "x402" },
  { label: "Fork of", value: "Privacy Pools" },
  { label: "Chains", value: "Base + Solana" },
  { label: "License", value: "MIT" },
  { label: "Version", value: "0.1.0" },
];

export function Ticker() {
  const repeated = [...ITEMS, ...ITEMS];
  return (
    <div className={styles.wrap} role="marquee" aria-label="Product highlights">
      <div className={styles.inner}>
        {repeated.map((item, i) => (
          <span key={i} className={styles.item}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.sep}>·</span>
            <span className={styles.value}>{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
