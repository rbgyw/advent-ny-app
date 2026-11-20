export const guidingStarAttempts = 10;

export interface GuidingStarProgress {
  requiredClicks: number;
  checkedStars: string[];
  wishMade: boolean;
}

export function createGuidingStarProgress(identity: string, starCount: number): GuidingStarProgress {
  if (!Number.isInteger(starCount) || starCount < 1) throw new Error('На небе нет звёзд для поиска');
  // Stable per user: clearing or reopening the page does not reroll the search.
  let hash = 2166136261;
  for (const character of identity) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return { requiredClicks: 1 + (hash >>> 0) % starCount, checkedStars: [], wishMade: false };
}

export function guidingStarPhase(progress: GuidingStarProgress): 'searching' | 'found' | 'wished' | 'exhausted' {
  if (progress.wishMade) return 'wished';
  if (progress.checkedStars.length >= progress.requiredClicks) return 'found';
  return progress.checkedStars.length >= guidingStarAttempts ? 'exhausted' : 'searching';
}

export function restoreGuidingStarProgress(raw: string | null, identity: string, starIds: readonly string[]): GuidingStarProgress {
  const fallback = () => createGuidingStarProgress(identity, starIds.length);
  try {
    const data: unknown = JSON.parse(raw ?? 'null');
    if (!data || typeof data !== 'object') return fallback();
    const { requiredClicks, checkedStars, wishMade } = data as Record<string, unknown>;
    if (typeof requiredClicks !== 'number' || !Number.isInteger(requiredClicks) || requiredClicks < 1 ||
      requiredClicks > starIds.length || !Array.isArray(checkedStars) || checkedStars.length > guidingStarAttempts ||
      checkedStars.some(id => typeof id !== 'string' || !starIds.includes(id)) ||
      new Set(checkedStars).size !== checkedStars.length || typeof wishMade !== 'boolean' ||
      (wishMade && checkedStars.length < requiredClicks)) return fallback();
    return { requiredClicks, checkedStars, wishMade };
  } catch { return fallback(); }
}

export function chooseGuidingStar(progress: GuidingStarProgress, starId: string, starIds: readonly string[]): GuidingStarProgress {
  if (guidingStarPhase(progress) !== 'searching' || !starIds.includes(starId) || progress.checkedStars.includes(starId)) return progress;
  return { ...progress, checkedStars: [...progress.checkedStars, starId] };
}

export function makeGuidingStarWish(progress: GuidingStarProgress): GuidingStarProgress {
  return guidingStarPhase(progress) === 'found' ? { ...progress, wishMade: true } : progress;
}
