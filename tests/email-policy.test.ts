import { afterEach, describe, expect, it, vi } from 'vitest';
import { emailError, enforceCorporateEmail, isValidEmail } from '../supabase/functions/_shared/email-policy';
import { corporateEmailRequired, getEmailError } from '../src/utils/email-policy';
import { gratitudeError } from '../src/utils/gratitude';

afterEach(() => vi.unstubAllEnvs());

describe('email format and corporate policy', () => {
  it.each([undefined, null, true, false, '', 'true', 'False', 'FALSE', '0', 'off', ' false ', 'yes'])('defaults to enforcement for %j', flag => {
    expect(enforceCorporateEmail(flag)).toBe(true);
    expect(emailError('qa@example.org', enforceCorporateEmail(flag))).toContain('корпоративную');
  });
  it('only accepts the exact string false as an opt-out', () => {
    expect(enforceCorporateEmail('false')).toBe(false);
    expect(emailError('qa@example.org', false)).toBeNull();
  });
  it.each([' Person+qa@Geropharm.com ', 'qa@example.org', "o'brien@sub.example.net", 'qa@xn--e1afmkfd.xn--p1ai'])('accepts mailbox syntax independently of domain: %s', value => {
    expect(isValidEmail(value)).toBe(true);
    expect(emailError(value, false)).toBeNull();
  });
  it.each(['', 'bad', '@example.org', 'name@', '.name@example.org', 'name.@example.org', 'na..me@example.org',
    'name@@example.org', 'name@localhost', 'name@bad..org', 'name@-bad.org', 'name@bad-.org',
    'name @example.org', 'Name <qa@example.org>', 'a'.repeat(65) + '@example.org', 'a@' + 'b'.repeat(64) + '.org',
    'qa@example.org\n', 'qa@example.org\r\nBcc: evil@example.org', 'qa@example.org\0', null])('rejects malformed input in both modes: %j', value => {
    expect(emailError(value, true)).toContain('корректный');
    expect(emailError(value, false)).toContain('корректный');
  });
  it.each(['qa@geropharm.com.evil.org', 'qa@sub.geropharm.com', 'qa@evilgeropharm.com'])('checks the exact corporate domain: %s', value => {
    expect(emailError(value, true)).toContain('корпоративную');
    expect(emailError(value, false)).toBeNull();
  });
  it.each(['true', 'false', undefined, 'invalid'])('applies frontend flag %j to task validation', flag => {
    vi.stubEnv('VITE_ENFORCE_CORPORATE_EMAIL', flag);
    expect(corporateEmailRequired()).toBe(flag !== 'false');
    expect(getEmailError('qa@example.org') === null).toBe(flag === 'false');
    const letter = { anonymous: true, senderName: '', recipient: 'qa@example.org', message: 'Спасибо!' };
    expect(gratitudeError(letter) === null).toBe(flag === 'false');
    expect(gratitudeError({ ...letter, recipient: 'broken' })?.field).toBe('recipient');
  });
});
