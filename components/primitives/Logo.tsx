/* ---------- Logo mark: calabash bowl + rising ingredients ---------- */
/* Ported verbatim. Uses CSS vars so it adopts the palm palette. */

export interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 34 }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <circle cx="20" cy="20" r="19" fill="var(--ink)" />
      {/* rising grains, one accent */}
      <circle cx="13.5" cy="13" r="2.1" fill="var(--gold)" />
      <circle cx="20" cy="10.5" r="2.4" fill="var(--accent)" />
      <circle cx="26.5" cy="13" r="2.1" fill="var(--green)" />
      {/* calabash bowl */}
      <path d="M9 19h22a11 11 0 0 1-22 0Z" fill="var(--paper)" />
      <path d="M9 19h22" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M14 23.5q6 3 12 0"
        stroke="var(--ink)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export interface LogoProps {
  size?: number;
  mark?: number;
}

export function Logo({ size = 24, mark = 30 }: LogoProps) {
  return (
    <span className="logo" style={{ fontSize: size }}>
      <LogoMark size={mark} />
      eruja<span className="dot">.</span>
    </span>
  );
}
