import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ErrorBoundary } from '@/components/error-boundary';

// Optimized font loading via next/font (self-hosted, no render-blocking)
const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sarabun',
});

export const metadata: Metadata = {
  title: 'TeacherMon - ระบบติดตามและหนุนเสริมการพัฒนาครูรัก(ษ์)ถิ่น',
  description: 'Kru Rak Thin Monitoring & Support System',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className={`${sarabun.className} antialiased`}>
        <ErrorBoundary>
          <AntdRegistry>
            <Providers>{children}</Providers>
          </AntdRegistry>
        </ErrorBoundary>
      </body>
    </html>
  );
}
