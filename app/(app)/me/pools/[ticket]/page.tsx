'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ScreenPlaceholder, DataProof } from '@/components/app/ScreenPlaceholder';
import { api } from '@/lib/api/client';
import { ticketVisualState, VISUAL_STATE_LABEL, type TicketVisualState } from '@/lib/ticket-state';
import type { OrderTicket } from '@/lib/types';

export default function TrackingPage() {
  const { ticket: ticketId } = useParams<{ ticket: string }>();
  const [ticket, setTicket] = useState<OrderTicket | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api.tickets
      .get(ticketId)
      .then(setTicket)
      .catch(() => setMissing(true));
  }, [ticketId]);

  const state: TicketVisualState | null = ticket ? ticketVisualState(ticket.status) : null;
  const title = ticket ? ticket.name : missing ? 'Ticket not found' : 'Loading ticket…';
  // One status-driven screen renders waiting | cargo | last-mile | delivered (H4–H7).
  const stage = state ? `tracking · ${VISUAL_STATE_LABEL[state]}` : 'tracking';

  return (
    <ScreenPlaceholder stage={stage} title={title}>
      {ticket && state ? (
        <DataProof>
          state: {state} · status: {ticket.status} · {ticket.fill.filled}/{ticket.fill.total} seats
        </DataProof>
      ) : null}
    </ScreenPlaceholder>
  );
}
