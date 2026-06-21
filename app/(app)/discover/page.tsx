'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PoolCard, SceneSourcing } from '@/components/primitives';
import { api } from '@/lib/api/client';
import { useEruja } from '@/lib/store';
import type { Category, Pool } from '@/lib/types';
import styles from './Discover.module.css';

const CATEGORIES: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'grains', label: 'Grains' },
  { key: 'spices', label: 'Spices' },
  { key: 'soup', label: 'Soup' },
  { key: 'oils', label: 'Oils' },
];

export default function DiscoverPage() {
  const { hubs, activeHubId, setActiveHub } = useEruja();
  const [pools, setPools] = useState<Pool[]>([]);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeHubId) return;
    api.pools
      .list({
        hubId: activeHubId,
        sort: 'filling-fastest',
        ...(category !== 'all' ? { category } : {}),
      })
      .then(setPools)
      .catch(() => setPools([]));
  }, [activeHubId, category]);

  const hub = hubs.find((h) => h.id === activeHubId);
  const hubName = hub?.name ?? 'London';
  const featured = pools[0];
  const isEmpty = pools.length === 0;

  const poolCard = (p: Pool) => (
    <PoolCard
      key={p.id}
      name={p.name}
      kind={p.productKind}
      where={`${hubName} hub`}
      retail={p.retailPackPrice}
      group={p.groupPackPrice}
      filled={p.takenSeats}
      total={p.totalSeats}
      urg={p.urgency}
      href={`/pool/${p.id}`}
    />
  );

  const hubPicker = (
    <div className="col" style={{ gap: 8 }}>
      <div className="eyebrow">Your hub</div>
      <div className="chips">
        {hubs.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`chip ${activeHubId === h.id ? 'accent active' : ''}`}
            aria-pressed={activeHubId === h.id}
            onClick={() => setActiveHub(h.id)}
          >
            {h.name}
          </button>
        ))}
      </div>
    </div>
  );

  const emptyState = (
    <div className="card soft txt-sm" data-testid="discover-empty">
      No pools live in {hubName} yet.{' '}
      <Link href="/suggest" className="accent bold" style={{ textDecoration: 'none' }}>
        Suggest one →
      </Link>
    </div>
  );

  return (
    <>
      {/* MOBILE */}
      <div className={styles.mobile} data-testid="discover-mobile">
        {hubPicker}
        <div className="card accent-soft" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 120 }}>
            <SceneSourcing />
          </div>
          <div style={{ padding: 16 }}>
            <div className="display" style={{ fontSize: 24, lineHeight: 1.1 }}>
              Buy a seat. Wait with the group. Pay wholesale.
            </div>
            {featured ? (
              <div className="row" style={{ gap: 14, marginTop: 10 }}>
                <div>
                  <div className="eyebrow">retail</div>
                  <s className="price-mono" style={{ fontSize: 16 }}>
                    ${featured.retailPackPrice}
                  </s>
                </div>
                <div>
                  <div className="eyebrow">group</div>
                  <b className="price-mono accent" style={{ fontSize: 20 }}>
                    ${featured.groupPackPrice}
                  </b>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="row between">
          <span className="h-md">Heating up</span>
          <span className="txt-sm muted">see all →</span>
        </div>
        {isEmpty ? emptyState : pools.map(poolCard)}
      </div>

      {/* WEB */}
      <div className={styles.web} data-testid="discover-web">
        {hubPicker}
        <div
          className="card accent-soft"
          style={{ padding: 0, overflow: 'hidden', margin: '12px 0 18px' }}
        >
          <div className="row" style={{ gap: 0 }}>
            <div style={{ flex: 1, padding: 30 }}>
              <div className="eyebrow">
                {hubName} hub · {hub?.poolsLive ?? 0} pools live
              </div>
              <div className="display" style={{ fontSize: 40, lineHeight: 1.05, margin: '10px 0' }}>
                The ingredients of home,
                <br />
                <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>pooled together.</em>
              </div>
              <div className="txt" style={{ maxWidth: 380 }}>
                Join a pool, wait while it fills, and split a wholesale bulk order with your city.
                Real food, real prices.
              </div>
              {featured ? (
                <div className="row" style={{ gap: 22, marginTop: 16 }}>
                  <div>
                    <div className="eyebrow">retail</div>
                    <s className="price-mono" style={{ fontSize: 20 }}>
                      ${featured.retailPackPrice}
                    </s>
                  </div>
                  <div>
                    <div className="eyebrow">group price</div>
                    <b className="price-mono accent" style={{ fontSize: 28 }}>
                      ${featured.groupPackPrice}
                    </b>
                  </div>
                  <button
                    className="btn accent lg"
                    onClick={() =>
                      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  >
                    Browse pools
                  </button>
                </div>
              ) : null}
            </div>
            <div style={{ flex: '0 0 320px' }}>
              <SceneSourcing />
            </div>
          </div>
        </div>

        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`chip ${category === c.key ? 'active' : ''}`}
                aria-pressed={category === c.key}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <span className="eyebrow">sorted by · filling fastest</span>
        </div>

        <div ref={gridRef}>
          {isEmpty ? emptyState : <div className="pool-grid">{pools.map(poolCard)}</div>}
        </div>
      </div>
    </>
  );
}
