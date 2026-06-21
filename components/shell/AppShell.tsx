'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo, Icon, type IconName } from '@/components/primitives';
import { useEruja } from '@/lib/store';
import styles from './AppShell.module.css';

/**
 * Responsive app shell SEAM (stub): desktop top nav with wallet pill + hub chip,
 * mobile bottom tab bar. Hydrates session/hub/wallet/cart via the store on mount.
 * Screen content lands inside {children} in later phases.
 */

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/pools', label: 'My pools', icon: 'pool' },
  { href: '/suggest', label: 'Suggest', icon: 'sparkle' },
  { href: '/wallet', label: 'Wallet', icon: 'wallet' },
];

const NAV: { href: string; label: string }[] = [
  { href: '/', label: 'Discover' },
  { href: '/pools', label: 'My pools' },
  { href: '/suggest', label: 'Suggest' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hubs, activeHubId, wallet, bootstrap } = useEruja();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const hubName = hubs.find((h) => h.id === activeHubId)?.name ?? 'London';
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.left}>
          <Link href="/" aria-label="Eruja home" style={{ textDecoration: 'none' }}>
            <Logo size={22} mark={28} />
          </Link>
          <nav className={`web-nav ${styles.desktopNav}`}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={isActive(n.href) ? 'active' : ''}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.right}>
          <span className="wallet-pill">
            <Icon name="wallet" size={16} stroke={2} />${(wallet?.balance ?? 0).toFixed(2)}
          </span>
          <span className="chip accent active">
            <Icon
              name="pin"
              size={13}
              stroke={2}
              style={{ marginRight: 4, verticalAlign: '-2px' }}
            />
            {hubName}
          </span>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <div className={styles.tabbarWrap}>
        <div className="tabbar">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={`tab ${isActive(t.href) ? 'active' : ''}`}>
              <Icon name={t.icon} size={21} stroke={isActive(t.href) ? 2.2 : 1.8} />
              <span>{t.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
