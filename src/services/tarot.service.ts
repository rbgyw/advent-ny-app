import { supabase } from '../lib/supabase';
import { isTarotCardId } from '../utils/tarot';

export const tarotService = {
  async claimCard(
    taskId: number,
    candidate: number
  ): Promise<number> {
    if (!isTarotCardId(candidate)) {
      throw new Error('Неизвестная карта.');
    }

    const { data, error } = await supabase.rpc(
      'claim_tarot_card',
      {
        p_task_id: taskId,
        p_card_id: candidate,
      }
    );

    if (error) throw error;

    const cardId = data?.card_id;

    if (!isTarotCardId(cardId)) {
      throw new Error(
        'Не удалось прочитать сохранённую карту.'
      );
    }

    return cardId;
  },
};