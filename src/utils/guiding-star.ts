export const guidingStarAttempts = 15;
export type GuidingStarResult = 'wished' | 'exhausted';

export interface GuidingStarProgress {
  targetStarId: string;
  checkedStars: string[];
}

export function createGuidingStarProgress(identity: string, starIds: readonly string[]): GuidingStarProgress {
  if (!starIds.length) throw new Error('На небе нет звёзд для поиска');
  // Derive one stable target from the actual star IDs; click order does not change it.
  let hash = 2166136261;
  for (const character of identity) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return { targetStarId: starIds[(hash >>> 0) % starIds.length]!, checkedStars: [] };
}

export function guidingStarPhase(progress: GuidingStarProgress): 'searching' | 'found' | 'exhausted' {
  if (progress.checkedStars.includes(progress.targetStarId)) return 'found';
  return progress.checkedStars.length >= guidingStarAttempts ? 'exhausted' : 'searching';
}

export function serializeGuidingStarProgress(progress: GuidingStarProgress): string {
  return JSON.stringify({ attempts: progress.checkedStars.length, checkedStars: progress.checkedStars });
}

export function restoreGuidingStarProgress(raw: string | null, identity: string, starIds: readonly string[]): GuidingStarProgress {
  const progress = createGuidingStarProgress(identity, starIds);
  try {
    const data: unknown = JSON.parse(raw ?? 'null');
    if (!data || typeof data !== 'object') return progress;
    const { attempts, checkedStars } = data as Record<string, unknown>;
    // Old records have no attempts field. Migrate only the selections, never the local result.
    if (!Array.isArray(checkedStars) || checkedStars.length > guidingStarAttempts ||
      checkedStars.some(id => typeof id !== 'string' || !starIds.includes(id)) ||
      new Set(checkedStars).size !== checkedStars.length ||
      (attempts !== undefined && attempts !== checkedStars.length)) return progress;
    return { ...progress, checkedStars };
  } catch { return progress; }
}

export function chooseGuidingStar(progress: GuidingStarProgress, starId: string, starIds: readonly string[]): GuidingStarProgress {
  if (guidingStarPhase(progress) !== 'searching' || !starIds.includes(starId) || progress.checkedStars.includes(starId)) return progress;
  return { ...progress, checkedStars: [...progress.checkedStars, starId] };
}
