'use client';

import { Stepper } from '@/components/app/Stepper';
import { ProductThumb } from '@/components/primitives';
import type { CartLine } from '@/lib/types';
import styles from './CartLine.module.css';

interface CartLineProps {
  line: CartLine;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  busy?: boolean;
}

const fmt = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

export function CartLineItem({ line, onQuantityChange, onRemove, busy }: CartLineProps) {
  const unitLine = `${line.quantity} ${line.unitLabel} · ${fmt(line.unitPrice)} each`;
  const lineTotal = fmt(line.lineTotal);

  const thumb = (
    <div className={styles.thumb}>
      <ProductThumb kind={line.productKind} />
    </div>
  );

  const info = (
    <div className={styles.info}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{line.name}</p>
      <p className="txt-sm muted" style={{ margin: 0 }}>{line.sub}</p>
      <p className="txt-sm muted" style={{ margin: 0 }}>{unitLine}</p>
    </div>
  );

  const stepper = (
    <Stepper
      value={line.quantity}
      min={1}
      onDecrement={() => !busy && onQuantityChange(line.id, line.quantity - 1)}
      onIncrement={() => !busy && onQuantityChange(line.id, line.quantity + 1)}
    />
  );

  const removeBtn = (
    <button
      type="button"
      className="btn ghost sm"
      onClick={() => onRemove(line.id)}
      disabled={busy}
    >
      Remove
    </button>
  );

  return (
    <div className="card flat" data-testid="cart-line">
      {/* Mobile layout: top block / rule / stepper+total row */}
      <div className={styles.mobile}>
        <div className={styles.mTop}>
          {thumb}
          {info}
        </div>
        <hr className="div" />
        <div className={styles.mBottom}>
          {stepper}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span className="price-mono" style={{ fontSize: 18 }}>{lineTotal}</span>
            {removeBtn}
          </div>
        </div>
      </div>

      {/* Web layout: single row */}
      <div className={styles.web}>
        {thumb}
        {info}
        {stepper}
        <div className={styles.webRight}>
          <span className="price-mono" style={{ fontSize: 18 }}>{lineTotal}</span>
          {removeBtn}
        </div>
      </div>
    </div>
  );
}
