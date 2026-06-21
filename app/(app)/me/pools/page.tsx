'use client';

import { useEffect, useState } from 'react';
import { ScreenPlaceholder, DataProof } from '@/components/app/ScreenPlaceholder';
import { api } from '@/lib/api/client';
import type { OrderTicket } from '@/lib/types';

export default function MyPoolsPage() {
  const [tickets, setTickets] = useState<OrderTicket[]>([]);

  useEffect(() => {
    api.tickets
      .list()
      .then(setTickets)
      .catch(() => {});
  }, []);

  const counts = {
    awaiting: tickets.filter((t) => t.status === 'awaiting' || t.status === 'filling').length,
    inTransit: tickets.filter((t) =>
      ['full_charged', 'sourced', 'in_transit', 'customs', 'last_mile'].includes(t.status),
    ).length,
    delivered: tickets.filter((t) => t.status === 'delivered').length,
  };

  return (
    <ScreenPlaceholder stage="from H0 tabs" title="My pools">
      <DataProof>
        {tickets.length} tickets · awaiting {counts.awaiting} · in transit {counts.inTransit} ·
        delivered {counts.delivered}
      </DataProof>
    </ScreenPlaceholder>
  );
}
