/* ============================================================
   Journey scenes (flat, warm) — ported verbatim.
   Use CSS vars so they adopt the palm palette.
   ============================================================ */

/* ---------- Scene: sourcing (farm + sacks + sun) ---------- */
export function SceneSourcing() {
  return (
    <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="180" fill="var(--gold-soft)" />
      <circle cx="258" cy="48" r="26" fill="var(--gold)" />
      <path d="M0 132q60-26 120-12t200-6v66H0z" fill="var(--green)" opacity="0.85" />
      <path d="M0 150q80-16 160-4t160-8v42H0z" fill="var(--green)" />
      {/* sacks */}
      <g transform="translate(40 96)">
        <path
          d="M6 16C6 8 10 6 10 2h24c0 4 4 6 4 14l3 30a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"
          fill="#C9A36A"
        />
        <path d="M10 2c4-2 20-2 24 0l-2 4c-3-1-17-1-20 0z" fill="#B4582F" />
      </g>
      <g transform="translate(80 104)">
        <path
          d="M6 14C6 7 10 5 10 2h20c0 3 4 5 4 12l3 24a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"
          fill="#D9B98A"
        />
        <path d="M10 2c3-2 17-2 20 0l-2 4c-2-1-14-1-16 0z" fill="#2F6B4E" />
      </g>
      {/* a few people */}
      <g transform="translate(180 92)">
        <circle cx="0" cy="0" r="9" fill="#9A6035" />
        <rect x="-8" y="9" width="16" height="26" rx="6" fill="#2B3F8F" />
      </g>
      <g transform="translate(210 96)">
        <circle cx="0" cy="0" r="9" fill="#C9854F" />
        <rect x="-8" y="9" width="16" height="24" rx="6" fill="#D83A1B" />
      </g>
    </svg>
  );
}

/* ---------- Scene: cargo / route ---------- */
export function SceneCargo() {
  return (
    <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="180" fill="var(--surface-2)" />
      <path
        d="M40 130 C120 40 210 40 286 96"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeDasharray="3 7"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="40" cy="130" r="6" fill="var(--green)" />
      <text
        x="40"
        y="150"
        fontFamily="var(--font-mono)"
        fontSize="9"
        fill="var(--ink-3)"
        textAnchor="middle"
      >
        LAGOS
      </text>
      <circle cx="286" cy="96" r="6" fill="var(--ink)" />
      <text
        x="286"
        y="116"
        fontFamily="var(--font-mono)"
        fontSize="9"
        fill="var(--ink-3)"
        textAnchor="middle"
      >
        LONDON
      </text>
      {/* plane */}
      <g transform="translate(168 60) rotate(-22)">
        <path d="M-16 0 L14 -3 L20 0 L14 3 Z" fill="var(--ink)" />
        <path d="M0 -2 L-6 -12 L-2 -12 L4 -3 Z" fill="var(--ink)" />
        <path d="M0 2 L-6 12 L-2 12 L4 3 Z" fill="var(--ink)" />
      </g>
    </svg>
  );
}

/* ---------- Scene: doorstep ---------- */
export function SceneDoorstep() {
  return (
    <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="180" fill="var(--accent-soft)" />
      <rect x="120" y="28" width="90" height="140" rx="6" fill="var(--surface)" />
      <rect
        x="120"
        y="28"
        width="90"
        height="140"
        rx="6"
        fill="none"
        stroke="var(--line-2)"
        strokeWidth="2"
      />
      <circle cx="198" cy="100" r="3.4" fill="var(--ink)" />
      {/* package */}
      <g transform="translate(150 120)">
        <rect x="0" y="0" width="46" height="40" rx="4" fill="#C9A36A" />
        <path d="M0 14h46M23 0v40" stroke="#B4582F" strokeWidth="2" />
        <rect x="14" y="6" width="18" height="6" rx="2" fill="#FBF5EA" />
      </g>
      {/* plant */}
      <g transform="translate(96 120)">
        <rect x="-8" y="28" width="20" height="22" rx="3" fill="var(--green)" />
        <path
          d="M2 28C2 8 -8 4 -12 0 -6 0 2 6 2 16 2 6 10 0 16 0 12 4 2 8 2 28Z"
          fill="var(--green)"
        />
      </g>
    </svg>
  );
}

/* ---------- Scene: map (hub picker) ---------- */
export function SceneMap() {
  const pins = [
    [90, 70],
    [150, 110],
    [230, 80],
    [270, 130],
  ];
  return (
    <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="180" fill="var(--surface-2)" />
      <path d="M-10 40q60 10 120 0t140 6 80-4v150h-340z" fill="var(--green-soft)" opacity="0.6" />
      <g stroke="var(--line-2)" strokeWidth="1" opacity="0.5">
        <path d="M0 60h320M0 100h320M0 140h320M80 0v180M160 0v180M240 0v180" />
      </g>
      {pins.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path
            d="M0 0c5 0 9 4 9 9 0 6-9 14-9 14s-9-8-9-14c0-5 4-9 9-9z"
            fill={i === 0 ? 'var(--accent)' : 'var(--ink)'}
          />
          <circle cx="0" cy="9" r="3" fill="var(--surface)" />
        </g>
      ))}
    </svg>
  );
}
