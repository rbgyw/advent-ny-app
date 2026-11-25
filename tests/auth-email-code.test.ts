import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../src/services/auth.service';
import { supabase } from '../src/lib/supabase';

vi.mock('../src/lib/supabase', () => ({ supabase: { auth: { signInWithOtp: vi.fn(), verifyOtp: vi.fn() } } }));
beforeEach(() => vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null }));
afterEach(() => vi.unstubAllEnvs());

describe('passwordless authentication', () => {
  it('requests registration with corporate details and no password', async () => {
    await authService.register(' Person@Geropharm.com ', { fullName: 'Имя', workplace: 'ПП Оптиков', consent: true });
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'person@geropharm.com', options: { shouldCreateUser: true, data: {
        full_name: 'Имя', workplace: 'ПП Оптиков', personal_data_consent: true,
        personal_data_consent_at: expect.any(String),
      } },
    });
  });
  it('requests login and resending without creating new accounts', async () => {
    await authService.login(' Person@Geropharm.com ');
    await authService.resendEmailCode('person@geropharm.com');
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledTimes(2);
    expect(supabase.auth.signInWithOtp).toHaveBeenLastCalledWith({ email: 'person@geropharm.com', options: { shouldCreateUser: false } });
  });
  it('uses the email OTP verification flow', async () => {
    await authService.verifyEmailCode('Person@Geropharm.com', '123456');
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'person@geropharm.com', token: '123456', type: 'email' });
  });
  it.each([undefined, 'true', '', 'False', '0'])('rejects external email for every auth operation with policy %j', async flag => {
    vi.stubEnv('VITE_ENFORCE_CORPORATE_EMAIL', flag);
    await expect(authService.register('qa@example.org')).rejects.toThrow('корпоративную');
    await expect(authService.login('qa@example.org')).rejects.toThrow('корпоративную');
    await expect(authService.resendEmailCode('qa@example.org')).rejects.toThrow('корпоративную');
    await expect(authService.verifyEmailCode('qa@example.org', '123456')).rejects.toThrow('корпоративную');
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
  });
  it('allows external addresses for registration/login/resend/verification when disabled, without changing OTP', async () => {
    vi.stubEnv('VITE_ENFORCE_CORPORATE_EMAIL', 'false');
    await authService.register(' QA@Example.org ');
    await authService.login(' QA@Example.org ');
    await authService.resendEmailCode('qa@example.org');
    await authService.verifyEmailCode('QA@example.org', '123456');
    expect(supabase.auth.signInWithOtp).toHaveBeenNthCalledWith(1, { email: 'qa@example.org', options: { shouldCreateUser: true } });
    expect(supabase.auth.signInWithOtp).toHaveBeenNthCalledWith(3, { email: 'qa@example.org', options: { shouldCreateUser: false } });
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'qa@example.org', token: '123456', type: 'email' });
  });
  it.each(['true', 'false'])('never sends OTP to a malformed email in mode %s', async flag => {
    vi.stubEnv('VITE_ENFORCE_CORPORATE_EMAIL', flag);
    await expect(authService.register('bad@')).rejects.toThrow('корректный');
    await expect(authService.login('bad@')).rejects.toThrow('корректный');
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });
});
