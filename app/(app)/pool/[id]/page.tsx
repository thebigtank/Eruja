'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Icon, ProductIllo, PoolPeople, SceneSourcing, SceneCargo } from '@/components/primitives';
import { Stepper } from '@/components/app/Stepper';
import { api } from '@/lib/api/client';
import { useEruja } from '@/lib/store';
import type { Pool } from '@/lib/types';
import styles from './Pool.module.css';

const unitFmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

export default function PoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { hubs, addToCart } = useEruja();

  const [pool, setPool] = useState<Pool | null>(null);
  const [missing, setMissing] = useState(false);
  const [mine, setMine] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.pools
      .get(id)
      .then((p) => {
        setPool(p);
        const open = p.totalSeats - p.takenSeats;
        setMine(Math.max(1, Math.min(10, open)));
      })
      .catch(() => setMissing(true));
  }, [id]);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/discover');
  }

  async function add() {
    if (!pool) return;
    await addToCart(pool.id, mine);
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1500);
  }

  async function buyNow() {
    if (!pool) return;
    await addToCart(pool.id, mine);
    router.push('/cart');
  }

  const backRow = (
    <div className={styles.backRow}>
      <button type="button" className={styles.iconBtn} onClick={goBack} aria-label="Back">
        <Icon name="back" size={22} stroke={2} />
      </button>
      {/* Deferred no-op stub (share is not wired this phase). */}
      <button type="button" className={styles.iconBtn} aria-label="Share" onClick={() => {}}>
        <Icon name="share" size={20} stroke={1.9} />
      </button>
    </div>
  );

  if (missing) {
    return (
      <section className="col" style={{ gap: 12 }}>
        {backRow}
        <h1 className="h-xl" style={{ margin: 0 }}>
          Pool not found
        </h1>
        <Link href="/discover" className="btn accent" style={{ alignSelf: 'flex-start' }}>
          Browse pools
        </Link>
      </section>
    );
  }
  if (!pool) {
    return (
      <section className="col" style={{ gap: 12 }}>
        {backRow}
        <p className="txt muted">Loading pool…</p>
      </section>
    );
  }

  const hubName = hubs.find((h) => h.id === pool.hubId)?.name ?? 'London';
  const open = pool.totalSeats - pool.takenSeats;
  const isOpen =
    (pool.status === 'awaiting' || pool.status === 'filling') && pool.takenSeats < pool.totalSeats;

  const localTotal = mine * pool.retailUnitPrice;
  const groupTotal = mine * pool.groupUnitPrice;
  const save = mine * (pool.retailUnitPrice - pool.groupUnitPrice);

  const eyebrow = `${hubName} hub · ${pool.category}`;

  const closedNotice = (
    <div className="card soft col" style={{ gap: 8 }} data-testid="pool-closed">
      <span className="eyebrow">Pool closed</span>
      <div className="h-md">This pool has filled and is on its way.</div>
      <div className="txt-sm muted">Browse open pools in {hubName}.</div>
      <Link href="/discover" className="btn accent" style={{ alignSelf: 'flex-start' }}>
        Browse pools
      </Link>
    </div>
  );

  const selector = (web: boolean) => (
    <div className="col">
      <div className="card" style={{ padding: 16 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <span className="eyebrow">The pool · {pool.totalSeats} seats</span>
          <span className="urg">{open} seats to ship</span>
        </div>
        <PoolPeople
          total={pool.totalSeats}
          filled={pool.takenSeats + mine}
          mine={mine}
          cols={web ? 16 : 10}
        />
        <div className="row" style={{ gap: 16, marginTop: 16 }}>
          <span className="txt-sm" data-testid="legend-yours">
            <b style={{ color: 'var(--accent)' }}>●</b> {mine} yours
          </span>
          <span className="txt-sm muted">● {pool.takenSeats} joined</span>
          <span className="txt-sm muted">○ {open - mine} open</span>
        </div>
      </div>

      <div
        className="card"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <div>
          <div className="eyebrow">your seats</div>
          <div className="h-lg">
            {mine}{' '}
            <span className="txt muted" style={{ fontSize: 14 }}>
              {pool.unitLabel}
            </span>
          </div>
        </div>
        <Stepper
          value={mine}
          min={1}
          max={open}
          onDecrement={() => setMine((m) => Math.max(1, m - 1))}
          onIncrement={() => setMine((m) => Math.min(open, m + 1))}
        />
      </div>

      <div className="card soft">
        <div className="kv">
          <span className="k">
            Local store · {mine}×${unitFmt(pool.retailUnitPrice)}
          </span>
          <s className="price-mono muted" data-testid="save-local">
            ${localTotal}
          </s>
        </div>
        <hr className="div" />
        <div className="kv">
          <span className="k bold">
            Eruja group · {mine}×${unitFmt(pool.groupUnitPrice)}
          </span>
          <b className="price-mono accent" style={{ fontSize: 18 }} data-testid="save-group">
            ${groupTotal.toFixed(2)}
          </b>
        </div>
        <div className="kv" style={{ marginTop: 6 }}>
          <span className="badge green" data-testid="save-amount">
            you save ${save.toFixed(0)}
          </span>
          <span />
        </div>
      </div>

      <div className="row" style={{ gap: 10 }}>
        <button className="btn block" onClick={add} data-testid="add-to-cart">
          <Icon name="cart" size={16} stroke={2} /> {added ? 'Added ✓' : 'Add to cart'}
        </button>
        <button className="btn accent block" onClick={buyNow}>
          Buy now
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE */}
      <div className={styles.mobile} data-testid="pool-mobile">
        {backRow}
        <div className="illo-tile" style={{ height: 150 }}>
          <ProductIllo kind={pool.productKind} size={150} />
        </div>
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <div className="h-xl">{pool.name}</div>
          <div className="txt" style={{ marginTop: 4 }}>
            {pool.description}
          </div>
          {pool.etaNote ? (
            <div className="txt-sm muted" style={{ marginTop: 4 }}>
              {pool.etaNote}
            </div>
          ) : null}
        </div>
        {isOpen ? selector(false) : closedNotice}
      </div>

      {/* WEB */}
      <div className={styles.web} data-testid="pool-web">
        {backRow}
        <div className="row top" style={{ gap: 30 }}>
          <div style={{ flex: '0 0 320px' }} className="col">
            <div className="illo-tile" style={{ height: 280 }}>
              <ProductIllo kind={pool.productKind} size={240} />
            </div>
            <div className="row" style={{ gap: 10 }}>
              <div className="illo-tile" style={{ flex: 1, height: 72 }}>
                <ProductIllo kind={pool.productKind} size={64} />
              </div>
              <div className="illo-tile" style={{ flex: 1, height: 72 }}>
                <SceneSourcing />
              </div>
              <div className="illo-tile" style={{ flex: 1, height: 72 }}>
                <SceneCargo />
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }} className="col">
            <div>
              <div className="eyebrow">{eyebrow}</div>
              <div className="display" style={{ fontSize: 40, margin: '6px 0' }}>
                {pool.name}
              </div>
              <div className="txt" style={{ maxWidth: 460 }}>
                {pool.description}
              </div>
              {pool.etaNote ? (
                <div className="txt-sm muted" style={{ marginTop: 4 }}>
                  {pool.etaNote}
                </div>
              ) : null}
            </div>
            {isOpen ? selector(true) : closedNotice}
          </div>
        </div>
      </div>
    </>
  );
}
