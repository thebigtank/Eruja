'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PoolCard } from '@/components/primitives';
import { api } from '@/lib/api/client';
import { useEruja } from '@/lib/store';
import { ticketBucket } from '@/lib/ticket-state';
import type { OrderTicket, Pool, PoolBucket } from '@/lib/types';
import styles from './MyPools.module.css';

const TABS: { key: PoolBucket; label: string; word: string }[] = [
  { key: 'awaiting', label: 'Awaiting', word: 'awaiting' },
  { key: 'in_transit', label: 'In transit', word: 'in transit' },
  { key: 'delivered', label: 'Delivered', word: 'delivered' },
];

export default function MyPoolsPage() {
  const { hubs, activeHubId } = useEruja();
  const [tickets, setTickets] = useState<OrderTicket[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [tab, setTab] = useState<PoolBucket>('awaiting');

  useEffect(() => {
    api.tickets
      .list()
      .then(setTickets)
      .catch(() => {});
    // Tickets carry no pack prices — join the pool by poolId for the card pricing.
    api.pools
      .list()
      .then(setPools)
      .catch(() => {});
  }, []);

  const hubName = hubs.find((h) => h.id === activeHubId)?.name ?? 'London';
  const poolsById = useMemo(() => new Map(pools.map((p) => [p.id, p])), [pools]);

  const buckets = useMemo(() => {
    const b: Record<PoolBucket, OrderTicket[]> = { awaiting: [], in_transit: [], delivered: [] };
    for (const t of tickets) b[ticketBucket(t.status)].push(t);
    return b;
  }, [tickets]);

  const active = buckets[tab];
  const activeWord = TABS.find((t) => t.key === tab)?.word ?? '';

  const ticketCard = (t: OrderTicket) => {
    const pool = poolsById.get(t.poolId);
    return (
      <PoolCard
        key={t.id}
        name={t.name}
        kind={t.productKind}
        where={`${hubName} · ticket #${t.id.replace(/^t_/, '')}`}
        retail={pool?.retailPackPrice ?? 0}
        group={pool?.groupPackPrice ?? 0}
        filled={t.fill.filled}
        total={t.fill.total}
        href={`/me/pools/${t.id}`}
      />
    );
  };

  const header = (
    <div>
      <h1 className="h-xl" style={{ margin: 0 }}>
        My pools
      </h1>
      <p className="txt-sm muted" style={{ margin: '2px 0 0' }}>
        {tickets.length} pools in motion
      </p>
    </div>
  );

  const tabs = (
    <div className="chips">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`chip ${tab === t.key ? 'active' : ''}`}
          aria-pressed={tab === t.key}
          onClick={() => setTab(t.key)}
          data-testid={`tab-${t.key}`}
        >
          {t.label} · {buckets[t.key].length}
        </button>
      ))}
    </div>
  );

  const empty = (
    <div className="col" style={{ gap: 10 }} data-testid="me-pools-empty">
      <p className="txt-sm muted" style={{ margin: 0 }}>
        Nothing {activeWord} yet
      </p>
      {tab === 'awaiting' ? (
        <Link href="/discover" className="btn accent" style={{ alignSelf: 'flex-start' }}>
          Browse pools
        </Link>
      ) : null}
    </div>
  );

  return (
    <div data-testid="me-pools-page">
      {/* MOBILE */}
      <div className={styles.mobile} data-testid="me-pools-mobile">
        {header}
        {tabs}
        {active.length > 0 ? active.map(ticketCard) : empty}
      </div>

      {/* WEB */}
      <div className={styles.web} data-testid="me-pools-web">
        {header}
        <div className="row between" style={{ marginTop: 12 }}>
          <span />
          {tabs}
        </div>
        {active.length > 0 ? (
          <div className="pool-grid" style={{ marginTop: 12 }}>
            {active.map(ticketCard)}
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>{empty}</div>
        )}
      </div>
    </div>
  );
}
