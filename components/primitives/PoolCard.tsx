import Link from 'next/link';
import { ProductThumb, type ProductKind } from './ProductIllo';
import { AvatarStack } from './Seat';
import { Progress } from './Progress';

/* ---------- Pool card ---------- */
/* Ported verbatim (markup + classes) from the storyboard UI primitives (asset_4).
   Prices are PACK prices (retail/group); the per-unit prices belong to the H2 seat
   selector, not the card. Wrap in a Next <Link> when `href` is provided.
   (Storyboard's unused `mine`/`members` props are dropped.) */

export interface PoolCardProps {
  name: string;
  kind: ProductKind;
  where: string;
  retail: number;
  group: number;
  filled: number;
  total: number;
  urg?: string;
  href?: string;
}

export function PoolCard({
  name,
  kind,
  where,
  retail,
  group,
  filled,
  total,
  urg,
  href,
}: PoolCardProps) {
  const card = (
    <div className="pool">
      <div className="head">
        <div className="illo">
          <ProductThumb kind={kind} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="name">{name}</div>
          <div className="where">{where}</div>
        </div>
        <div className="pricing">
          <s className="price-mono">${retail}</s>
          <b>${group}</b>
        </div>
      </div>
      <Progress
        value={filled}
        max={total}
        tone={filled / total > 0.72 ? 'accent' : 'green'}
        meta={false}
      />
      <div className="row between">
        <AvatarStack count={5} total={filled} />
        {urg ? (
          <span className="urg">{urg}</span>
        ) : (
          <span className="txt-sm muted mono">
            {filled}/{total} joined
          </span>
        )}
      </div>
    </div>
  );

  if (!href) return card;
  return (
    <Link href={href} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      {card}
    </Link>
  );
}
