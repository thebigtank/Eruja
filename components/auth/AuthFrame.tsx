import type { ReactNode } from 'react';
import styles from './AuthFrame.module.css';

/**
 * Shared presentational frame for the (auth) screens. Shell-less: paper background
 * + a thin aso-oke .motif brand marker, then a responsive frame that is a single
 * column on mobile (brand condensed on top, form below) and a centered two-column
 * (~960px) layout on web (warm brand panel left, form card right).
 *
 * Slots: `brand` = left/top brand-panel content; `children` = the form card.
 */
export function AuthFrame({ brand, children }: { brand: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.frame}>
      <div className={`motif ${styles.marker}`} />
      <div className={styles.grid}>
        <aside className={styles.brand}>{brand}</aside>
        <div className={styles.form}>{children}</div>
      </div>
    </div>
  );
}

/** Re-export the module so pages can use shared helpers like `.webOnly`. */
export { styles as authStyles };
