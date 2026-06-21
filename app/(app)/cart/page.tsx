'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon, Progress } from '@/components/primitives';
import { CartLineItem } from '@/components/app/CartLine';
import { useEruja } from '@/lib/store';
import type { CheckoutResponse } from '@/lib/types';
import styles from './Cart.module.css';

const fmt = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

const TOP_UP_AMOUNTS = [20, 50, 100] as const;

export default function CartPage() {
  const router = useRouter();
  const { cart, wallet, loadCart, updateCartLine, removeCartLine, checkout, topUp } = useEruja();
  const [busy, setBusy] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/discover');
  }

  async function handleQtyChange(id: string, qty: number) {
    if (busy) return;
    setBusy(true);
    try {
      await updateCartLine(id, qty);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await removeCartLine(id);
    } finally {
      setBusy(false);
    }
  }

  async function handleTopUp(amount: number) {
    if (busy) return;
    setBusy(true);
    try {
      await topUp(amount);
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckout() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await checkout();
      setCheckoutResult(result);
    } finally {
      setBusy(false);
    }
  }

  const lines = cart?.lines ?? [];
  const n = lines.length;
  const subtotal = cart?.subtotal ?? 0;

  // Use live wallet.balance from store so top-ups reflect instantly without a cart refetch.
  const liveBalance = wallet?.balance ?? cart?.walletBalance ?? 0;
  const liveAfter = liveBalance - subtotal;
  const isShort = liveAfter < 0;
  const canPay = n > 0 && !isShort && !busy;

  // In-body header — shared between mobile and web.
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        type="button"
        onClick={goBack}
        aria-label="Back"
        style={{
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          color: 'var(--ink)',
          display: 'flex',
        }}
      >
        <Icon name="back" size={22} stroke={2} />
      </button>
      <div>
        <p className="h-md" style={{ margin: 0 }}>
          Your cart
        </p>
        <p className="txt-sm muted" style={{ margin: 0 }}>
          {n} pool{n !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );

  // Top-up chips (shared, rendered in mobile summary and web right card).
  const topUpChips = (
    <div className="chips">
      {TOP_UP_AMOUNTS.map((amount) => (
        <button
          key={amount}
          type="button"
          className="chip"
          onClick={() => handleTopUp(amount)}
          disabled={busy}
          data-testid={`topup-chip-${amount}`}
        >
          +{fmt(amount)}
        </button>
      ))}
    </div>
  );

  // Summary card — shared between both layouts.
  const summary = (
    <div
      className="card accent-soft"
      data-testid="cart-summary"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <p className="eyebrow">Pay from wallet</p>
      <div className="kv">
        <span className="k">
          Subtotal · {n} pool{n !== 1 ? 's' : ''}
        </span>
        <span className="v" data-testid="cart-subtotal">
          {fmt(subtotal)}
        </span>
      </div>
      <hr className="div" />
      <div className="kv">
        <span className="k">Wallet balance</span>
        <span className="v" data-testid="cart-wallet-balance">
          {fmt(liveBalance)}
        </span>
      </div>
      <div className="kv">
        <span className="k">Balance after</span>
        <span
          className="v"
          data-testid="cart-balance-after"
          style={{ color: isShort ? 'var(--accent)' : undefined }}
        >
          {fmt(liveAfter)}
        </span>
      </div>
      <Progress
        tone="green"
        meta={false}
        value={Math.max(0, liveAfter)}
        max={liveBalance > 0 ? liveBalance : 1}
      />
      {/* Mobile-only: top-up chips appear above the Pay button only when short */}
      {isShort && (
        <div className={styles.mobileTopUp}>
          <p className="txt-sm muted" style={{ margin: '0 0 6px' }}>
            Short on funds?
          </p>
          {topUpChips}
        </div>
      )}
      <button
        type="button"
        className="btn accent block lg"
        onClick={handleCheckout}
        disabled={!canPay}
        data-testid="cart-checkout-btn"
      >
        Pay {fmt(subtotal)}
      </button>
      <p className="txt-sm muted center" style={{ margin: 0 }}>
        Creates {n} queue ticket{n !== 1 ? 's' : ''} · charged when each pool fills
      </p>
    </div>
  );

  // Web-only: "Short on funds?" card (always visible in right column).
  const shortFundsCard = (
    <div className="card soft" data-testid="short-funds-card">
      <p className="eyebrow" style={{ marginBottom: 10 }}>
        Short on funds?
      </p>
      {topUpChips}
    </div>
  );

  // ── POST-CHECKOUT SUCCESS ──────────────────────────────────────────────────
  if (checkoutResult) {
    const ticketCount = checkoutResult.tickets.length;
    return (
      <section className="col" style={{ gap: 16 }} data-testid="cart-success">
        <div className="card ink" style={{ padding: 32, textAlign: 'center' }}>
          <p className="h-md" style={{ margin: '0 0 8px' }}>
            Payment held — {ticketCount} queue ticket{ticketCount !== 1 ? 's' : ''} created
          </p>
          <p className="txt muted" style={{ margin: 0 }}>
            We&apos;ll charge each pool from your wallet the moment it fills.
          </p>
        </div>
        <Link href="/me/pools" className="btn accent block" data-testid="success-view-pools">
          View my pools
        </Link>
        <Link href="/discover" className="btn ghost block">
          Keep browsing
        </Link>
      </section>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (!cart) {
    return (
      <section style={{ padding: 24 }}>
        <p className="txt muted">Loading…</p>
      </section>
    );
  }

  // ── EMPTY CART ─────────────────────────────────────────────────────────────
  if (lines.length === 0) {
    return (
      <section className="col" style={{ gap: 16 }} data-testid="cart-empty">
        {header}
        <div className="card soft" style={{ textAlign: 'center', padding: 32 }}>
          <p className="txt muted">Your cart is empty.</p>
        </div>
        <Link href="/discover" className="btn accent block">
          Browse pools
        </Link>
      </section>
    );
  }

  // ── NORMAL CART ────────────────────────────────────────────────────────────
  return (
    <div className={styles.page} data-testid="cart-page">
      {/* ─ MOBILE ─────────────────────────────────────────────── */}
      <div className={styles.mobile} data-testid="cart-mobile">
        {header}
        <div className="col" style={{ gap: 12 }}>
          {lines.map((line) => (
            <CartLineItem
              key={line.id}
              line={line}
              onQuantityChange={handleQtyChange}
              onRemove={handleRemove}
              busy={busy}
            />
          ))}
        </div>
        {summary}
      </div>

      {/* ─ WEB ────────────────────────────────────────────────── */}
      <div className={styles.web} data-testid="cart-web">
        <div className={styles.webLeft}>
          {header}
          <h1 className="h-lg" style={{ margin: '12px 0 2px' }}>
            Your cart
          </h1>
          <p className="eyebrow" style={{ margin: '0 0 20px' }}>
            {n} pool{n !== 1 ? 's' : ''} · one wallet payment · {n} queue ticket{n !== 1 ? 's' : ''}
          </p>
          <div className="col" style={{ gap: 12 }}>
            {lines.map((line) => (
              <CartLineItem
                key={line.id}
                line={line}
                onQuantityChange={handleQtyChange}
                onRemove={handleRemove}
                busy={busy}
              />
            ))}
          </div>
          <div className="card soft" style={{ marginTop: 20 }}>
            <p className="txt" style={{ margin: 0 }}>
              Each line keeps its own pool, ticket and timeline. The wait is per-pool, not per-cart.
            </p>
          </div>
        </div>

        <div className={styles.webRight}>
          {summary}
          {shortFundsCard}
        </div>
      </div>
    </div>
  );
}
