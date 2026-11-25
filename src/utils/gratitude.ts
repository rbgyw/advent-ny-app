import { getEmailError } from './email-policy';

export interface GratitudeLetter {
  anonymous: boolean;
  senderName: string;
  recipient: string;
  message: string;
}

export function normalizeGratitude(value: GratitudeLetter): GratitudeLetter {
  return {
    anonymous: value.anonymous,
    senderName: value.anonymous ? '' : value.senderName.trim(),
    recipient: value.recipient.trim().toLowerCase(),
    message: value.message.trim(),
  };
}

export function gratitudeError(value: GratitudeLetter): { field: 'senderName' | 'recipient' | 'message'; message: string } | null {
  if (!value.anonymous && (!value.senderName || value.senderName.length > 120))
    return { field: 'senderName', message: 'Укажите имя и фамилию (до 120 символов).' };
  const emailError = getEmailError(value.recipient);
  if (emailError) return { field: 'recipient', message: emailError };
  if (!value.message || value.message.length > 5000)
    return { field: 'message', message: 'Напишите благодарность (до 5000 символов).' };
  return null;
}
