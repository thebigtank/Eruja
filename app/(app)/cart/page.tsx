'use client';

import { useEffect, useState } from 'react';
import { ScreenPlaceholder, DataProof } from '@/components/app/ScreenPlaceholder';
import { api } from '@/lib/api/client';
import type { Cart } from '@/lib/types';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    api.cart
      .get()
      .then(setCart)
      .catch(() => {});
  }, []);

  return (
    <ScreenPlaceholder stage="H3 · Cart & wallet checkout" title="Your cart">
      <DataProof>
        lines {cart?.lines.length ?? 0} · subtotal ${cart?.subtotal.toFixed(2) ?? '—'} · after $
        {cart?.balanceAfter.toFixed(2) ?? '—'}
      </DataProof>
    </ScreenPlaceholder>
  );
}
