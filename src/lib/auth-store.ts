"use client";

import { create } from "zustand";
import { authApi } from "@/features/auth/api";
import type { Tenant, User } from "@/types/domain";

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  tenants: Tenant[];
  ready: boolean;
  loading: boolean;
  bootstrap: () => Promise<void>;
  setSession: (session: { user: User; tenant: Tenant }) => void;
  selectTenant: (tenant: Tenant) => Promise<void>;
  logout: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  tenants: [],
  ready: false,
  loading: false,
  bootstrap: async () => {
    if (get().loading || get().ready) return;
    set({ loading: true });
    try {
      const session = await authApi.me();
      set({
        user: session.user,
        tenant: session.tenant,
        tenants: session.user.tenants ?? [],
        ready: true,
        loading: false,
      });
    } catch {
      set({
        user: null,
        tenant: null,
        tenants: [],
        ready: true,
        loading: false,
      });
    }
  },
  setSession: (session) =>
    set({
      user: session.user,
      tenant: session.tenant,
      tenants: session.user.tenants ?? [],
      ready: true,
      loading: false,
    }),
  selectTenant: async (tenant) => {
    await authApi.selectTenant(tenant.id);
    const session = await authApi.me();
    set({
      user: session.user,
      tenant: session.tenant,
      tenants: session.user.tenants ?? [],
    });
  },
  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      get().clear();
    }
  },
  clear: () =>
    set({ user: null, tenant: null, tenants: [], ready: true, loading: false }),
}));
