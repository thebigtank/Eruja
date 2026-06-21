'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Icon, PoolPeople, Progress, Timeline } from '@/components/primitives';
import { Stepper } from '@/components/app/Stepper';
import { api } from '@/lib/api/client';
import { useEruja } from '@/lib/store';
import { ticketVisualState, VISUAL_STATE_LABEL, type TicketVisualState } from '@/lib/ticket-state';
import type { OrderTicket, Pool } from '@/lib/types';
import styles from './Tracker.module.css';

const unitFmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

/** Status badge colour by visual state. */
const BADGE_TONE: Record<TicketVisualState, string> = {
  waiting: 'gold',
  cargo: 'accent',
  'last-mile': 'accent',
  delivered: 'green',
};

export default function TrackingPage() {
  const { ticket: ticketId } = useParams<{ ticket: string }>();
  const router = useRouter();
  const { setTicketSeats } = useEruja();

  const [ticket, setTicket] = useState<OrderTicket | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.tickets
      .get(ticketId)
      .then((t) => {
        setTicket(t);
        api.pools
          .get(t.poolId)
          .then(setPool)
          .catch(() => {});
      })
      .catch(() => setMissing(true));
  }, [ticketId]);

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/me/pools');
  }

  async function changeSeats(quantity: number) {
    if (!ticket || busy) return;
    setBusy(true);
    try {
      const updated = await setTicketSeats(ticket.id, quantity);
      setTicket(updated);
    } finally {
      setBusy(false);
    }
  }

  const backRow = (state: TicketVisualState | null) => (
    <div className={styles.backRow}>
      <button type="button" className={styles.iconBtn} onClick={goBack} aria-label="Back">
        <Icon name="back" size={22} stroke={2} />
      </button>
      <span className={styles.backName} data-testid="tracker-name">
        {ticket?.name ?? (missing ? 'Ticket not found' : 'Loading…')}
      </span>
      {state ? (
        <span className={`badge ${BADGE_TONE[state]}`} data-testid="tracker-badge">
          {VISUAL_STATE_LABEL[state]}
        </span>
      ) : null}
    </div>
  );

  if (missing) {
    return (
      <div className="col" style={{ gap: 12 }}>
        {backRow(null)}
        <p className="txt muted">No ticket with that id.</p>
        <Link href="/me/pools" className="btn accent" style={{ alignSelf: 'flex-start' }}>
          Back to my pools
        </Link>
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="col" style={{ gap: 12 }}>
        {backRow(null)}
        <p className="txt muted">Loading ticket…</p>
      </div>
    );
  }

  const state = ticketVisualState(ticket.status);
  const { filled, total } = ticket.fill;
  const mine = ticket.mySeats;
  const open = total - filled;
  const others = filled - mine;
  const maxMine = total - others; // can't exceed open capacity
  const unitLabel = pool?.unitLabel ?? 'cups';
  const unitPrice = pool?.groupUnitPrice ?? 6.5;

  /* ---- non-waiting states: navigable placeholder until their phase ships ---- */
  if (state !== 'waiting') {
    return (
      <div className="col" style={{ gap: 14 }} data-testid="tracker-page">
        {backRow(state)}
        <div className="card soft col" style={{ gap: 6 }} data-testid="tracker-placeholder">
          <span className="eyebrow">{VISUAL_STATE_LABEL[state]}</span>
          <div className="h-md">{VISUAL_STATE_LABEL[state]} view — building next phase</div>
          <div className="txt-sm muted">
            {filled}/{total} seats · this tracker stage lands in a later phase.
          </div>
        </div>
      </div>
    );
  }

  /* ---- WAITING (H4) ---- */
  const statusLine = (
    <div>
      <div className="eyebrow">the pool is filling</div>
      <div className="txt" style={{ marginTop: 2 }}>
        {open} {unitLabel} to ship before it moves
      </div>
    </div>
  );

  const peopleCard = (web: boolean) => (
    <div className="card" style={{ padding: 16 }}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <span className="eyebrow">The pool · {total} seats</span>
        <span className="urg">{open} to ship</span>
      </div>
      <PoolPeople total={total} filled={filled} mine={mine} cols={web ? 16 : 10} />
      <div className="row" style={{ gap: 16, marginTop: 16 }}>
        <span className="txt-sm" data-testid="legend-yours">
          <b style={{ color: 'var(--accent)' }}>●</b> {mine} yours
        </span>
        <span className="txt-sm muted">● {others} joined</span>
        <span className="txt-sm muted">○ {open} open</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <Progress
          value={filled}
          max={total}
          tone={filled / total > 0.72 ? 'accent' : 'green'}
          left={`${filled} joined`}
          right={`${total} seats`}
        />
      </div>
    </div>
  );

  const seatsCard = (
    <div className="card col" style={{ gap: 12 }}>
      <div className="row between">
        <div>
          <div className="eyebrow">your seats</div>
          <div className="h-lg" data-testid="seats-value">
            {mine}{' '}
            <span className="txt muted" style={{ fontSize: 14 }}>
              {unitLabel}
            </span>
          </div>
        </div>
        <Stepper
          value={mine}
          min={1}
          max={maxMine}
          busy={busy}
          onDecrement={() => changeSeats(Math.max(1, mine - 1))}
          onIncrement={() => changeSeats(Math.min(maxMine, mine + 1))}
        />
      </div>
      <hr className="div" />
      <div className="kv">
        <span className="k">
          On hold · {mine}×${unitFmt(unitPrice)}
        </span>
        <b className="price-mono accent" data-testid="tracker-hold">
          {money(ticket.holdAmount)}
        </b>
      </div>
      <div className="txt-sm muted">Charged from your wallet the moment the pool fills.</div>
    </div>
  );

  const feed = (
    <div className="col" style={{ gap: 8 }} data-testid="tracker-timeline">
      <span className="eyebrow">Live transparency feed</span>
      <Timeline rows={ticket.timeline} />
    </div>
  );

  const leave = (
    <div className="col" style={{ gap: 4 }}>
      <button type="button" className="btn block" disabled data-testid="leave-btn">
        Leave pool · coming soon
      </button>
      <div className="center txt-sm muted">enabled at backend once refund logic ships</div>
    </div>
  );

  return (
    <div data-testid="tracker-page">
      {/* MOBILE */}
      <div className={styles.mobile} data-testid="tracker-mobile">
        {backRow(state)}
        {statusLine}
        {peopleCard(false)}
        {seatsCard}
        {feed}
        {leave}
      </div>

      {/* WEB */}
      <div className={styles.web} data-testid="tracker-web">
        {backRow(state)}
        {statusLine}
        <div className="row top" style={{ gap: 26, marginTop: 14 }}>
          <div style={{ flex: '0 0 380px' }} className="col">
            {peopleCard(true)}
            {seatsCard}
            {leave}
          </div>
          <div style={{ flex: 1 }} className="col">
            {feed}
          </div>
        </div>
      </div>
    </div>
  );
}
