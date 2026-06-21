import { Logo } from '@/components/primitives';

export default function HomePage() {
  return (
    <section className="col" style={{ gap: 16, maxWidth: 640 }}>
      <Logo size={28} mark={34} />
      <h1 className="display" style={{ fontSize: 40, margin: 0 }}>
        The ingredients of home, <em style={{ color: 'var(--accent)' }}>pooled together.</em>
      </h1>
      <p className="txt">
        Home — the discover feed, wallet, and your pools land here in a later phase. The shell,
        design system, and reference API are wired and live.
      </p>
      <div className="motif" />
    </section>
  );
}
