/**
 * authStore.js — Zustand store para autenticación
 * Persiste token y datos de usuario en localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user:  null,
      token: null,

      setAuth: (user, token) => set({ user, token }),

      logout: () => {
        set({ user: null, token: null });
      },

      updateUser: (partial) => set((s) => ({ user: { ...s.user, ...partial } })),
    }),
    { name: 'yc_auth' }
  )
);

export default useAuthStore;
