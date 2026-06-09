"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./CurveSection.module.css";

// ── Curve math ────────────────────────────────────────────────────────────────
// price(s) = P0 * (Pf/P0)^(s/Smax)
// reserve(s) = (P0/λ) * ((Pf/P0)^(s/Smax) - 1)   where λ = ln(Pf/P0)/Smax

const ZERO1 = { p0: 0.0152, pf: 0.303, capM: 21, fee: 0.25 };

function spotPrice(s: number, p0: number, pf: number, sMax: number) {
  return p0 * Math.pow(pf / p0, s / sMax);
}

function reserve(s: number, p0: number, pf: number, sMax: number) {
  const lambda = Math.log(pf / p0) / sMax;
  return (p0 / lambda) * (Math.pow(pf / p0, s / sMax) - 1);
}

function quoteBuy(usdIn: number, currentSupply: number, p0: number, pf: number, sMax: number): number {
  // Numerical integration: how many tokens does usdIn buy from currentSupply?
  const steps = 200;
  let remaining = usdIn;
  let tokens = 0;
  const step = sMax / steps / 1000;
  let s = currentSupply;
  while (remaining > 0 && s < sMax) {
    const price = spotPrice(s, p0, pf, sMax);
    const cost = price * step;
    if (cost > remaining) {
      tokens += remaining / price;
      remaining = 0;
    } else {
      remaining -= cost;
      tokens += step;
      s += step;
    }
  }
  return tokens;
}

function quoteSell(tokenIn: number, currentSupply: number, p0: number, pf: number, sMax: number): number {
  const steps = 200;
  let remaining = tokenIn;
  let usd = 0;
  const step = sMax / steps / 1000;
  let s = currentSupply;
  while (remaining > 0 && s > 0) {
    const price = spotPrice(s, p0, pf, sMax);
    const chunk = Math.min(remaining, step);
    usd += chunk * price;
    remaining -= chunk;
    s -= chunk;
  }
  return usd;
}

const POINTS = 60;

function buildCurvePoints(p0: number, pf: number, capM: number) {
  const sMax = capM * 1e6 * 0.99;
  const prices: number[] = [];
  const reserves: number[] = [];
  const labels: string[] = [];
  for (let i = 0; i <= POINTS; i++) {
    const s = (i / POINTS) * sMax;
    prices.push(spotPrice(s, p0, pf, sMax));
    reserves.push(reserve(s, p0, pf, sMax) / 1e6);
    labels.push((s / 1e6).toFixed(1));
  }
  return { prices, reserves, labels, sMax };
}

// ── Simulated on-chain state ──────────────────────────────────────────────────
// Replace with viem readContract calls once ShieldedPool + BondingCurve deployed.
// Curve01.spotPrice(), Curve01.reserveUsds(), Curve01.minted()

const INITIAL_MINTED_PCT = 0.18; // 18% minted — simulates early stage

// ── Component ─────────────────────────────────────────────────────────────────

