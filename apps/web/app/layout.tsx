import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export const metadata: Metadata = {
  title: 'TeacherMon - ระบบติดตามและหนุนเสริมการพัฒนาครูรัก(ษ์)ถิ่น',
  description: 'Kru Rak Thin Monitoring & Support System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased font-sans">
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
