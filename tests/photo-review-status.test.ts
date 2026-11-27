import { describe, expect, it, vi } from 'vitest';
import { assignment } from './fixtures';
import { calendarWindowLabel, isPhotoReviewPending } from '../src/utils/calendar';

function photoTask(id: number) {
  const base = assignment({ task_id: id, position: id, status: 'in_progress' });
  return { ...base, task: { ...base.task!, id, slug: `task-${String(id).padStart(2, '0')}` },
    response: { id: 'response', user_id: base.user_id, task_id: id, completed_at: null,
      created_at: '2026-11-25T09:00:00Z', updated_at: '2026-11-25T09:00:00Z', response: { submitted_for_review: true } } };
}
describe('photo review presentation', () => {
  it.each([7, 17])('distinguishes task %s in review from completion, even after 24 hours', id => {
    const item = photoTask(id);
    expect(isPhotoReviewPending(item)).toBe(true);
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-28T09:00:00Z'));
    expect(isPhotoReviewPending(item)).toBe(true);
    expect(item.status).toBe('in_progress');
  });
  it.each([7, 17])('server completion wins over a retained submission flag for task %s', id => {
    const item = photoTask(id);
    expect(isPhotoReviewPending({ ...item, status: 'completed' })).toBe(false);
    expect(calendarWindowLabel(id, { ...item, status: 'completed' }, '2026-12-31')).toContain('Выполнено');
    expect(calendarWindowLabel(id, item, '2026-12-31')).toContain('На проверке');
  });
  it('does not classify drafts, basic sport completion, or unrelated tasks as under review', () => {
    const item = photoTask(7);
    expect(isPhotoReviewPending(undefined)).toBe(false);
    expect(isPhotoReviewPending({ ...item, response: null })).toBe(false);
    expect(isPhotoReviewPending({ ...item, status: 'completed', response: { ...item.response, response: { level: 'basic', submitted: true } } })).toBe(false);
    expect(isPhotoReviewPending(photoTask(8))).toBe(false);
    expect(isPhotoReviewPending({ ...photoTask(17), task: null })).toBe(true);
  });
});
