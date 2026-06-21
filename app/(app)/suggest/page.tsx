'use client';

import { useEffect, useState } from 'react';
import { ScreenPlaceholder, DataProof } from '@/components/app/ScreenPlaceholder';
import { api } from '@/lib/api/client';
import type { Suggestion } from '@/lib/types';

export default function SuggestPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    api.suggestions
      .list({ sort: 'trending' })
      .then(setSuggestions)
      .catch(() => {});
  }, []);

  const graduated = suggestions.filter((s) => s.status === 'graduated').length;

  return (
    <ScreenPlaceholder stage="H8 · Suggest & vote" title="Suggest & vote">
      <DataProof>
        suggestions {suggestions.length} · graduated {graduated}
      </DataProof>
    </ScreenPlaceholder>
  );
}
