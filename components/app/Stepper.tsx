'use client';

/* Reusable −/value/+ stepper around the ported .stepper markup. Reused by H2/H3/H4. */

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

export function Stepper({ value, min = 1, max, onDecrement, onIncrement }: StepperProps) {
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label="Decrease"
        onClick={onDecrement}
        disabled={atMin}
        style={{ opacity: atMin ? 0.35 : 1, cursor: atMin ? 'not-allowed' : 'pointer' }}
      >
        −
      </button>
      <span className="val">{value}</span>
      <button
        type="button"
        aria-label="Increase"
        onClick={onIncrement}
        disabled={atMax}
        style={{ opacity: atMax ? 0.35 : 1, cursor: atMax ? 'not-allowed' : 'pointer' }}
      >
        +
      </button>
    </div>
  );
}
