'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  HSteps,
  Icon,
  PoolCard,
  PoolPeople,
  Progress,
  SceneCargo,
  SceneDoorstep,
  Stars,
  Timeline,
} from '@/components/primitives';
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
  const { wallet, hubs, activeHubId, setTicketSeats, setTicketRating } = useEruja();

  const [ticket, setTicket] = useState<OrderTicket | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [nextPools, setNextPools] = useState<Pool[]>([]);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState(false);
  const thanksTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Open pools for the delivered "what's next" suggestions (real links to /pool/:id).
  useEffect(() => {
    api.pools
      .list()
      .then(setNextPools)
      .catch(() => {});
  }, []);

  useEffect(
    () => () => {
      if (thanksTimer.current) clearTimeout(thanksTimer.current);
    },
    [],
  );

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

  async function rate(stars: number) {
    if (!ticket) return;
    const updated = await setTicketRating(ticket.id, stars);
    setTicket(updated);
    setThanks(true);
    if (thanksTimer.current) clearTimeout(thanksTimer.current);
    thanksTimer.current = setTimeout(() => setThanks(false), 1500);
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
  const charged = ticket.chargedAmount ?? 0;

  // Transparency feed — shared across states.
  const feed = (
    <div className="col" style={{ gap: 8 }} data-testid="tracker-timeline">
      <span className="eyebrow">Live transparency feed</span>
      <Timeline rows={ticket.timeline} />
    </div>
  );

  // Deferred action — present but non-functional (no backing endpoint in the contract).
  const deferred = (label: string, caption: string, testid: string, accent?: boolean) => (
    <div className="col" style={{ gap: 4 }}>
      <button
        type="button"
        className={`btn block ${accent ? 'accent' : ''}`}
        disabled
        data-testid={testid}
      >
        {label}
      </button>
      <div className="center txt-sm muted">{caption}</div>
    </div>
  );

  const viewPool = (
    <Link href={`/pool/${ticket.poolId}`} className="btn ghost block" data-testid="view-pool">
      View pool
    </Link>
  );

  /* ============================== WAITING (H4) ============================== */
  if (state === 'waiting') {
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
        <div className={styles.mobile} data-testid="tracker-mobile">
          {backRow(state)}
          {statusLine}
          {peopleCard(false)}
          {seatsCard}
          {feed}
          {leave}
        </div>
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

  /* ============================== CARGO (H5) ============================== */
  if (state === 'cargo') {
    const header = (
      <div className="card ink col" style={{ gap: 6 }} data-testid="cargo-header">
        <span className="eyebrow">the bag is full</span>
        <div className="txt-sm">Charged {money(charged)} · on its way</div>
      </div>
    );

    const steps = (
      <div data-testid="cargo-hsteps">
        <HSteps steps={ticket.hsteps.steps} active={ticket.hsteps.active} />
      </div>
    );

    const route = (
      <div className="card col" style={{ gap: 10 }} data-testid="cargo-route">
        <div className="illo-tile" style={{ height: 130 }}>
          <SceneCargo />
        </div>
        <div className="kv">
          <span className="k">Route</span>
          <b data-testid="cargo-route-line">
            {ticket.cargoRoute?.from} → {ticket.cargoRoute?.to}
          </b>
        </div>
        <hr className="div" />
        <div className="kv">
          <span className="k">Flight</span>
          <span className="v">{ticket.cargoRoute?.flight}</span>
        </div>
        <hr className="div" />
        <div className="kv">
          <span className="k">ETA</span>
          <span className="v">{ticket.cargoRoute?.eta}</span>
        </div>
      </div>
    );

    const track = deferred('Track cargo', 'live tracking coming soon', 'track-cargo', true);

    return (
      <div data-testid="tracker-page">
        <div className={styles.mobile} data-testid="tracker-mobile">
          {backRow(state)}
          {header}
          {steps}
          {route}
          {feed}
          {track}
          {viewPool}
        </div>
        <div className={styles.web} data-testid="tracker-web">
          {backRow(state)}
          {header}
          <div className="row top" style={{ gap: 26, marginTop: 14 }}>
            <div style={{ flex: '0 0 340px' }} className="col">
              {route}
              {steps}
              {track}
              {viewPool}
            </div>
            <div style={{ flex: 1 }} className="col">
              {feed}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================== LAST-MILE (H6) ============================== */
  if (state === 'last-mile') {
    const dw = ticket.deliveryWindow;
    const portion = ticket.portion;

    const header = (
      <div data-testid="lastmile-header">
        <div className="eyebrow">sorted for you</div>
        <div className="h-lg" style={{ marginTop: 2 }}>
          Arriving {dw?.date}, {dw?.slot}
        </div>
      </div>
    );

    const windowCard = (
      <div className="card accent-soft col" style={{ gap: 10 }} data-testid="delivery-window">
        <div className="illo-tile" style={{ height: 120 }}>
          <SceneDoorstep />
        </div>
        <div className="kv">
          <span className="k">Courier</span>
          <b>{dw?.courier}</b>
        </div>
        <hr className="div" />
        <div className="kv">
          <span className="k">Driver</span>
          <span className="v">{dw?.driver}</span>
        </div>
        <hr className="div" />
        <div className="kv">
          <span className="k">Van</span>
          <span className="v">{dw?.van}</span>
        </div>
        <hr className="div" />
        <div className="kv">
          <span className="k">Left the hub</span>
          <span className="v">{dw?.hubOut}</span>
        </div>
      </div>
    );

    const portionCard = (
      <div className="card soft col" style={{ gap: 4 }} data-testid="portion">
        <span className="eyebrow">your portion</span>
        <div className="h-lg">
          {portion?.units} · {portion?.kg}kg
        </div>
        <div className="txt-sm muted">{portion?.packaging}</div>
      </div>
    );

    const actions = (
      <div className="col" style={{ gap: 10 }}>
        {deferred('Track courier', 'live tracking coming soon', 'track-courier', true)}
        {deferred('Reschedule delivery', 'rescheduling coming soon', 'reschedule')}
      </div>
    );

    return (
      <div data-testid="tracker-page">
        <div className={styles.mobile} data-testid="tracker-mobile">
          {backRow(state)}
          {header}
          {windowCard}
          {portionCard}
          {feed}
          {actions}
          {viewPool}
        </div>
        <div className={styles.web} data-testid="tracker-web">
          {backRow(state)}
          {header}
          <div className="row top" style={{ gap: 26, marginTop: 14 }}>
            <div style={{ flex: '0 0 340px' }} className="col">
              {windowCard}
              {actions}
              {viewPool}
            </div>
            <div style={{ flex: 1 }} className="col">
              {portionCard}
              {feed}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================== DELIVERED (H7) ============================== */
  const hubName = hubs.find((h) => h.id === activeHubId)?.name ?? 'London';

  const celebration = (
    <div className="col" style={{ gap: 12 }}>
      <div className="illo-tile" style={{ height: 130 }}>
        <SceneDoorstep />
      </div>
      <div className="card ink col" style={{ gap: 6 }} data-testid="delivered-header">
        <span className="eyebrow">delivered</span>
        <div className="display" style={{ fontSize: 28 }}>
          Time to cook.
        </div>
      </div>
    </div>
  );

  const savingsCard = (
    <div className="card green-soft" data-testid="delivered-savings">
      You saved <b>{money(ticket.savings ?? 0)}</b> on this pool
    </div>
  );

  const ratingCard = (
    <div className="card col" style={{ gap: 8 }} data-testid="rating-card">
      <span className="eyebrow">How was it?</span>
      <Stars value={ticket.rating ?? 0} onRate={rate} />
      {thanks ? (
        <span className="txt-sm accent bold" data-testid="rating-thanks">
          Thanks ✓
        </span>
      ) : null}
    </div>
  );

  const statsCard = (
    <div className="card" data-testid="delivered-stats">
      <div className="kv">
        <span className="k">Saved all-time</span>
        <span className="v accent" data-testid="stat-saved">
          ${wallet?.savedTotal ?? 0}
        </span>
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
  );

  const openSuggestions = nextPools
    .filter((p) => p.id !== ticket.poolId && (p.status === 'awaiting' || p.status === 'filling'))
    .slice(0, 2);

  const nextCard = (
    <div className="col" style={{ gap: 10 }} data-testid="next-card">
      <span className="eyebrow">what&apos;s next</span>
      {openSuggestions.map((p) => (
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
      ))}
      <Link href="/discover" className="btn accent block" data-testid="find-next">
        Find your next pool
      </Link>
      <Link href="/suggest" className="btn block" data-testid="suggest-item">
        <Icon name="sparkle" size={16} stroke={1.9} /> Suggest an item
      </Link>
    </div>
  );

  return (
    <div data-testid="tracker-page">
      <div className={styles.mobile} data-testid="tracker-mobile">
        {backRow(state)}
        {celebration}
        {savingsCard}
        {ratingCard}
        {statsCard}
        {nextCard}
      </div>
      <div className={styles.web} data-testid="tracker-web">
        {backRow(state)}
        <div className="row top" style={{ gap: 26, marginTop: 14 }}>
          <div style={{ flex: 1 }} className="col">
            {celebration}
            {savingsCard}
            {ratingCard}
          </div>
          <div style={{ flex: '0 0 320px' }} className="col">
            {statsCard}
            {nextCard}
          </div>
        </div>
      </div>
    </div>
  );
}
