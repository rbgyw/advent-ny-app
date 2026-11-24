import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../src/services/auth.service';
import { supabase } from '../src/lib/supabase';

vi.mock('../src/lib/supabase', () => ({ supabase: { auth: { signInWithOtp: vi.fn(), verifyOtp: vi.fn() } } }));
beforeEach(() => vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null }));

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
});
