import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { clearAllData } from "../db";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;

  // Actions
  initialize: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  initialize: async () => {
    // Restore existing session from localStorage
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, loading: false });

    // Listen for auth state changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  sendMagicLink: async (email: string) => {
    // Do NOT set loading: true here — AuthGuard replaces LoginPage with a spinner
    // when loading is true, which would unmount the Snackbar before it renders.
    // The submit button is disabled via local !email state after clearing the field.
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }, // Only allow pre-existing users
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await clearAllData();
    set({ session: null, user: null });
  },
}));
