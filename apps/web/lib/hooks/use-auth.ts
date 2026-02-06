import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthCookie, clearAuthCookie } from '@/lib/auth-cookie';

interface User {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  teacherId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
  getToken: () => string | null;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      _hasHydrated: false,
      getToken: () => get().token,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        setAuthCookie(token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        clearAuthCookie();
        set({ user: null, token: null });
      },
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating auth:', error);
          // Still mark as hydrated even on error
          setTimeout(() => {
            useAuth.getState().setHasHydrated(true);
          }, 0);
          return;
        }
        
        if (state?.token && typeof document !== 'undefined') {
          setAuthCookie(state.token);
        }
        
        // Always mark as hydrated after rehydration (with or without state)
        setTimeout(() => {
          useAuth.getState().setHasHydrated(true);
        }, 0);
      },
    }
  )
);
