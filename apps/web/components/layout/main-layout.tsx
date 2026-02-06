'use client';

import { Sidebar } from './sidebar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, _hasHydrated, setHasHydrated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure we're on client side and check hydration
  useEffect(() => {
    setMounted(true);
    
    // Fallback: If Zustand hasn't hydrated after 200ms, force it
    if (!_hasHydrated) {
      const timeout = setTimeout(() => {
        if (!useAuth.getState()._hasHydrated) {
          setHasHydrated(true);
        }
      }, 200);
      
      return () => clearTimeout(timeout);
    }
  }, [_hasHydrated, setHasHydrated]);

  useEffect(() => {
    if (!mounted) return;
    if (!_hasHydrated) return;
    if (!user) {
      router.replace('/login');
    }
  }, [mounted, _hasHydrated, user, router]);

  if (!mounted || !_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
          <p className="mt-3 text-sm text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                ระบบติดตามและหนุนเสริมการพัฒนาครูรัก(ษ์)ถิ่น
              </h2>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
