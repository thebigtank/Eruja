/* ---------- Avatar generator (the pool of people) ---------- */
/* Ported verbatim. Deterministic via Math.sin (no Math.random) — SSR-safe. */

export const SKIN = ['#F2CBA0', '#E6AE7C', '#D49560', '#BB7A45', '#9A6035', '#774726', '#5A3520'];
export const HAIRC = ['#241812', '#33231A', '#160F0B', '#4A3220'];
export const GELE = ['#D83A1B', '#E0A12A', '#2F6B4E', '#2B3F8F', '#B4582F', '#7A2E8A', '#C99A22'];

export function pick(i: number, salt: number, arr: readonly string[]): string {
  const h = Math.abs(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453);
  const idx = Math.floor((h % 1) * arr.length);
  return arr[idx] ?? arr[0] ?? '';
}

export interface AvatarProps {
  i?: number;
}

export function Avatar({ i = 0 }: AvatarProps) {
  const skin = pick(i, 1, SKIN);
  const type = Math.floor(Math.abs(Math.sin(i * 7.13 + 2.1) * 1000)) % 6;
  const hairC = pick(i, 3, HAIRC);
  const geleC = pick(i, 5, GELE);
  const cid = `c${i}`;

  let hair = null;
  if (type === 0) {
    // short crop
    hair = (
      <path
        d="M5 17C5 8 11 4 20 4C29 4 35 8 35 17C30 12 25 11 20 11C15 11 10 12 5 17Z"
        fill={hairC}
      />
    );
  } else if (type === 1) {
    // afro
    hair = <circle cx="20" cy="12" r="13" fill={hairC} />;
  } else if (type === 2) {
    // gele (tall headwrap)
    hair = (
      <g>
        <path
          d="M4 16C4 4 14 -3 20 1C26 -3 36 4 36 16C30 9 25 8 20 8C15 8 10 9 4 16Z"
          fill={geleC}
        />
        <path d="M27 3C35 -1 35 7 31 9C29 6 28 5 26 5Z" fill={geleC} />
        <path
          d="M7 13C13 8 27 8 33 13"
          stroke="rgba(255,255,255,.28)"
          strokeWidth="1.4"
          fill="none"
        />
      </g>
    );
  } else if (type === 3) {
    // head-tie (low band)
    hair = (
      <g>
        <path
          d="M5 16C5 9 11 5 20 5C29 5 35 9 35 16C30 12 25 11 20 11C15 11 10 12 5 16Z"
          fill={hairC}
        />
        <path d="M3 15Q20 8 37 15L37 11Q20 4 3 11Z" fill={geleC} />
      </g>
    );
  } else if (type === 4) {
    // low fade
    hair = <path d="M6 15Q20 8 34 15Q28 11 20 11Q12 11 6 15Z" fill={hairC} />;
  } else {
    // locs
    hair = (
      <g>
        <path
          d="M5 16C5 8 11 4 20 4C29 4 35 8 35 16C30 11 25 10 20 10C15 10 10 11 5 16Z"
          fill={hairC}
        />
        <rect x="4" y="13" width="3" height="12" rx="1.5" fill={hairC} />
        <rect x="33" y="13" width="3" height="12" rx="1.5" fill={hairC} />
      </g>
    );
  }

  return (
    <svg viewBox="0 0 40 40">
      <defs>
        <clipPath id={cid}>
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${cid})`}>
        <rect width="40" height="40" fill={skin} />
        <ellipse cx="14.5" cy="22" rx="1.5" ry="1.8" fill="#2A1E16" opacity="0.75" />
        <ellipse cx="25.5" cy="22" rx="1.5" ry="1.8" fill="#2A1E16" opacity="0.75" />
        {hair}
      </g>
    </svg>
  );
}
