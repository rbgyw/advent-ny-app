export const CORPORATE_EMAIL_DOMAIN = 'geropharm.com';

/** Fail closed: only the exact environment string "false" disables the policy. */
export function enforceCorporateEmail(value: unknown): boolean {
  return value !== 'false';
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Internet mailbox: ASCII dot-atom local part and DNS domain (IDN as punycode). */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string' || /[\r\n\0]/.test(value)) return false;
  const email = normalizeEmail(value);
  if (email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local = '', domain = ''] = parts;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')
    || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  const labels = domain.split('.');
  return labels.length >= 2 && labels.every(label =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}

export function emailError(value: unknown, corporateOnly = true): string | null {
  if (!isValidEmail(value)) return 'Укажите корректный email-адрес.';
  if (corporateOnly && normalizeEmail(value).split('@')[1] !== CORPORATE_EMAIL_DOMAIN)
    return 'Укажите корпоративную почту @geropharm.com.';
  return null;
}
