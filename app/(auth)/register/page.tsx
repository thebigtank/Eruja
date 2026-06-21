import Link from 'next/link';
import { Logo } from '@/components/primitives';

export default function RegisterPage() {
  return (
    <div className="card col" style={{ gap: 14 }}>
      <Logo size={24} mark={30} />
      <h1 className="h-lg" style={{ margin: 0 }}>
        Join your hub
      </h1>
      <p className="txt-sm muted" style={{ margin: 0 }}>
        Create an account to buy a seat and pool with your city. The form lands in a later phase.
      </p>
      <Link href="/login" className="txt-sm accent bold" style={{ textDecoration: 'none' }}>
        Already have an account? Sign in →
      </Link>
    </div>
  );
}
