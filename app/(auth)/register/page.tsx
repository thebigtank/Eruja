'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthFrame, authStyles } from '@/components/auth/AuthFrame';
import { PasswordField } from '@/components/auth/PasswordField';
import { Logo, SceneSourcing, AvatarStack, Icon } from '@/components/primitives';
import { api, ApiError } from '@/lib/api/client';
import { useEruja } from '@/lib/store';
import { isEmail } from '@/lib/validate';

export default function RegisterPage() {
  const router = useRouter();
  const { hubs, activeHubId, loadHubs, setActiveHub, register } = useEruja();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auth guard: an existing session skips the form.
  useEffect(() => {
    api.auth
      .session()
      .then(() => router.replace('/'))
      .catch(() => {});
  }, [router]);

  // Load hubs for the chip row.
  useEffect(() => {
    void loadHubs();
  }, [loadHubs]);

  // Default to the first hub (London) once hubs arrive.
  useEffect(() => {
    if (!activeHubId && hubs.length > 0) setActiveHub(hubs[0]!.id);
  }, [activeHubId, hubs, setActiveHub]);

  const hubName = hubs.find((h) => h.id === activeHubId)?.name ?? 'London';
  const valid = name.trim().length > 0 && isEmail(email) && password.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !activeHubId || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await register({ name: name.trim(), email: email.trim(), password, hubId: activeHubId });
      // TODO: route new registrations to /discover once that screen exists.
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const brand = (
    <>
      <Logo size={28} mark={34} />
      <div className="illo-tile" style={{ height: 140, background: 'var(--gold-soft)' }}>
        <SceneSourcing />
      </div>
      <h1 className="display" style={{ fontSize: 32, margin: 0 }}>
        The ingredients of home,{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>pooled together.</em>
      </h1>
      <p className="txt" style={{ color: 'var(--ink-2)', margin: 0 }}>
        Join your city&rsquo;s pool, wait together, and pay wholesale on the foods of home.
      </p>
      {/* Cosmetic social proof — NOT a data field; the count is copy. */}
      <div className="row" style={{ gap: 10 }}>
        <AvatarStack count={5} moreLabel="+2.3k" />
        <span className="txt-sm muted">2,300+ neighbours pooling in {hubName}</span>
      </div>
      <div className={`col ${authStyles.webOnly}`} style={{ gap: 7 }}>
        {[
          'No card to browse',
          'Top up only when you join',
          'Cancel a seat before a pool fills',
        ].map((tick) => (
          <span
            key={tick}
            className="eyebrow"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="check" size={13} stroke={2.4} />
            {tick}
          </span>
        ))}
      </div>
    </>
  );

  return (
    <AuthFrame brand={brand}>
      <form className="card col" style={{ gap: 14 }} onSubmit={onSubmit} noValidate>
        <span className="eyebrow">Create your account</span>
        <input
          className="fld"
          placeholder="Full name"
          aria-label="Full name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="fld"
          type="email"
          inputMode="email"
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="Password"
          autoComplete="new-password"
        />

        <div className="col" style={{ gap: 8 }}>
          <span className="eyebrow">Your hub</span>
          <div className="chips">
            {hubs.map((h) => (
              <button
                type="button"
                key={h.id}
                className={`chip ${activeHubId === h.id ? 'accent active' : ''}`}
                aria-pressed={activeHubId === h.id}
                onClick={() => setActiveHub(h.id)}
              >
                {h.name}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="txt-sm" style={{ color: 'var(--ink-2)' }} role="alert">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn accent block lg" disabled={!valid || submitting}>
          Create account
          <Icon name="chevR" size={16} stroke={2.4} />
        </button>

        <div className="center txt-sm muted mono">
          No card needed to browse · top up only when you join a pool
        </div>
        <div className="center txt-sm">
          Already pooling?{' '}
          <Link href="/login" className="accent bold" style={{ textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </form>
    </AuthFrame>
  );
}
