'use client';

import { useEffect, useState } from 'react';
import { ScreenPlaceholder, DataProof } from '@/components/app/ScreenPlaceholder';
import { api } from '@/lib/api/client';
import type { Hub, Pool } from '@/lib/types';

export default function DiscoverPage() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);

  useEffect(() => {
    api.hubs
      .list()
      .then(setHubs)
      .catch(() => {});
    api.pools
      .list({ sort: 'filling-fastest' })
      .then(setPools)
      .catch(() => {});
  }, []);

  return (
    <ScreenPlaceholder stage="H1 · Discovery" title="Discover">
      <DataProof>
        hubs {hubs.length} · pools {pools.length}
      </DataProof>
    </ScreenPlaceholder>
  );
}
