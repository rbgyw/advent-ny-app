import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RegistrationForm from '../src/components/RegistrationForm.vue';
import SixteenthTaskScreen from '../src/components/SixteenthTaskScreen.vue';
import EighthTaskScreen from '../src/components/EighthTaskScreen.vue';
import { assignment } from './fixtures';

afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} });
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live networking forbidden'); }));
});
const popup = { template: '<div><slot /></div>', methods: { showModal() {}, close() {} } };
const global = { stubs: { RouterLink: { template: '<a><slot /></a>' }, PopupDialog: popup } };
const props = { assignment: assignment(), day: 16, total: 25, loading: false, saving: false, error: null, saveError: null };

describe.each(['true', 'false'])('forms with corporate policy %s', flag => {
  beforeEach(() => vi.stubEnv('VITE_ENFORCE_CORPORATE_EMAIL', flag));
  it('applies policy in registration while requiring details and valid syntax', async () => {
    const view = mount(RegistrationForm, { props: { loading: false, error: null }, global });
    await view.get('#register-name').setValue('Тестовый пользователь');
    await view.get('#register-workplace').setValue('Другое');
    await view.get('#register-consent').setValue(true);
    await view.get('#register-email').setValue('qa@example.org');
    await view.get('form').trigger('submit');
    expect(Boolean(view.emitted('submit'))).toBe(flag === 'false');
    if (flag === 'true') expect(view.get('[role=alert]').text()).toContain('корпоративную');
    await view.get('#register-email').setValue('invalid@');
    const count = view.emitted('submit')?.length ?? 0;
    await view.get('form').trigger('submit');
    expect(view.emitted('submit')?.length ?? 0).toBe(count);
    expect(view.get('[role=alert]').text()).toContain('корректный');
  });
  it('applies policy to a future letter without changing payload or completion', async () => {
    const view = mount(SixteenthTaskScreen, { props, global });
    await view.get('input[type=email]').setValue('qa@example.org');
    await view.get('textarea').setValue('Письмо в будущее');
    await view.get('form').trigger('submit');
    if (flag === 'false') expect(view.emitted('save')).toEqual([[{ response: { email: 'qa@example.org', text: 'Письмо в будущее', deliver_on: '2027-12-31' }, complete: true }]]);
    else expect(view.emitted('save')).toBeUndefined();
    const count = view.emitted('save')?.length ?? 0;
    await view.get('input[type=email]').setValue('invalid@');
    await view.get('form').trigger('submit');
    expect(view.emitted('save')?.length ?? 0).toBe(count);
  });
  it('applies policy to gratitude without sending a real email', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const view = mount(EighthTaskScreen, { props: { ...props, day: 8, send }, global });
    await view.get('#gratitude-sender').setValue('Тестовый автор');
    await view.get('#gratitude-recipient').setValue('qa@example.org');
    await view.get('#gratitude-message').setValue('Спасибо!');
    await view.get('form').trigger('submit');
    expect(send).toHaveBeenCalledTimes(flag === 'false' ? 1 : 0);
    if (flag === 'false') expect(send).toHaveBeenCalledWith({ anonymous: false, senderName: 'Тестовый автор', recipient: 'qa@example.org', message: 'Спасибо!' }, expect.any(String));
  });
});
