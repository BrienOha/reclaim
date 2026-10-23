import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ data: any; error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });

    if (!isSupabaseConfigured()) {
      set({ user: null, session: null, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        set({ user: null, session: null, isLoading: false });
      } else {
        set({
          user: data.session.user,
          session: data.session,
          isLoading: false,
        });
      }
    } catch {
      set({ user: null, session: null, isLoading: false });
    }

    // Subscribe to real auth state changes from Supabase
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user || null,
        session: session || null,
        isLoading: false,
      });
    });
  },

  signInWithPassword: async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured. Please check your .env file.') };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error };
    set({ user: data.user, session: data.session });
    return { error: null };
  },

  signUpWithPassword: async (email, password, displayName) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured. Please check your .env file.') };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName?.trim() || email.split('@')[0],
        },
      },
    });
    if (error) return { data: null, error };
    set({ user: data.user, session: data.session });
    return { data, error: null };
  },

  resetPasswordForEmail: async (email) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : undefined,
    });
    return { error };
  },

  updatePassword: async (newPassword) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {});
    }
    set({ user: null, session: null, isLoading: false });
  },
}));
