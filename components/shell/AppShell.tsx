'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo, Icon, type IconName } from '@/components/primitives';
import { useEruja } from '@/lib/store';
import styles from './AppShell.module.css';

/**
 * Responsive (app) shell: mobile top bar (logo / bell / cart) + bottom tab bar;
 * desktop top nav (logo + nav) + wallet pill + hub chip + cart. Hydrates
 * session/hub/wallet/cart via the store, and guards the group — no session
 * redirects to /login. Active state derives from usePathname().
 */

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/me/pools', label: 'My pools', icon: 'pool' },
  { href: '/suggest', label: 'Suggest', icon: 'sparkle' },
  { href: '/wallet', label: 'Wallet', icon: 'wallet' },
];

const NAV: { href: string; label: string }[] = [
  { href: '/discover', label: 'Discover' },
  { href: '/me/pools', label: 'My pools' },
  { href: '/suggest', label: 'Suggest' },
  { href: '/how-it-works', label: 'How it works' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, hubs, activeHubId, wallet, cart, bootstrap } = useEruja();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Auth guard: once hydrated with no session, leave the (app) group.
  useEffect(() => {
    if (hydrated && !user) router.replace('/login');
  }, [hydrated, user, router]);

  const hubName = hubs.find((h) => h.id === activeHubId)?.name ?? 'London';
  const cartCount = cart?.lines.length ?? 0;
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const current = (href: string) => (isActive(href) ? 'page' : undefined);

  if (!hydrated || !user) {
    return (
      <div className={styles.loading}>
        <Logo size={24} mark={30} />
      </div>
    );
  }

  const CartLink = (
    <Link
      href="/cart"
      aria-label="Cart"
      className={styles.iconLink}
      aria-current={current('/cart')}
    >
      <Icon name="cart" size={22} stroke={1.9} />
      {cartCount > 0 ? <span className={styles.cartBadge}>{cartCount}</span> : null}
    </Link>
  );

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.left}>
          <Link href="/" aria-label="Eruja home" style={{ textDecoration: 'none' }}>
            <Logo size={22} mark={28} />
          </Link>
          <nav className={`web-nav ${styles.desktopNav}`}>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={isActive(n.href) ? 'active' : ''}
                aria-current={current(n.href)}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* desktop right: wallet pill + hub chip + bell + cart */}
        <div className={`${styles.right} ${styles.webOnly}`}>
          <Link
            href="/wallet"
            className="wallet-pill"
            data-testid="shell-wallet-pill"
            style={{ textDecoration: 'none' }}
            aria-current={current('/wallet')}
          >
            <Icon name="wallet" size={16} stroke={2} />${(wallet?.balance ?? 0).toFixed(2)}
          </Link>
          <span className="chip accent active" data-testid="shell-hub-chip">
            <Icon
              name="pin"
              size={13}
              stroke={2}
              style={{ marginRight: 4, verticalAlign: '-2px' }}
            />
            {hubName}
          </span>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className={styles.iconLink}
            aria-current={current('/notifications')}
          >
            <Icon name="bell" size={22} stroke={1.9} />
          </Link>
          {CartLink}
        </div>

        {/* mobile right: bell + cart */}
        <div className={`${styles.right} ${styles.mobileOnly}`}>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className={styles.iconLink}
            aria-current={current('/notifications')}
          >
            <Icon name="bell" size={22} stroke={1.9} />
          </Link>
          {CartLink}
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <div className={styles.tabbarWrap}>
        <div className="tabbar">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`tab ${isActive(t.href) ? 'active' : ''}`}
              aria-current={current(t.href)}
            >
              <Icon name={t.icon} size={21} stroke={isActive(t.href) ? 2.2 : 1.8} />
              <span>{t.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
