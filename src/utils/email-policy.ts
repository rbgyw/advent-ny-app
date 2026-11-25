import { emailError, enforceCorporateEmail } from '../../supabase/functions/_shared/email-policy.ts';

export function corporateEmailRequired(): boolean {
  return enforceCorporateEmail(import.meta.env.VITE_ENFORCE_CORPORATE_EMAIL);
}

export function getEmailError(value: unknown): string | null {
  return emailError(value, corporateEmailRequired());
}

export function assertEmailAllowed(value: unknown): void {
  const error = getEmailError(value);
  if (error) throw new Error(error);
}
