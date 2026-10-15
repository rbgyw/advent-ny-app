import { supabase } from "../lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export const authService = {
  async getCurrentUser() {
    return supabase.auth.getUser();
  },

  async register(email: string, password: string) {
    return supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
  },

  async login(email: string, password: string) {
    return supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
  },

  async logout() {
    return supabase.auth.signOut();
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
