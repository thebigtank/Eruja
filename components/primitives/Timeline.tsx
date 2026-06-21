import type { TimelineEvent } from '@/lib/types';

/* ---------- Transparency timeline ---------- */
/* Ported verbatim (markup + classes) from the storyboard UI primitives (asset_4).
   Renders the order's transparency feed: a vertical list of events, each with a
   dot (done | active | upcoming), title, optional desc, and a `when` stamp.
   Classes (.timeline/.tl-row/.tl-dot/.t/.d/.when) live in globals.css. */

export interface TimelineProps {
  rows: TimelineEvent[];
}

export function Timeline({ rows }: TimelineProps) {
  return (
    <div className="timeline">
      {rows.map((r, i) => (
        <div className="tl-row" key={i}>
          <div className={`tl-dot ${r.state}`} />
          <div>
            <div className="t">{r.title}</div>
            {r.desc ? <div className="d">{r.desc}</div> : null}
          </div>
          <div className="when">{r.when}</div>
        </div>
      ))}
    </div>
  );
}
