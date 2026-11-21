import { beforeEach, describe, expect, it, vi } from 'vitest';
import { videoVotingService } from '../src/services/video-voting.service';
import { supabase } from '../src/lib/supabase';
vi.mock('../src/lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
const state = { votes: [{ video_id: 'v1', liked: true }], ranking: [{ video_id: 'v1', likes: 8 }], total_videos: 1, complete: true };
beforeEach(() => vi.mocked(supabase.rpc).mockReset());

describe('video voting RPCs', () => {
  it('fetches own choices and aggregate ratings from Supabase', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: state, error: null } as never);
    expect((await videoVotingService.loadState(22)).ranking).toEqual([{ videoId: 'v1', likes: 8 }]);
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('get_advent_video_state', { p_task_id: 22 });
  });
  it('sends only the video ID and choice; the server derives the voter and total likes', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: state, error: null } as never);
    expect((await videoVotingService.vote(22, 'v1', true)).complete).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('vote_advent_video', { p_task_id: 22, p_video_id: 'v1', p_liked: true });
  });
  it('preserves a first vote returned by the server after a conflicting retry', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: state, error: null } as never);
    expect((await videoVotingService.vote(22, 'v1', false)).votes[0]!.liked).toBe(true);
  });
  it('does not advance when the RPC fails or does not confirm the choice', async () => {
    const error = { message: 'Недоступно' };
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error } as never);
    await expect(videoVotingService.vote(22, 'v1', true)).rejects.toBe(error);
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: { ...state, votes: [], complete: false }, error: null } as never);
    await expect(videoVotingService.vote(22, 'v1', true)).rejects.toThrow('Сервер не подтвердил');
  });
  it('rejects an invalid video ID before sending a request', async () => {
    await expect(videoVotingService.vote(22, '../bad', true)).rejects.toThrow();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
  it('loads the editable JSON collection without caching or starting a vote', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetcher);
    const abort = new AbortController();
    expect(await videoVotingService.loadCatalog(abort.signal)).toEqual([]);
    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/collections/videos.json' }), { signal: abort.signal, cache: 'no-cache' });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
