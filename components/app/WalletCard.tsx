'use client';

import { useState } from 'react';
import { Icon } from '@/components/primitives';
import { useEruja } from '@/lib/store';

const TOPUP_AMOUNTS = [20, 50, 100, 200];

/**
 * Reusable wallet card (.card.ink). Big balance + top-up chips + "Top up $amt".
 * Top-up goes through the store so the shell wallet pill stays in sync.
 * `web` enlarges the balance for the desktop sidebar. Reused by /wallet next phase.
 */
export function WalletCard({ web = false }: { web?: boolean }) {
  const { wallet, topUp } = useEruja();
  const [amt, setAmt] = useState(50);
  const [busy, setBusy] = useState(false);

  const balance = wallet?.balance ?? 0;

  async function onTopUp() {
    if (busy) return;
    setBusy(true);
    try {
      await topUp(amt);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card ink" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row between">
        <span className="eyebrow">Eruja wallet</span>
        <Icon name="wallet" size={20} stroke={1.8} style={{ opacity: 0.7 }} />
      </div>
      <div className="display" style={{ fontSize: web ? 46 : 38 }}>
        ${balance.toFixed(2)}
      </div>
      <div className="row wrap" style={{ gap: 8 }}>
        {TOPUP_AMOUNTS.map((n) => (
          <button
            key={n}
            type="button"
            className={`chip ${amt === n ? 'accent active' : ''}`}
            aria-pressed={amt === n}
            style={{
              background: amt === n ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              color: amt === n ? '#fff' : 'rgba(251,245,234,0.8)',
              borderColor: 'transparent',
            }}
            onClick={() => setAmt(n)}
          >
            ${n}
          </button>
        ))}
      </div>
      <button className="btn accent block" onClick={onTopUp} disabled={busy}>
        <Icon name="plus" size={16} stroke={2.4} /> Top up ${amt}
      </button>
    </div>
  );
}
