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
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@geropharm\.com$/i.test(value.recipient) || value.recipient.length > 254)
    return { field: 'recipient', message: 'Укажите корпоративную почту @geropharm.com.' };
  if (!value.message || value.message.length > 5000)
    return { field: 'message', message: 'Напишите благодарность (до 5000 символов).' };
  return null;
}
