import { describe, expect, it } from 'vitest';
import { parseVideoCatalog, parseVideoVotingState, rankedVideos } from '../src/utils/video-voting';
const source = new URL('https://advent.example/app/collections/videos.json');
const raw = { id: 'video-01', title: 'Новогоднее видео', videoUrl: 'videos/01.mp4', posterUrl: 'images/01.jpg' };

describe('December 22 video collection', () => {
  it('resolves configurable media paths against the published collection directory', () => {
    expect(parseVideoCatalog([raw], source)).toEqual([{ ...raw, description: '', author: '',
      videoUrl: 'https://advent.example/app/collections/videos/01.mp4', posterUrl: 'https://advent.example/app/collections/images/01.jpg' }]);
    expect(parseVideoCatalog([], source)).toEqual([]);
  });
  it.each([
    null, {}, [raw, raw], [{ ...raw, id: '../bad' }], [{ ...raw, title: '' }],
    [{ ...raw, videoUrl: '' }], [{ ...raw, videoUrl: 'javascript:alert(1)' }],
    [{ ...raw, posterUrl: 'https://user:password@example.com/p.jpg' }], Array(101).fill(raw),
  ])('rejects malformed or unsafe collections: %j', input => {
    expect(() => parseVideoCatalog(input, source)).toThrow();
  });
});

describe('server video voting state', () => {
  const state = { votes: [{ video_id: 'video-01', liked: false }], ranking: [{ video_id: 'video-01', likes: 12 }], total_videos: 1, complete: true };
  it('uses aggregate likes from all users even when the current user disliked the video', () => {
    const parsed = parseVideoVotingState(state);
    expect(parsed).toEqual({ votes: [{ videoId: 'video-01', liked: false }], ranking: [{ videoId: 'video-01', likes: 12 }], totalVideos: 1, complete: true });
    expect(rankedVideos(parseVideoCatalog([raw], source), parsed.ranking)[0]!.likes).toBe(12);
  });
  it.each([
    null, { ...state, complete: 'false' }, { ...state, total_videos: 2 },
    { ...state, votes: [...state.votes, ...state.votes] },
    { ...state, ranking: [{ video_id: 'video-01', likes: -1 }] },
    { ...state, ranking: [{ video_id: 'video-01', likes: 1.5 }] },
    { ...state, votes: [{ video_id: 'missing', liked: true }] },
    { ...state, votes: [{ video_id: 'video-01', liked: 'yes' }] },
  ])('rejects incomplete, inconsistent or malformed server responses: %j', input => {
    expect(() => parseVideoVotingState(input)).toThrow();
  });
  it('sorts by global likes with stable ID ties, excluding zero-vote videos', () => {
    const videos = parseVideoCatalog(['a', 'b', 'c', 'd'].map(id => ({ ...raw, id })), source);
    const ranking = [{ videoId: 'a', likes: 2 }, { videoId: 'b', likes: 5 }, { videoId: 'c', likes: 5 }, { videoId: 'd', likes: 0 }];
    expect(rankedVideos(videos, ranking).map(video => video.id)).toEqual(['b', 'c', 'a']);
  });
});
