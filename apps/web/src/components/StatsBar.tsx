"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./StatsBar.module.css";

const STATS = [
  { value: 3,    suffix: "",  label: "phases",        sub: "deposit · prove · withdraw" },
  { value: 4,    suffix: "",  label: "chains",         sub: "base · base-sepolia · solana · devnet" },
  { value: 100,  suffix: "%", label: "ASP-compliant",  sub: "clean subset by construction" },
  { value: 0,    suffix: "",  label: "on-chain links", sub: "between sender and receiver" },
];

function useCountUp(target: number, duration = 1200, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (target === 0) { setVal(0); return; }
    const steps = 40;
    const step = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(current));
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return val;
}

function StatCard({ value, suffix, label, sub, delay }: {
  value: number; suffix: string; label: string; sub: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, 1000, visible);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={styles.card}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={styles.num}>
        {count}{suffix}
      </div>
      <div className={styles.label}>{label}</div>
      <div className={styles.sub}>{sub}</div>
    </div>
  );
}

export function StatsBar() {
  return (
    <section className={styles.section}>
      {STATS.map((s, i) => (
        <StatCard key={s.label} {...s} delay={i * 0.1} />
      ))}
    </section>
  );
}
