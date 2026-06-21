import type { ReactNode } from 'react';

/* ---------- Progress bar ---------- */
/* Ported verbatim from the storyboard UI primitives (asset_4). */

export type ProgressTone = 'accent' | 'green';

export interface ProgressProps {
  value: number;
  max: number;
  tone?: ProgressTone;
  meta?: boolean;
  left?: ReactNode;
  right?: ReactNode;
}

export function Progress({ value, max, tone = 'accent', meta = true, left, right }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="bar">
        <i className={tone} style={{ width: `${pct}%` }} />
      </div>
      {meta && (
        <div className="bar-meta">
          <span>{left ?? `${value} of ${max} seats`}</span>
          <span>{right ?? `${Math.round(pct)}%`}</span>
        </div>
      )}
    </div>
  );
}
