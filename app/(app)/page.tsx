'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon, PoolCard } from '@/components/primitives';
import { WalletCard } from '@/components/app/WalletCard';
import { api } from '@/lib/api/client';
import { useEruja } from '@/lib/store';
import { ticketBucket } from '@/lib/ticket-state';
import type { OrderTicket, Pool, PoolBucket } from '@/lib/types';
import styles from './Home.module.css';

const TABS: { key: PoolBucket; label: string; word: string }[] = [
  { key: 'awaiting', label: 'Awaiting', word: 'awaiting' },
  { key: 'in_transit', label: 'In transit', word: 'in transit' },
  { key: 'delivered', label: 'Delivered', word: 'delivered' },
];

export default function HomePage() {
  const { user, wallet, hubs, activeHubId } = useEruja();
  const [tickets, setTickets] = useState<OrderTicket[]>([]);
  const [hubPools, setHubPools] = useState<Pool[]>([]);
  const [tab, setTab] = useState<PoolBucket>('awaiting');

  useEffect(() => {
    api.tickets
      .list()
      .then(setTickets)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeHubId) return;
    api.pools
      .list({ hubId: activeHubId })
      .then(setHubPools)
      .catch(() => {});
  }, [activeHubId]);

  const hub = hubs.find((h) => h.id === activeHubId);
  const hubName = hub?.name ?? 'London';
  const poolsById = useMemo(() => new Map(hubPools.map((p) => [p.id, p])), [hubPools]);

  const buckets = useMemo(() => {
    const b: Record<PoolBucket, OrderTicket[]> = { awaiting: [], in_transit: [], delivered: [] };
    for (const t of tickets) b[ticketBucket(t.status)].push(t);
    return b;
  }, [tickets]);

  const teaser = hubPools.slice(0, 3);
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

  const tabs = (
    <div className="chips">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`chip ${tab === t.key ? 'active' : ''}`}
          aria-pressed={tab === t.key}
          onClick={() => setTab(t.key)}
        >
          {t.label} · {buckets[t.key].length}
        </button>
      ))}
    </div>
  );

  const discoverHead = (
    <div className="row between">
      <span className="eyebrow">
        Discover · {hub?.poolsLive ?? 0} active in {hubName}
      </span>
      <Link href="/discover" className="txt-sm accent bold" style={{ textDecoration: 'none' }}>
        See all →
      </Link>
    </div>
  );

  const greeting = (
    <div>
      <div className="eyebrow">Ẹ káàbọ̀ — welcome back</div>
      <div className="h-xl" style={{ marginTop: 2 }}>
        {user?.name ?? ''}
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE */}
      <div className={styles.mobile}>
        {greeting}
        <WalletCard />
        <div className="row between" style={{ marginTop: 2 }}>
          <span className="h-md">My pools</span>
          <span className="txt-sm muted">Saved ${wallet?.savedTotal ?? 0} so far</span>
        </div>
        {tabs}
        {active.length > 0 ? (
          <>
            {ticketCard(active[0]!)}
            <Link
              href="/me/pools"
              className="btn ghost block sm"
              style={{ justifyContent: 'space-between' }}
            >
              <span>
                See all {active.length} {activeWord} pools
              </span>
              <Icon name="chevR" size={16} stroke={2} />
            </Link>
          </>
        ) : (
          <div className="txt-sm muted">Nothing {activeWord} yet</div>
        )}
        {discoverHead}
        {teaser.map(poolCard)}
      </div>

      {/* WEB */}
      <div className={styles.web}>
        <div className="row top" style={{ gap: 26, alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 300px' }} className="col">
            <WalletCard web />
            <div className="card">
              <div className="kv">
                <span className="k">Total saved</span>
                <span className="v accent">${wallet?.savedTotal ?? 0}</span>
              </div>
              <hr className="div" />
              <div className="kv">
                <span className="k">Pools joined</span>
                <span className="v">{wallet?.poolsJoined ?? 0}</span>
              </div>
              <hr className="div" />
              <div className="kv">
                <span className="k">Friends referred</span>
                <span className="v">{wallet?.referred ?? 0}</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} className="col">
            {greeting}
            <div className="row between">
              <h3 className="h-lg" style={{ margin: 0 }}>
                My pools
              </h3>
              {tabs}
            </div>
            {active.length > 0 ? (
              <div className="pool-grid">{active.map(ticketCard)}</div>
            ) : (
              <div className="txt-sm muted">Nothing {activeWord} yet</div>
            )}
            {discoverHead}
            <div className="pool-grid">{teaser.map(poolCard)}</div>
          </div>
        </div>
      </div>
    </>
  );
}
