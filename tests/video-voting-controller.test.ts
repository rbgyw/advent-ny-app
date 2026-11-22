import { flushPromises, mount } from '@vue/test-utils';
import { h, reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVideoVoting } from '../src/composables/useVideoVoting';
import { videoVotingService } from '../src/services/video-voting.service';
import { assignment, deferred } from './fixtures';
import type { DecemberTaskProps } from '../src/types/december';
import type { VideoVotingState } from '../src/utils/video-voting';
vi.mock('../src/services/video-voting.service', () => ({ videoVotingService: { loadCatalog: vi.fn(), loadState: vi.fn(), vote: vi.fn() } }));
const videos = ['a', 'b'].map(id => ({ id, title: id, description: '', author: '', videoUrl: `https://example.com/${id}.mp4` }));
const initial: VideoVotingState = { votes: [], ranking: [{ videoId: 'a', likes: 3 }, { videoId: 'b', likes: 8 }], totalVideos: 2, complete: false };
function host() {
  const props = reactive<DecemberTaskProps>({ assignment: assignment({ id: 'assignment-22', task_id: 22 }), day: 22, total: 25, loading: false, saving: false, error: null, saveError: null });
  const complete = vi.fn();
  let api!: ReturnType<typeof useVideoVoting>;
  const wrapper = mount({ setup() { api = useVideoVoting(props, complete); return () => h('div'); } });
  return { props, complete, api, wrapper };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(videoVotingService.loadCatalog).mockReset().mockResolvedValue(videos);
  vi.mocked(videoVotingService.loadState).mockReset().mockResolvedValue(initial);
  vi.mocked(videoVotingService.vote).mockReset();
});
describe('video voting interaction controller', () => {
  it('restores server choices and orders the top by all-user likes', async () => {
    vi.mocked(videoVotingService.loadState).mockResolvedValue({ ...initial, votes: [{ videoId: 'a', liked: false }] });
    const { api } = host(); await flushPromises();
    expect(api.current.value?.id).toBe('b');
    expect(api.ranking.value.map(video => video.id)).toEqual(['b', 'a']);
    expect(videoVotingService.vote).not.toHaveBeenCalled();
  });
  it('never advances or animates before confirmation and ignores duplicate clicks', async () => {
    const pending = deferred<VideoVotingState>();
    vi.mocked(videoVotingService.vote).mockReturnValue(pending.promise);
    const { api } = host(); await flushPromises();
    const saving = api.vote(true);
    await api.vote(false);
    expect(videoVotingService.vote).toHaveBeenCalledExactlyOnceWith(22, 'a', true);
    expect(api.current.value?.id).toBe('a');
    expect(api.swipe.value).toBeNull();
    pending.resolve({ ...initial, votes: [{ videoId: 'a', liked: true }] });
    await saving;
    expect(api.swipe.value).toBe('right');
    expect(api.current.value?.id).toBe('a');
    await vi.advanceTimersByTimeAsync(420);
    expect(api.current.value?.id).toBe('b');
    expect(api.busy.value).toBe(false);
  });
  it('animates the server-confirmed original choice after a conflicting retry', async () => {
    vi.mocked(videoVotingService.vote).mockResolvedValue({ ...initial, votes: [{ videoId: 'a', liked: false }] });
    const { api } = host(); await flushPromises();
    await api.vote(true);
    expect(api.swipe.value).toBe('left');
    api.finishSwipe();
    expect(api.current.value?.id).toBe('b');
  });
  it('keeps the card on failure and permits a safe retry', async () => {
    vi.mocked(videoVotingService.vote).mockRejectedValueOnce(new Error('Network'));
    const { api } = host(); await flushPromises();
    await api.vote(true);
    expect(api.current.value?.id).toBe('a');
    expect(api.busy.value).toBe(false);
    expect(api.error.value).toContain('Не удалось сохранить оценку');
    vi.mocked(videoVotingService.vote).mockResolvedValueOnce({ ...initial, votes: [{ videoId: 'a', liked: true }] });
    await api.vote(true); api.finishSwipe();
    expect(api.current.value?.id).toBe('b');
  });
  it('opens the top and notifies the parent once after the server completes the last vote', async () => {
    vi.mocked(videoVotingService.loadState).mockResolvedValue({ ...initial, votes: [{ videoId: 'a', liked: true }] });
    vi.mocked(videoVotingService.vote).mockResolvedValue({ ...initial, votes: [{ videoId: 'a', liked: true }, { videoId: 'b', liked: false }], complete: true });
    const { api, complete } = host(); await flushPromises();
    await api.vote(false); api.finishSwipe(); api.finishSwipe();
    expect(api.current.value).toBeUndefined();
    expect(api.rankingOpen.value).toBe(true);
    expect(complete).toHaveBeenCalledOnce();
  });
  it('does not vote or mark completion for an empty collection', async () => {
    vi.mocked(videoVotingService.loadCatalog).mockResolvedValue([]);
    const { api, complete } = host(); await flushPromises();
    expect(api.current.value).toBeUndefined();
    await api.vote(true);
    expect(videoVotingService.loadState).toHaveBeenCalledExactlyOnceWith(22);
    expect(videoVotingService.vote).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });
  it('uses Supabase completion when the media catalog cannot load', async () => {
    vi.mocked(videoVotingService.loadCatalog).mockRejectedValueOnce(new Error('Media unavailable'));
    vi.mocked(videoVotingService.loadState).mockResolvedValueOnce({ ...initial, complete: true });
    const { api } = host(); await flushPromises();
    expect(api.rankingOpen.value).toBe(true);
    expect(api.current.value).toBeUndefined();
  });
  it('blocks a JSON/database catalog mismatch instead of accepting unregistered cards', async () => {
    vi.mocked(videoVotingService.loadState).mockResolvedValue({ votes: [], ranking: [], totalVideos: 0, complete: false });
    const { api } = host(); await flushPromises();
    expect(api.error.value).toContain('Подборка обновляется');
    await api.vote(true);
    expect(videoVotingService.vote).not.toHaveBeenCalled();
  });
  it('ignores stale vote responses after switching users', async () => {
    const pending = deferred<VideoVotingState>();
    vi.mocked(videoVotingService.vote).mockReturnValue(pending.promise);
    const { api, props, complete } = host(); await flushPromises();
    const saving = api.vote(true);
    props.assignment = { ...props.assignment!, user_id: 'other-user' };
    await flushPromises();
    pending.resolve({ ...initial, votes: [{ videoId: 'a', liked: true }, { videoId: 'b', liked: true }], complete: true });
    await saving;
    expect(api.current.value?.id).toBe('a');
    expect(api.swipe.value).toBeNull();
    expect(complete).not.toHaveBeenCalled();
  });
});
