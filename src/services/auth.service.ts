import { supabase } from "../lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import type { RegistrationDetails } from "../types/registration";

export const authService = {
  async getCurrentUser() {
    return supabase.auth.getUser();
  },

  async register(email: string, details?: RegistrationDetails) {
    return supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        ...(details ? { data: {
          full_name: details.fullName,
          workplace: details.workplace,
          personal_data_consent: details.consent,
          personal_data_consent_at: details.consent ? new Date().toISOString() : null,
        } } : {}),
      },
    });
  },

  async login(email: string) {
    return supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(), options: { shouldCreateUser: false },
    });
  },

  async logout() {
    return supabase.auth.signOut();
  },

  async verifyEmailCode(email: string, token: string) {
    return supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(), token, type: 'email',
    });
  },

  async resendEmailCode(email: string) {
    return this.login(email);
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
