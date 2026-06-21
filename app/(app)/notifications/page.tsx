'use client';

import { useEffect, useState } from 'react';
import { ScreenPlaceholder, DataProof } from '@/components/app/ScreenPlaceholder';
import { api } from '@/lib/api/client';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    api.notifications
      .list()
      .then(setNotifs)
      .catch(() => {});
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <ScreenPlaceholder stage="Notifications" title="Notifications">
      <DataProof>
        {notifs.length} notifications · unread {unread}
      </DataProof>
    </ScreenPlaceholder>
  );
}
