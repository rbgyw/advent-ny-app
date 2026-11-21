import { collectionImage, collectionRecord, collectionText } from './collection';

export interface AdventVideo {
  id: string;
  title: string;
  description: string;
  author: string;
  videoUrl: string;
  posterUrl?: string;
}
export interface VideoVote { videoId: string; liked: boolean }
export interface VideoRank { videoId: string; likes: number }
export interface VideoVotingState {
  votes: VideoVote[];
  ranking: VideoRank[];
  totalVideos: number;
  complete: boolean;
}
export const videoIdPattern = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function parseVideoCatalog(data: unknown, source: URL): AdventVideo[] {
  if (!Array.isArray(data) || data.length > 100) throw new Error('Подборка должна содержать не больше 100 видео.');
  const ids = new Set<string>();
  return data.map(value => {
    const item = collectionRecord(value);
    const id = collectionText(item.id);
    const title = collectionText(item.title);
    const videoUrl = collectionImage(item.videoUrl, source);
    if (!videoIdPattern.test(id) || ids.has(id) || !title || title.length > 200 || !videoUrl) {
      throw new Error('Проверьте ID, название и ссылку на видео в подборке.');
    }
    ids.add(id);
    return { id, title, videoUrl, description: collectionText(item.description), author: collectionText(item.author),
      posterUrl: collectionImage(item.posterUrl, source) };
  });
}

export function parseVideoVotingState(data: unknown): VideoVotingState {
  const item = collectionRecord(data);
  if (!Array.isArray(item.votes) || !Array.isArray(item.ranking) || typeof item.complete !== 'boolean' ||
    !Number.isSafeInteger(item.total_videos) || Number(item.total_videos) < 0) throw new Error('Не удалось прочитать результаты голосования.');
  const ranking: VideoRank[] = item.ranking.map(value => {
    const row = collectionRecord(value);
    if (typeof row.video_id !== 'string' || !videoIdPattern.test(row.video_id) ||
      !Number.isSafeInteger(row.likes) || Number(row.likes) < 0) throw new Error('Некорректный рейтинг видео.');
    return { videoId: row.video_id, likes: Number(row.likes) };
  });
  const votes: VideoVote[] = item.votes.map(value => {
    const row = collectionRecord(value);
    if (typeof row.video_id !== 'string' || typeof row.liked !== 'boolean' || !ranking.some(video => video.videoId === row.video_id)) {
      throw new Error('Некорректный сохранённый голос.');
    }
    return { videoId: row.video_id, liked: row.liked };
  });
  const totalVideos = Number(item.total_videos);
  if (new Set(ranking.map(row => row.videoId)).size !== ranking.length ||
    new Set(votes.map(row => row.videoId)).size !== votes.length || ranking.length !== totalVideos ||
    item.complete !== (totalVideos > 0 && votes.length === totalVideos)) throw new Error('Неполные результаты голосования.');
  return { votes, ranking, totalVideos, complete: item.complete };
}

export function rankedVideos(videos: readonly AdventVideo[], ranking: readonly VideoRank[]) {
  const counts = new Map(ranking.map(row => [row.videoId, row.likes]));
  return videos.filter(video => (counts.get(video.id) ?? 0) > 0)
    .map(video => ({ ...video, likes: counts.get(video.id)! }))
    .sort((left, right) => right.likes - left.likes || left.id.localeCompare(right.id));
}
