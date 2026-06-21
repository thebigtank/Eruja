'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthFrame } from '@/components/auth/AuthFrame';
import { PasswordField } from '@/components/auth/PasswordField';
import { Logo, SceneSourcing } from '@/components/primitives';
import { api, ApiError } from '@/lib/api/client';
import { useEruja } from '@/lib/store';
import { isEmail } from '@/lib/validate';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useEruja();

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

  const valid = isEmail(email) && password.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      // Contract note: the mock backend does not verify the password — expected.
      await login(email.trim(), password);
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
        Ẹ káàbọ̀ — <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>welcome back.</em>
      </h1>
      <p className="txt" style={{ color: 'var(--ink-2)', margin: 0 }}>
        Sign in to your pools, your wallet, and your city.
      </p>
    </>
  );

  return (
    <AuthFrame brand={brand}>
      <form className="card col" style={{ gap: 14 }} onSubmit={onSubmit} noValidate>
        <span className="eyebrow">Sign in</span>
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
          autoComplete="current-password"
        />

        {/* Deferred: forgot-password is a frontend-only no-op stub this phase. */}
        <div style={{ textAlign: 'right', marginTop: -4 }}>
          <button
            type="button"
            className="txt-sm muted mono"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => {}}
          >
            Forgot password?
          </button>
        </div>

        {error ? (
          <div className="txt-sm" style={{ color: 'var(--ink-2)' }} role="alert">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn accent block lg" disabled={!valid || submitting}>
          Sign in
        </button>

        <div className="center txt-sm">
          New to Eruja?{' '}
          <Link href="/register" className="accent bold" style={{ textDecoration: 'none' }}>
            Create an account
          </Link>
        </div>
      </form>
    </AuthFrame>
  );
}
