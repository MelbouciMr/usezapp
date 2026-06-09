"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "@wagmi/connectors";
import styles from "./Navbar.module.css";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect }    = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <img src="/pfp_zapp.png" alt="ZAPP Protocol" className={styles.logoMark} width={28} height={28} />
        <span>ZAPP</span>
      </div>

      <ul className={styles.links}>
        <li><a href="#how-it-works">how it works</a></li>
        <li><a href="#hooks">hooks</a></li>
        <li><a href="https://x.com/usezapp_" target="_blank" rel="noopener noreferrer">socials</a></li>
      </ul>

      <div className={styles.right}>
        {isConnected ? (
          <div className={styles.connected}>
            <span className={styles.dot} />
            <span className={styles.addr}>
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
            <button className={styles.disconnect} onClick={() => disconnect()}>
              disconnect
            </button>
          </div>
        ) : (
          <button
            className={styles.connectBtn}
            onClick={() => connect({ connector: injected() })}
          >
            connect wallet
          </button>
        )}
      </div>
    </nav>
  );
}
