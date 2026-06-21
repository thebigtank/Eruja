import type { CSSProperties } from 'react';

/* ---------- Icon set (stroke, currentColor) ---------- */
/* Ported verbatim from the storyboard bundle (Icons, Avatars, Logo source). */
export const ICONS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9',
  pool: 'M4 7h16M4 12h16M4 17h16',
  wallet:
    'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2zM3 10h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM17 13.5h.01',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M4 12.5 9.5 18 20 6',
  plane: 'M21 15.5 3 11l4-2 5 1 4-5 2 1-2 5 5 1 1 2-4 1.5M9 18l2-3',
  box: 'M3.5 8 12 4l8.5 4v8L12 20l-8.5-4zM3.5 8 12 12l8.5-4M12 12v8',
  truck:
    'M3 6h11v9H3zM14 9h4l3 3v3h-7M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M17.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.6 1-5.8L3.5 9.7l5.9-.9z',
  share: 'M16 6l-4-3-4 3M12 3v12M5 12v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  users:
    'M16 18v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 18v-1a3 3 0 0 0-2.5-3M18 5.5a3 3 0 0 1 0 5',
  arrowUp: 'M12 19V6M6 12l6-6 6 6',
  chevR: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  back: 'M15 6l-6 6 6 6',
  cart: 'M3 5h2l2 11h11l2-7H6M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  sparkle:
    'M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6zM18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  pin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  receipt: 'M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21zM9 8h6M9 12h6',
  leaf: 'M5 19c0-8 6-13 14-13 0 8-5 14-13 14M5 19c2-4 5-6 8-7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2',
  heart:
    'M12 20s-7-4.3-9.2-8.6C1.3 8.3 3 5 6.2 5 8 5 9.3 6 12 8.5 14.7 6 16 5 17.8 5 21 5 22.7 8.3 21.2 11.4 19 15.7 12 20 12 20',
  bag: 'M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2',
  flame:
    'M12 3c1 3-1 4-1 6a3 3 0 0 0 6 0c0 5-2.5 12-9 12-4 0-6-3-6-7 0-3 2-4 3-6 1 2 2 2 3 2 1 0 1-4 4-7z',
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  fill?: boolean;
  style?: CSSProperties;
}

export function Icon({ name, size = 24, stroke = 1.8, fill = false, style }: IconProps) {
  const d = ICONS[name] || ICONS.pool;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d={d} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} />
    </svg>
  );
}
