import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/common/Providers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CASE - BBS | Creative Associate LLP',
  description:
    'CASE - BBS by Creative Associate LLP. "Every Design Has a Story..." Professional Bar Bending Schedule & Structural Steel Inventory Management compliant with IS 2502:1963, IS 456:2000, and IS 13920:2016.',
  keywords: [
    'CASE - BBS',
    'Creative Associate LLP',
    'Bar Bending Schedule',
    'IS 2502:1963',
    'IS 456:2000',
    'IS 13920:2016',
    'Civil Engineering Software',
    'Structural Detailing',
    'Steel Inventory',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 min-h-screen antialiased selection:bg-sky-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
