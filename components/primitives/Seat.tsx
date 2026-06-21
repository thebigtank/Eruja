import { Avatar } from './Avatar';

/* ---------- Seat (one slot in the pool) ---------- */

export type SeatState = 'empty' | 'taken' | 'mine';

export interface SeatProps {
  state?: SeatState;
  i?: number;
}

export function Seat({ state = 'empty', i = 0 }: SeatProps) {
  if (state === 'empty') return <div className="seat empty" />;
  return (
    <div className={`seat ${state === 'mine' ? 'mine' : ''}`}>
      <Avatar i={i} />
    </div>
  );
}

/* ---------- Pool of People grid ---------- */

export interface PoolPeopleProps {
  total?: number;
  filled?: number;
  mine?: number;
  cols?: number;
}

export function PoolPeople({ total = 64, filled = 0, mine = 0, cols = 10 }: PoolPeopleProps) {
  const seats = [];
  for (let i = 0; i < total; i++) {
    let state: SeatState = 'empty';
    if (i < mine) state = 'mine';
    else if (i < filled) state = 'taken';
    seats.push(<Seat key={i} state={state} i={i + 3} />);
  }
  return (
    <div className="people" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {seats}
    </div>
  );
}

/* ---------- Condensed avatar stack (for cards) ---------- */

export interface AvatarStackProps {
  count?: number;
  total?: number;
  max?: number;
  /** Custom label for the trailing "+more" chip (e.g. "+2.3k"); overrides the numeric count. */
  moreLabel?: string;
}

export function AvatarStack({ count = 5, total, max = 5, moreLabel }: AvatarStackProps) {
  const show = Math.min(count, max);
  const seats = [];
  for (let i = 0; i < show; i++) {
    seats.push(
      <div key={i} className="seat" style={{ width: 26, height: 26 }}>
        <Avatar i={i * 4 + 2} />
      </div>,
    );
  }
  const more = moreLabel ?? (total && total > show ? `+${total - show}` : null);
  return (
    <div className="stack">
      {seats}
      {more ? <div className="more">{more}</div> : null}
    </div>
  );
}
