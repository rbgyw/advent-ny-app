import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useAuthStore } from '../src/stores/auth';
import { authService } from '../src/services/auth.service';
import type { User } from '@supabase/supabase-js';

vi.mock('../src/services/auth.service', () => ({ authService: { verifyEmailCode: vi.fn() } }));
beforeEach(() => setActivePinia(createPinia()));
afterEach(() => vi.unstubAllEnvs());

it.each(['true', 'false'])('checks the returned session identity in frontend mode %s', async flag => {
  vi.stubEnv('VITE_ENFORCE_CORPORATE_EMAIL', flag);
  vi.mocked(authService.verifyEmailCode).mockResolvedValue({ data: { session: { user: { id: 'test', email: 'qa@example.org' } as User } }, error: null } as never);
  const store = useAuthStore();
  expect((await store.verifyEmailCode('qa@example.org', '123456')).success).toBe(flag === 'false');
  expect(store.isAuthenticated).toBe(flag === 'false');
});
it.each(['true', 'false'])('does not accept OTP verification without a session in mode %s', async flag => {
  vi.stubEnv('VITE_ENFORCE_CORPORATE_EMAIL', flag);
  vi.mocked(authService.verifyEmailCode).mockResolvedValue({ data: { session: null }, error: null } as never);
  const store = useAuthStore();
  expect((await store.verifyEmailCode('qa@geropharm.com', '123456')).success).toBe(false);
  expect(store.isAuthenticated).toBe(false);
});
