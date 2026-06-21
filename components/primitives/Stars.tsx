'use client';

/* ---------- Star rating ---------- */
/* SVG + .stars class ported verbatim from the storyboard primitives (asset_4),
   extended with an interactive mode: pass `onRate` to make each star a button.
   Read-only by default (no `onRate`) — same render the storyboard used. */

export interface StarsProps {
  value: number;
  max?: number;
  size?: number;
  /** When provided, each star becomes a button that calls onRate(n). */
  onRate?: (n: number) => void;
  readOnly?: boolean;
}

const PATH = 'M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.6 1-5.8L3.5 9.7l5.9-.9z';

export function Stars({ value, max = 5, size = 26, onRate, readOnly = false }: StarsProps) {
  const interactive = !readOnly && !!onRate;
  const star = (n: number) => {
    const filled = n <= value;
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={filled ? 'var(--gold)' : 'none'}
        stroke={filled ? 'var(--gold)' : 'var(--line-2)'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d={PATH} />
      </svg>
    );
  };

  return (
    <div className="stars" data-testid="stars" data-value={value}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) =>
        interactive ? (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onRate?.(n)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            {star(n)}
          </button>
        ) : (
          <span key={n}>{star(n)}</span>
        ),
      )}
    </div>
  );
}
