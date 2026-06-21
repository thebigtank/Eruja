'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProductThumb, Progress } from '@/components/primitives';
import { api } from '@/lib/api/client';
import { useEruja } from '@/lib/store';
import type { Category, Suggestion, SuggestionSort } from '@/lib/types';
import styles from './Suggest.module.css';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'grains', label: 'Grains' },
  { key: 'spices', label: 'Spices' },
  { key: 'soup', label: 'Soup' },
  { key: 'oils', label: 'Oils' },
];

// Labels match the real ordering: trending = votes desc, closest = nearest the
// threshold (== trending while thresholds are uniform), newest = most recent first.
const SORTS: { key: SuggestionSort; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'closest', label: 'Closest' },
  { key: 'newest', label: 'Newest' },
];

export default function SuggestPage() {
  const { hubs, activeHubId } = useEruja();

  const [selectedHub, setSelectedHub] = useState<string>(activeHubId ?? 'london');
  const [sort, setSort] = useState<SuggestionSort>('trending');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [threshold, setThreshold] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [why, setWhy] = useState('');
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.suggestions
      .list({ hubId: selectedHub, sort })
      .then((items) => {
        setSuggestions(items);
        if (items[0]) setThreshold(items[0].threshold);
      })
      .catch(() => setSuggestions([]));
  }, [selectedHub, sort]);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  const hubName = (id: string) => hubs.find((h) => h.id === id)?.name ?? id;
  const canSubmit = name.trim().length > 0 && category !== null && !busy;

  async function vote(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await api.suggestions.vote(id);
      setSuggestions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!canSubmit || !category) return;
    setBusy(true);
    try {
      const created = await api.suggestions.create({
        name: name.trim(),
        hubId: selectedHub,
        category,
        note: why.trim() || undefined,
      });
      setSuggestions((prev) => [created, ...prev]);
      setName('');
      setCategory(null);
      setWhy('');
      setAdded(true);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 1800);
    } finally {
      setBusy(false);
    }
  }

  /* ---------- shared pieces ---------- */

  const intro = (
    <div data-testid="suggest-intro">
      <h1 className="h-xl" style={{ margin: 0 }}>
        Suggest &amp; vote
      </h1>
      <p className="txt" style={{ marginTop: 4 }}>
        Can&apos;t find what you need? Suggest it. At {threshold ?? '…'} votes it becomes a real
        pool.
      </p>
    </div>
  );

  const form = (
    <div className="card col" style={{ gap: 12 }} data-testid="suggest-form">
      <span className="eyebrow">Suggest an item</span>
      <input
        className="fld"
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="suggest-name"
      />
      <div className="col" style={{ gap: 6 }}>
        <span className="txt-sm muted">Hub</span>
        <div className="chips">
          {hubs.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`chip ${selectedHub === h.id ? 'active' : ''}`}
              aria-pressed={selectedHub === h.id}
              onClick={() => setSelectedHub(h.id)}
              data-testid={`hub-${h.id}`}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>
      <div className="col" style={{ gap: 6 }}>
        <span className="txt-sm muted">Category</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`chip ${category === c.key ? 'active' : ''}`}
              aria-pressed={category === c.key}
              onClick={() => setCategory(c.key)}
              data-testid={`cat-${c.key}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        className="fld"
        rows={3}
        placeholder="Why should your city pool this?"
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        data-testid="suggest-why"
      />
      <button
        type="button"
        className="btn accent block"
        disabled={!canSubmit}
        onClick={submit}
        data-testid="suggest-submit"
      >
        Suggest it
      </button>
      {added ? (
        <span className="txt-sm accent bold" data-testid="suggest-added">
          Added to the board ✓
        </span>
      ) : null}
    </div>
  );

  const sortChips = (
    <div className="chips" data-testid="sort-chips">
      {SORTS.map((s) => (
        <button
          key={s.key}
          type="button"
          className={`chip ${sort === s.key ? 'active' : ''}`}
          aria-pressed={sort === s.key}
          onClick={() => setSort(s.key)}
          data-testid={`sort-${s.key}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  const suggestionCard = (s: Suggestion) => {
    const graduated = s.status === 'graduated';
    return (
      <div className="card col" style={{ gap: 10 }} data-testid={`suggestion-${s.id}`} key={s.id}>
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <div className="illo-tile" style={{ width: 48, height: 48, flexShrink: 0 }}>
            <ProductThumb kind={s.productKind} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{s.name}</div>
            <div className="txt-sm muted">
              {hubName(s.hubId)} hub · {s.category}
            </div>
          </div>
          {graduated ? (
            <span className="badge green" data-testid="graduated-badge">
              Now a pool
            </span>
          ) : (
            <button
              type="button"
              className={`btn ${s.youVoted ? 'accent' : 'ghost'}`}
              onClick={() => vote(s.id)}
              disabled={busy}
              data-voted={s.youVoted}
              data-testid="vote-btn"
            >
              ▲ <span data-testid="vote-count">{s.votes}</span>
            </button>
          )}
        </div>

        {/* NOTE: the Suggestion entity carries no "why" field — POST /suggestions accepts
            `note` but the backend doesn't store/return it (write-only in the contract), so
            there is nothing to render here. Flagged for the backend. */}
        <Progress
          value={s.votes}
          max={s.threshold}
          tone={s.votes / s.threshold > 0.72 ? 'accent' : 'green'}
          meta={false}
        />

        {graduated ? (
          <div className="col" style={{ gap: 4 }} data-testid="graduated-footer">
            <div className="txt-sm">Graduated — your city is pooling this.</div>
            <Link
              href="/discover"
              className="txt-sm accent bold"
              style={{ textDecoration: 'none' }}
              data-testid="graduated-link"
            >
              Browse pools →
            </Link>
          </div>
        ) : (
          <div className="txt-sm muted" data-testid="vote-meta">
            {s.votes}/{s.threshold} votes · {s.threshold - s.votes} to a pool
          </div>
        )}
      </div>
    );
  };

  const emptyCard = (
    <div className="card" data-testid="suggest-empty">
      <span className="txt-sm muted">
        No suggestions for {hubName(selectedHub)} yet — be the first.
      </span>
    </div>
  );

  const list = (
    <div className="col" style={{ gap: 12 }} data-testid="suggest-list">
      {suggestions.length > 0 ? suggestions.map(suggestionCard) : emptyCard}
    </div>
  );

  return (
    <div data-testid="suggest-page">
      {/* MOBILE */}
      <div className={styles.mobile} data-testid="suggest-mobile">
        {intro}
        {form}
        {sortChips}
        {list}
      </div>

      {/* WEB */}
      <div className={styles.web} data-testid="suggest-web">
        <div className="row top" style={{ gap: 26 }}>
          <div style={{ flex: '0 0 340px' }} className="col">
            {intro}
            {form}
          </div>
          <div style={{ flex: 1 }} className="col">
            {sortChips}
            {list}
          </div>
        </div>
      </div>
    </div>
  );
}