export function CurveSection() {
  // Curve params
  const [p0,    setP0]    = useState(0.010);
  const [pf,    setPf]    = useState(1.000);
  const [capM,  setCapM]  = useState(10);
  const [fee,   setFee]   = useState(0.50);

  // Simulated live state
  const sMax         = capM * 1e6 * 0.99;
  const mintedTokens = sMax * INITIAL_MINTED_PCT;
  const currentPrice = spotPrice(mintedTokens, p0, pf, sMax);
  const currentReserve = reserve(mintedTokens, p0, pf, sMax);
  const ratio        = currentReserve / (currentPrice * mintedTokens) * 100;

  // Swap state
  const [swapDir,    setSwapDir]    = useState<"buy" | "sell">("buy");
  const [inputVal,   setInputVal]   = useState("");
  const [outputVal,  setOutputVal]  = useState("");
  const [swapStatus, setSwapStatus] = useState<"idle"|"confirming"|"done"|"error">("idle");

  // Chart canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);

  // Recompute swap quote
  useEffect(() => {
    const v = parseFloat(inputVal);
    if (!v || v <= 0) { setOutputVal(""); return; }
    const feeMultiplier = 1 - fee / 100;
    if (swapDir === "buy") {
      const tokens = quoteBuy(v, mintedTokens, p0, pf, sMax) * feeMultiplier;
      setOutputVal(tokens.toFixed(4));
    } else {
      const usd = quoteSell(v, mintedTokens, p0, pf, sMax) * feeMultiplier;
      setOutputVal(usd.toFixed(4));
    }
  }, [inputVal, swapDir, p0, pf, capM, fee]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const loadChart = async () => {
      if (!(window as any).Chart) {
        await new Promise<void>((res) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
          s.onload = () => res();
          document.head.appendChild(s);
        });
      }
      const Chart = (window as any).Chart;
      const { prices, labels } = buildCurvePoints(p0, pf, capM);
      const { prices: z1prices } = buildCurvePoints(ZERO1.p0, ZERO1.pf, ZERO1.capM);
      const mintedIdx = Math.round(INITIAL_MINTED_PCT * POINTS);

      if (chartRef.current) chartRef.current.destroy();

      chartRef.current = new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "ZAPP",
              data: prices,
              borderColor: "#c8d5c9",
              borderWidth: 2,
              pointRadius: prices.map((_, i) => i === mintedIdx ? 5 : 0),
              pointBackgroundColor: "#c8d5c9",
              tension: 0.35,
              fill: {
                target: "origin",
                above: "rgba(200,213,201,0.06)",
              },
            },
            {
              label: "zero1.cash",
              data: z1prices,
              borderColor: "rgba(255,255,255,0.18)",
              borderWidth: 1.5,
              pointRadius: 0,
              tension: 0.35,
              fill: false,
              borderDash: [5, 5],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#161618",
              borderColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
              titleColor: "#888",
              bodyColor: "#f0f0f0",
              callbacks: {
                label: (ctx: any) => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(4)}`,
              },
            },
          },
          scales: {
            x: {
              title: { display: true, text: "supply (M tokens)", color: "#555560", font: { size: 11 } },
              ticks: { color: "#555560", maxTicksLimit: 8 },
              grid:  { color: "rgba(255,255,255,0.04)" },
            },
            y: {
              title: { display: true, text: "price (USD)", color: "#555560", font: { size: 11 } },
              ticks: { color: "#555560", callback: (v: any) => `$${Number(v).toFixed(3)}` },
              grid:  { color: "rgba(255,255,255,0.04)" },
            },
          },
        },
      });
    };

    loadChart();
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [p0, pf, capM]);

  // Simulated swap
  const handleSwap = useCallback(async () => {
    const v = parseFloat(inputVal);
    if (!v || v <= 0 || !outputVal) return;
    setSwapStatus("confirming");
    await new Promise(r => setTimeout(r, 1800));
    setSwapStatus("done");
    setTimeout(() => { setSwapStatus("idle"); setInputVal(""); setOutputVal(""); }, 2800);
  }, [inputVal, outputVal]);

  const ratio_pf_p0 = Math.round(pf / p0);
  const midPrice    = p0 * Math.pow(pf / p0, 0.5);
  const maxReserveM = (reserve(sMax, p0, pf, sMax) / 1e6).toFixed(1);

  return (
    <section className={styles.section} id="curve">

      <div className={styles.header}>
        <span className={styles.eyebrow}>005</span>
        <span className={styles.title}>$ZAPP bonding curve</span>
        <span className={styles.sub}>
          Immutable · no owner · reserve earns sUSDS yield
        </span>
      </div>

      {/* ── Stats ── */}
      <div className={styles.stats}>
        {[
          { label: "ratio Pf/P0",           value: `${ratio_pf_p0}x` },
          { label: "price at 50% supply",    value: `$${midPrice.toFixed(3)}` },
          { label: "max reserve",            value: `$${maxReserveM}M` },
          { label: "token cap",              value: `${capM}M` },
          { label: "current price",          value: `$${currentPrice.toFixed(4)}` },
          { label: "collateral ratio",       value: `${ratio.toFixed(0)}%` },
        ].map(s => (
          <div key={s.label} className={styles.stat}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.body}>

        {/* ── Left: chart + sliders ── */}
        <div className={styles.left}>

          <div className={styles.sliders}>
            {[
              { label: "P0 — initial price", id: "p0", min: 1, max: 50, step: 1,
                value: Math.round(p0 * 1000),
                display: `$${p0.toFixed(3)}`,
                onChange: (v: number) => setP0(v / 1000) },
              { label: "Pf — final price", id: "pf", min: 10, max: 500, step: 5,
                value: Math.round(pf * 100),
                display: `$${pf.toFixed(2)}`,
                onChange: (v: number) => setPf(v / 100) },
              { label: "token cap", id: "cap", min: 1, max: 100, step: 1,
                value: capM,
                display: `${capM}M`,
                onChange: (v: number) => setCapM(v) },
              { label: "fee burn %", id: "fee", min: 10, max: 200, step: 5,
                value: Math.round(fee * 100),
                display: `${fee.toFixed(2)}%`,
                onChange: (v: number) => setFee(v / 100) },
            ].map(s => (
              <div key={s.id} className={styles.sliderRow}>
                <span className={styles.sliderLabel}>{s.label}</span>
                <input
                  type="range" min={s.min} max={s.max} step={s.step}
                  value={s.value}
                  onChange={e => s.onChange(parseInt(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderVal}>{s.display}</span>
              </div>
            ))}
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#c8d5c9" }} />
              ZAPP
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDash} />
              zero1.cash (ref)
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#c8d5c9", width: 8, height: 8, borderRadius: "50%" }} />
              current supply
            </span>
          </div>

          <div className={styles.chartWrap}>
            <canvas ref={canvasRef} role="img" aria-label="ZAPP bonding curve: price vs supply">
              ZAPP bonding curve chart
            </canvas>
          </div>

          <div className={styles.compareTable}>
            <div className={styles.compareCol}>
              <p className={styles.compareTitle}>ZAPP</p>
              <div className={styles.compareRow}><span>First token</span><strong>${p0.toFixed(3)}</strong></div>
              <div className={styles.compareRow}><span>Last token</span><strong>${pf.toFixed(2)}</strong></div>
              <div className={styles.compareRow}><span>Cap</span><strong>{capM}M tokens</strong></div>
              <div className={styles.compareRow}><span>Fee burn</span><strong>{fee.toFixed(2)}%</strong></div>
              <div className={styles.compareRow}><span>Reserve asset</span><strong>sUSDS</strong></div>
            </div>
            <div className={styles.compareDivider} />
            <div className={styles.compareCol}>
              <p className={styles.compareTitle}>zero1.cash</p>
              <div className={styles.compareRow}><span>First token</span><strong>$0.0152</strong></div>
              <div className={styles.compareRow}><span>Last token</span><strong>$0.303</strong></div>
              <div className={styles.compareRow}><span>Cap</span><strong>21M tokens</strong></div>
              <div className={styles.compareRow}><span>Fee burn</span><strong>0.25%</strong></div>
              <div className={styles.compareRow}><span>Reserve asset</span><strong>sUSDS</strong></div>
            </div>
          </div>
        </div>

        {/* ── Right: swap ── */}
        <div className={styles.right}>
          <div className={styles.swapCard}>
            <div className={styles.swapHeader}>
              <button
                className={`${styles.swapTab} ${swapDir === "buy" ? styles.swapTabActive : ""}`}
                onClick={() => { setSwapDir("buy"); setInputVal(""); setOutputVal(""); }}
              >buy</button>
              <button
                className={`${styles.swapTab} ${swapDir === "sell" ? styles.swapTabActive : ""}`}
                onClick={() => { setSwapDir("sell"); setInputVal(""); setOutputVal(""); }}
              >sell</button>
            </div>

            <div className={styles.swapBody}>
              {/* Input */}
              <div className={styles.swapField}>
                <div className={styles.swapFieldTop}>
                  <span className={styles.swapFieldLabel}>you pay</span>
                  <span className={styles.swapBalance}>balance: —</span>
                </div>
                <div className={styles.swapInputRow}>
                  <input
                    className={styles.swapInput}
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    disabled={swapStatus !== "idle"}
                  />
                  <span className={styles.swapToken}>
                    {swapDir === "buy" ? "USDC" : "ZAPP"}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className={styles.swapArrow}>↓</div>

              {/* Output */}
              <div className={styles.swapField}>
                <div className={styles.swapFieldTop}>
                  <span className={styles.swapFieldLabel}>you receive</span>
                  <span className={styles.swapBalance}>
                    {outputVal ? `≈` : ""}
                  </span>
                </div>
                <div className={styles.swapInputRow}>
                  <input
                    className={styles.swapInput}
                    type="text"
                    placeholder="0.00"
                    readOnly
                    value={outputVal}
                  />
                  <span className={styles.swapToken}>
                    {swapDir === "buy" ? "ZAPP" : "USDC"}
                  </span>
                </div>
              </div>

              {/* Info */}
              {outputVal && inputVal && (
                <div className={styles.swapInfo}>
                  <div className={styles.swapInfoRow}>
                    <span>spot price</span>
                    <span>${currentPrice.toFixed(4)} / ZAPP</span>
                  </div>
                  <div className={styles.swapInfoRow}>
                    <span>fee (burned)</span>
                    <span>{fee.toFixed(2)}%</span>
                  </div>
                  <div className={styles.swapInfoRow}>
                    <span>price impact</span>
                    <span className={styles.swapImpact}>
                      {(() => {
                        const v = parseFloat(inputVal);
                        if (!v) return "—";
                        const impact = (v / (currentReserve || 1)) * 100;
                        return `~${Math.min(impact, 99).toFixed(2)}%`;
                      })()}
                    </span>
                  </div>
                  <div className={styles.swapInfoRow}>
                    <span>reserve after</span>
                    <span>${(currentReserve / 1e6).toFixed(3)}M USDS</span>
                  </div>
                </div>
              )}

              {/* Button */}
              <button
                className={`${styles.swapBtn} ${swapStatus !== "idle" ? styles.swapBtnActive : ""}`}
                onClick={handleSwap}
                disabled={!inputVal || !outputVal || swapStatus !== "idle"}
              >
                {swapStatus === "idle"       && (swapDir === "buy" ? `buy $ZAPP` : `sell $ZAPP`)}
                {swapStatus === "confirming" && "confirm in wallet…"}
                {swapStatus === "done"       && "✓ done"}
                {swapStatus === "error"      && "failed — retry"}
              </button>

              <p className={styles.swapNotice}>
                Contracts not yet deployed · testnet coming soon
              </p>
            </div>

            {/* Live stats */}
            <div className={styles.swapStats}>
              <div className={styles.swapStatRow}>
                <span>minted supply</span>
                <span>{(mintedTokens / 1e6).toFixed(2)}M / {capM}M</span>
              </div>
              <div className={styles.swapStatRow}>
                <span>reserve</span>
                <span>${(currentReserve / 1e6).toFixed(3)}M USDS</span>
              </div>
              <div className={styles.swapStatRow}>
                <span>floor price</span>
                <span>${(currentReserve / mintedTokens).toFixed(4)}</span>
              </div>
              <div className={styles.swapStatRow}>
                <span>bonded</span>
                <span>no</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
