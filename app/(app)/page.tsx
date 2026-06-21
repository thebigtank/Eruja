'use client';

import { useEffect, useState } from 'react';
import { ScreenPlaceholder, DataProof } from '@/components/app/ScreenPlaceholder';
import { api } from '@/lib/api/client';
import type { OrderTicket, Pool, WalletState } from '@/lib/types';

export default function HomePage() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [awaiting, setAwaiting] = useState<OrderTicket[]>([]);
  const [teaser, setTeaser] = useState<Pool[]>([]);

  useEffect(() => {
    api.wallet
      .get()
      .then(setWallet)
      .catch(() => {});
    api.tickets
      .list('awaiting')
      .then(setAwaiting)
      .catch(() => {});
    api.pools
      .list()
      .then(setTeaser)
      .catch(() => {});
  }, []);

  return (
    <ScreenPlaceholder stage="H0 · Home" title="Home — wallet & my pools">
      <DataProof>
        wallet ${wallet?.balance.toFixed(2) ?? '—'} · awaiting pools {awaiting.length} · discover{' '}
        {teaser.length}
      </DataProof>
    </ScreenPlaceholder>
  );
}
