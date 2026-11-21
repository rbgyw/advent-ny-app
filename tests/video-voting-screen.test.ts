import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TwentySecondTaskScreen from '../src/components/TwentySecondTaskScreen.vue';
import { videoVotingService } from '../src/services/video-voting.service';
import { assignment } from './fixtures';
vi.mock('../src/services/video-voting.service', () => ({ videoVotingService: { loadCatalog: vi.fn(), loadState: vi.fn(), vote: vi.fn() } }));
const videos = ['a', 'b', 'c', 'd'].map(id => ({ id, title: `Поздравление ${id}`, author: '', description: '', videoUrl: `https://example.com/${id}.mp4` }));
const ranking = [{ videoId: 'a', likes: 4 }, { videoId: 'b', likes: 20 }, { videoId: 'c', likes: 18 }, { videoId: 'd', likes: 12 }];
function screen() { const task = assignment({ task_id: 22 }); task.task = { ...task.task!, id: 22, slug: 'task-22' }; return mount(TwentySecondTaskScreen, { props: { assignment: task, day: 22, total: 25, loading: false, saving: false, error: null, saveError: null } }); }
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(videoVotingService.loadCatalog).mockReset().mockResolvedValue(videos);
  vi.mocked(videoVotingService.loadState).mockReset().mockResolvedValue({ votes: [], ranking, totalVideos: 4, complete: false });
  vi.mocked(videoVotingService.vote).mockReset();
});
describe('December 22 screen', () => {
  it('shows the Figma portrait placeholder with disabled voting until videos are published', async () => {
    vi.mocked(videoVotingService.loadCatalog).mockResolvedValue([]);
    const view = screen(); await flushPromises();
    expect(view.get('h1').text()).toBe('Новогодние поздравления');
    expect(view.text()).toContain('Здесь будет видео');
    expect(view.findAll<HTMLButtonElement>('.video-choices button').every(button => button.element.disabled)).toBe(true);
    expect(view.emitted('completed')).toBeUndefined();
    expect(videoVotingService.loadState).not.toHaveBeenCalled();
  });
  it('connects voting buttons, outgoing animation, server progress and the next card', async () => {
    vi.mocked(videoVotingService.vote).mockResolvedValue({ votes: [{ videoId: 'a', liked: true }], ranking, totalVideos: 4, complete: false });
    const view = screen(); await flushPromises();
    expect(view.get('.video-counter').text()).toBe('Видео 1 из 4');
    await view.get('.video-choices button:last-child').trigger('click'); await flushPromises();
    expect(view.get('.video-swipe-card').classes()).toContain('swipe-right');
    expect(videoVotingService.vote).toHaveBeenCalledExactlyOnceWith(22, 'a', true);
    await view.get('.video-swipe-card').trigger('animationend');
    expect(view.get('.video-card-title').text()).toBe('Поздравление b');
    expect(view.get('.video-counter').text()).toBe('Видео 2 из 4');
    expect(view.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('1');
  });
  it('shows the shared top three, independent of which videos the current user liked', async () => {
    vi.mocked(videoVotingService.loadState).mockResolvedValue({ votes: videos.map((video, index) => ({ videoId: video.id, liked: index === 0 })), ranking, totalVideos: 4, complete: true });
    const view = screen(); await flushPromises();
    expect(view.get('h1').text()).toBe('Топ-3 поздравлений');
    expect(view.get('.video-summary').text()).toBe('Вам понравилось 1 из 4 видео.');
    expect(view.findAll('.video-rank-title').map(row => row.text())).toEqual(['Поздравление b', 'Поздравление c', 'Поздравление d']);
    expect(view.findAll('.video-rank-likes').map(row => row.text())).toEqual(['20 ❤', '18 ❤', '12 ❤']);
    expect(view.find('video').exists()).toBe(false);
    expect(videoVotingService.vote).not.toHaveBeenCalled();
  });
  it('does not invent leaders when all global like counts are zero', async () => {
    vi.mocked(videoVotingService.loadState).mockResolvedValue({ votes: videos.map(video => ({ videoId: video.id, liked: false })), ranking: ranking.map(row => ({ ...row, likes: 0 })), totalVideos: 4, complete: true });
    const view = screen(); await flushPromises();
    expect(view.find('.video-ranking').exists()).toBe(false);
    expect(view.text()).toContain('Пока у поздравлений нет лайков');
  });
});
