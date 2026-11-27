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
  it('uses the confirmed account recipient and sends only the letter body', async () => {
    const recipientEmail = flag === 'true' ? 'account@geropharm.com' : 'qa@example.org';
    const view = mount(SixteenthTaskScreen, { props: { ...props, recipientEmail }, global });
    expect(view.get<HTMLInputElement>('input[type=email]').element.value).toBe(recipientEmail);
    expect(view.get('input[type=email]').attributes()).toHaveProperty('readonly');
    expect(view.text()).toContain(flag === 'true' ? 'Моя корпоративная почта' : 'Мой email');
    await view.get('textarea').setValue('Письмо в будущее');
    await view.get('form').trigger('submit');
    expect(view.emitted('submit')).toEqual([['Письмо в будущее']]);
    expect(view.emitted('save')).toBeUndefined();
    await view.setProps({ recipientEmail: '' });
    await view.get('form').trigger('submit');
    expect(view.emitted('submit')).toHaveLength(1);
    expect(view.get('[role=alert]').text()).toContain('Подтвердите почту');
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
