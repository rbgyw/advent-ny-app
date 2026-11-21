import { supabase } from '../lib/supabase';
import { parseVideoCatalog, parseVideoVotingState, videoIdPattern } from '../utils/video-voting';

export const videoVotingService = {
  async loadCatalog(signal?: AbortSignal) {
    const root = new URL(import.meta.env.BASE_URL, window.location.origin);
    const source = new URL('collections/videos.json', root);
    const response = await fetch(source, { signal, cache: 'no-cache' });
    if (!response.ok) throw new Error('Не удалось загрузить подборку видео.');
    return parseVideoCatalog(await response.json(), source);
  },
  async loadState(taskId: number) {
    const { data, error } = await supabase.rpc('get_advent_video_state', { p_task_id: taskId });
    if (error) throw error;
    return parseVideoVotingState(data);
  },
  async vote(taskId: number, videoId: string, liked: boolean) {
    if (!videoIdPattern.test(videoId) || typeof liked !== 'boolean') throw new Error('Некорректная оценка видео.');
    const { data, error } = await supabase.rpc('vote_advent_video', { p_task_id: taskId, p_video_id: videoId, p_liked: liked });
    if (error) throw error;
    const state = parseVideoVotingState(data);
    if (!state.votes.some(vote => vote.videoId === videoId)) throw new Error('Сервер не подтвердил оценку видео.');
    return state;
  },
};
