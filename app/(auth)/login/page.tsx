import Link from 'next/link';
import { Logo } from '@/components/primitives';

export default function LoginPage() {
  return (
    <div className="card col" style={{ gap: 14 }}>
      <Logo size={24} mark={30} />
      <h1 className="h-lg" style={{ margin: 0 }}>
        Welcome back
      </h1>
      <p className="txt-sm muted" style={{ margin: 0 }}>
        Sign in to your hub. The form lands in a later phase.
      </p>
      <Link href="/register" className="txt-sm accent bold" style={{ textDecoration: 'none' }}>
        New here? Create an account →
      </Link>
    </div>
  );
}
