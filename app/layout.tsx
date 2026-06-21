import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eruja — the ingredients of home, pooled together',
  description:
    'Eruja is a community group-buying app for diaspora foods. Buy a seat in a pool, wait with the group, and split wholesale prices with your city.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
