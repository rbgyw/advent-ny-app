export const searchDuration = 60_000;
export const searchAttempts = 5;

export interface SearchProgress {
  attemptsLeft: number;
  deadline: number | null;
  found: boolean;
}

export interface SearchPoint { x: number; y: number }
export interface SearchBounds { left: number; top: number; right: number; bottom: number }

export function freshSearch(): SearchProgress {
  return { attemptsLeft: searchAttempts, deadline: null, found: false };
}

export function settleSearch(progress: SearchProgress, now = Date.now()): SearchProgress {
  if (progress.deadline !== null && progress.deadline <= now) {
    return { ...progress, attemptsLeft: Math.max(0, progress.attemptsLeft - 1), deadline: null };
  }
  return progress;
}

export function restoreSearch(value: string | null, now = Date.now()): SearchProgress {
  try {
    const saved: unknown = JSON.parse(value ?? 'null');
    if (typeof saved !== 'object' || saved === null) return freshSearch();
    const { attemptsLeft, deadline, found } = saved as Record<string, unknown>;
    if (typeof attemptsLeft !== 'number' || !Number.isInteger(attemptsLeft) ||
      attemptsLeft < 0 || attemptsLeft > searchAttempts || typeof found !== 'boolean' ||
      (deadline !== null && (typeof deadline !== 'number' || !Number.isFinite(deadline) || deadline > now + searchDuration)) ||
      (deadline !== null && (found || attemptsLeft === 0))) return freshSearch();
    return settleSearch({ attemptsLeft, deadline: deadline as number | null, found }, now);
  } catch {
    return freshSearch();
  }
}

export function startSearch(progress: SearchProgress, now = Date.now()): SearchProgress {
  const current = settleSearch(progress, now);
  if (current.found || current.deadline !== null || current.attemptsLeft === 0) return current;
  return { ...current, deadline: now + searchDuration };
}

export function remainingSearchSeconds(progress: SearchProgress, now = Date.now()): number {
  return progress.deadline === null ? 0 : Math.max(0, Math.ceil((progress.deadline - now) / 1000));
}

// Coordinates are relative to the entire, uncropped scene; padding stays small at every zoom level.
export function isSearchHit(point: SearchPoint, bounds: SearchBounds, width: number, height: number): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || width <= 0 || height <= 0 ||
    point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return false;
  const paddingX = Math.min(12 / width, 0.035);
  const paddingY = Math.min(12 / height, 0.035);
  return point.x >= bounds.left - paddingX && point.x <= bounds.right + paddingX &&
    point.y >= bounds.top - paddingY && point.y <= bounds.bottom + paddingY;
}
