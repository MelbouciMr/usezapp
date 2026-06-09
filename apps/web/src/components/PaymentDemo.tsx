"use client";

import { useState } from "react";
import { useZappPayment } from "use-zapp";
import type { ZappAsset } from "use-zapp";
import styles from "./PaymentDemo.module.css";

const PHASE_LABELS: Record<string, string> = {
  depositing:  "① Depositing into pool…",
  proving:     "② Generating ZK proof…",
  withdrawing: "③ Withdrawing to recipient…",
  complete:    "✓ Payment complete",
  error:       "Payment failed",
};

export function PaymentDemo() {
  const { pay, status, isLoading, result, error, reset } = useZappPayment();
  const [amount,    setAmount]    = useState("10.00");
  const [recipient, setRecipient] = useState("");
  const [asset,     setAsset]     = useState<ZappAsset>("USDC");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await pay({ amount, recipient, asset });
  };

  if (status === "complete" && result) {
    return (
      <div className={styles.success}>
        <p className={styles.successLabel}>✓ Payment complete</p>
        <div className={styles.resultGrid}>
          <span className={styles.key}>amount</span>
          <span className={styles.val}>{result.amount} {result.asset}</span>
          <span className={styles.key}>network</span>
          <span className={styles.val}>Ethereum</span>
          <span className={styles.key}>tx</span>
          <a
            className={styles.txLink}
            href={`https://etherscan.io/tx/${result.withdrawalTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {result.withdrawalTxHash.slice(0, 18)}…
          </a>
          <span className={styles.key}>on-chain link?</span>
          <span className={styles.none}>none — ZK verified</span>
        </div>
        <button className={styles.reset} onClick={reset}>← new payment</button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label}>Asset</label>
        <select
          className={styles.select}
          value={asset}
          onChange={e => setAsset(e.target.value as ZappAsset)}
          disabled={isLoading}
        >
          <option value="USDC">USDC</option>
          <option value="USDS">USDS</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Amount</label>
        <input
          className={styles.input}
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          disabled={isLoading}
          placeholder="10.00"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Recipient address</label>
        <input
          className={styles.input}
          type="text"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          disabled={isLoading}
          placeholder="0x…"
        />
      </div>

      {isLoading && (
        <div className={styles.statusBar}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>{PHASE_LABELS[status]}</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBar}>{error.message}</div>
      )}

      <button
        className={styles.submit}
        type="submit"
        disabled={isLoading || !recipient || !amount}
      >
        {isLoading ? PHASE_LABELS[status] : "Send privately via ZAPP →"}
      </button>
    </form>
  );
}
