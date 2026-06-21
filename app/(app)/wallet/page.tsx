'use client';

import { useEffect, useState } from 'react';
import { ScreenPlaceholder, DataProof } from '@/components/app/ScreenPlaceholder';
import { api } from '@/lib/api/client';
import type { WalletState } from '@/lib/types';

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletState | null>(null);

  useEffect(() => {
    api.wallet
      .get()
      .then(setWallet)
      .catch(() => {});
  }, []);

  // NOTE: /wallet has no full storyboard mockup — real design comes in its own phase.
  return (
    <ScreenPlaceholder stage="extrapolated · no full mockup yet" title="Wallet">
      <DataProof>
        balance ${wallet?.balance.toFixed(2) ?? '—'} · held ${wallet?.held.toFixed(2) ?? '—'} ·
        saved ${wallet?.savedTotal.toFixed(2) ?? '—'} · joined {wallet?.poolsJoined ?? '—'} ·
        referred {wallet?.referred ?? '—'}
      </DataProof>
    </ScreenPlaceholder>
  );
}
