import type { CSSProperties } from 'react';

/* ============================================================
   Product illustrations (flat, warm) — ported verbatim.
   Registry: kind -> { type, content, band?/accent? }.
   Literal hex is intentional product variety, not palette tokens.
   ============================================================ */

interface ProductSpec {
  type: 'sack' | 'pile' | 'tubers' | 'crescent' | 'jar' | 'bottle';
  content: string;
  band?: string;
  accent?: string;
}

export const PRODUCTS = {
  rice: { type: 'sack', content: '#EFE7D0', band: '#2F6B4E' },
  beans: { type: 'sack', content: '#9C6B3F', band: '#B4582F' },
  honeybeans: { type: 'sack', content: '#A06A3A', band: '#C2562C' },
  egusi: { type: 'sack', content: '#E6C84F', band: '#E0A12A' },
  garri: { type: 'sack', content: '#F0E6C8', band: '#D89A2B' },
  crayfish: { type: 'pile', content: '#D8722B', accent: '#B4451B' },
  yam: { type: 'tubers', content: '#C0915A' },
  plantain: { type: 'crescent', content: '#D9B43A' },
  iru: { type: 'jar', content: '#6E5A38' },
  suya: { type: 'jar', content: '#B23A1B' },
  palm: { type: 'bottle', content: '#C2562C' },
  oil: { type: 'bottle', content: '#E0A12A' },
  stockfish: { type: 'pile', content: '#B9B09A', accent: '#8A8068' },
  cocoyam: { type: 'tubers', content: '#A9794C' },
  bitterleaf: { type: 'crescent', content: '#3E7A3A' },
  flour: { type: 'sack', content: '#F2EAD6', band: '#8C6A3A' },
} as const satisfies Record<string, ProductSpec>;

export type ProductKind = keyof typeof PRODUCTS;

export interface ProductIlloProps {
  kind?: ProductKind;
  size?: number;
}

export function ProductIllo({ kind = 'rice', size }: ProductIlloProps) {
  const p: ProductSpec = PRODUCTS[kind] || PRODUCTS.rice;
  const dim: CSSProperties = size ? { width: size, height: size } : {};
  let art = null;

  if (p.type === 'sack') {
    art = (
      <g>
        <path
          d="M28 34c0-6 4-9 4-14 0-3-2-5-2-8h40c0 3-2 5-2 8 0 5 4 8 4 14l4 44a6 6 0 0 1-6 7H30a6 6 0 0 1-6-7z"
          fill={p.content}
        />
        <path d="M30 12c4-3 36-3 40 0l-3 5c-3-2-31-2-34 0z" fill={p.band} />
        <rect x="38" y="48" width="24" height="22" rx="3" fill="#FBF5EA" opacity="0.92" />
        <rect x="42" y="54" width="16" height="2.4" rx="1.2" fill={p.band} />
        <rect x="42" y="60" width="11" height="2.4" rx="1.2" fill="#A4927B" />
        <path d="M30 12c4-3 36-3 40 0" stroke="#2A1E12" strokeWidth="0" fill="none" />
      </g>
    );
  } else if (p.type === 'jar') {
    art = (
      <g>
        <rect x="32" y="26" width="36" height="60" rx="8" fill="#E7E0CF" />
        <rect x="32" y="40" width="36" height="46" rx="6" fill={p.content} />
        <rect x="36" y="18" width="28" height="12" rx="4" fill="#5E4C39" />
        <rect x="38" y="50" width="24" height="20" rx="3" fill="#FBF5EA" opacity="0.92" />
        <rect x="42" y="56" width="16" height="2.2" rx="1.1" fill={p.content} />
        <rect x="42" y="61" width="10" height="2.2" rx="1.1" fill="#A4927B" />
      </g>
    );
  } else if (p.type === 'bottle') {
    art = (
      <g>
        <rect x="40" y="14" width="20" height="12" rx="2" fill="#5E4C39" />
        <path d="M38 26h24v8l6 8v40a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V42l6-8z" fill={p.content} />
        <rect x="40" y="54" width="20" height="22" rx="3" fill="#FBF5EA" opacity="0.92" />
        <rect x="44" y="60" width="12" height="2.2" rx="1.1" fill={p.content} />
        <rect x="44" y="65" width="8" height="2.2" rx="1.1" fill="#A4927B" />
      </g>
    );
  } else if (p.type === 'pile') {
    const pos = [
      [34, 70],
      [48, 74],
      [62, 70],
      [40, 62],
      [54, 64],
      [47, 55],
      [60, 58],
      [36, 57],
    ];
    const dots = pos.map(([x, y], idx) => (
      <path
        key={idx}
        d={`M${x} ${y} q6 -4 10 1 q-3 6 -10 3 q-4 -2 0 -4z`}
        fill={idx % 2 ? p.accent || p.content : p.content}
      />
    ));
    art = (
      <g>
        <ellipse cx="50" cy="78" rx="30" ry="9" fill="#00000010" />
        {dots}
      </g>
    );
  } else if (p.type === 'tubers') {
    art = (
      <g>
        <ellipse cx="50" cy="78" rx="30" ry="8" fill="#00000010" />
        <rect
          x="22"
          y="52"
          width="46"
          height="16"
          rx="8"
          transform="rotate(-12 45 60)"
          fill={p.content}
        />
        <rect
          x="34"
          y="60"
          width="46"
          height="15"
          rx="7.5"
          transform="rotate(8 57 67)"
          fill={p.content}
          opacity="0.92"
        />
        <circle cx="26" cy="50" r="2.4" fill="#5E4C39" opacity="0.5" />
      </g>
    );
  } else if (p.type === 'crescent') {
    art = (
      <g>
        <ellipse cx="50" cy="78" rx="30" ry="8" fill="#00000010" />
        <path d="M30 66q4-22 24-24 -8 8 -8 16 0 8 8 12 -18 4 -24 -4z" fill={p.content} />
        <path d="M48 70q6-18 22-18 -10 10 -8 18z" fill={p.content} opacity="0.85" />
      </g>
    );
  }

  return (
    <svg viewBox="0 0 100 100" style={dim}>
      {art}
    </svg>
  );
}

/* tiny version for pool-card thumbnail (fills the tile) */
export interface ProductThumbProps {
  kind: ProductKind;
}

export function ProductThumb({ kind }: ProductThumbProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
      }}
    >
      <ProductIllo kind={kind} />
    </div>
  );
}
