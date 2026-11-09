import { supabase } from '../lib/supabase';
import { gratitudeError, normalizeGratitude, type GratitudeLetter } from '../utils/gratitude';

export async function sendGratitude(taskId: number, letter: GratitudeLetter, requestId: string): Promise<void> {
  const payload = normalizeGratitude(letter);
  const validation = gratitudeError(payload);
  if (validation) throw new Error(validation.message);
  const { data, error } = await supabase.functions.invoke('send-gratitude', {
    body: { taskId, requestId, ...payload },
  });
  if (error || data?.sent !== true) {
    let message = typeof data?.error === 'string' ? data.error : '';
    if (error && 'context' in error && error.context instanceof Response) {
      try { message = (await error.context.json()).error || message; } catch { /* Network or deployment error. */ }
    }
    throw new Error(message || 'Не удалось отправить письмо. Попробуйте ещё раз.');
  }
}
