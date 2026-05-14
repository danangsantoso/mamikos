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
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
          {children}
        </div>
      </body>
    </html>
  );
}
