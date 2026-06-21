/* ---------- Horizontal progress steps ---------- */
/* Ported verbatim (markup + classes) from the storyboard UI primitives (asset_4).
   Renders the order pipeline: steps before `active` are done, `active` is current,
   the rest are upcoming. Classes (.hsteps/.hstep + .done/.active) live in globals.css. */

export interface HStepsProps {
  steps: string[];
  active: number;
}

export function HSteps({ steps, active }: HStepsProps) {
  return (
    <div className="hsteps">
      {steps.map((s, i) => (
        <div
          key={i}
          className={`hstep ${i < active ? 'done' : ''} ${i === active ? 'active' : ''}`}
        >
          {s}
        </div>
      ))}
    </div>
  );
}
