import { fortunes } from '../content/fortunes';

export function isFortuneIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < fortunes.length;
}
