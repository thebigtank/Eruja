import type { ReactNode } from 'react';

/**
 * Phase-2 skeleton placeholder: proves a route renders + its data resolves, before
 * the real screen lands. Uses existing type helpers only — no new visual system.
 */
export function ScreenPlaceholder({
  title,
  stage,
  children,
}: {
  title: string;
  stage?: string;
  children?: ReactNode;
}) {
  return (
    <section className="col" style={{ gap: 10, maxWidth: 720 }}>
      {stage ? <div className="eyebrow">{stage}</div> : null}
      <h1 className="h-xl" style={{ margin: 0 }}>
        {title}
      </h1>
      <p className="txt muted" style={{ margin: 0 }}>
        Screen — building in a later phase.
      </p>
      {children}
      <div className="motif" style={{ width: 64, marginTop: 4 }} />
    </section>
  );
}

/** Small mono line proving a data read resolved (used by skeleton pages). */
export function DataProof({ children }: { children: ReactNode }) {
  return (
    <div className="card soft txt-sm mono" style={{ marginTop: 4 }} data-testid="data-proof">
      {children}
    </div>
  );
}
