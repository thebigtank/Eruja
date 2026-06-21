'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ScreenPlaceholder, DataProof } from '@/components/app/ScreenPlaceholder';
import { api } from '@/lib/api/client';
import type { Pool } from '@/lib/types';

export default function PoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pool, setPool] = useState<Pool | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api.pools
      .get(id)
      .then(setPool)
      .catch(() => setMissing(true));
  }, [id]);

  const title = pool ? pool.name : missing ? 'Pool not found' : 'Loading pool…';

  return (
    <ScreenPlaceholder stage="H2 · Pool detail & seat selector" title={title}>
      {pool ? (
        <DataProof>
          {pool.id} · {pool.takenSeats}/{pool.totalSeats} seats · group ${pool.groupUnitPrice}/
          {pool.unitLabel} · pack ${pool.groupPackPrice}
        </DataProof>
      ) : null}
    </ScreenPlaceholder>
  );
}
