import { campaignDate } from './calendar';

export interface FilmRecommendation { title: string; reason: string }

export function normalizeFilm(value: FilmRecommendation): FilmRecommendation {
  return { title: value.title.trim(), reason: value.reason.trim() };
}

export function filmError(value: FilmRecommendation): { field: 'title' | 'reason'; message: string } | null {
  if (!value.title || value.title.length > 200) return { field: 'title', message: 'Укажите название фильма (до 200 символов).' };
  if (value.reason.length > 2000) return { field: 'reason', message: 'Сократите комментарий до 2000 символов.' };
  return null;
}

export function filmSubmissionOpen(availableDate: string | undefined, now = new Date()): boolean {
  if (!availableDate || !/^\d{4}-\d{2}-\d{2}$/.test(availableDate)) return false;
  return campaignDate(now) <= `${availableDate.slice(0, 4)}-12-17`;
}
