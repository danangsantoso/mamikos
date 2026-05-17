import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Mamikos - Cari Kos Idaman',
  description: 'Platform pencarian kos terlengkap di Indonesia',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#15803d'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-stone-50">
        <div className="w-full min-h-screen bg-white md:bg-stone-50">
          {children}
        </div>
      </body>
    </html>
  );
}
