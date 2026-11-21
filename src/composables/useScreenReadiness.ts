import { inject, ref, type Ref, type InjectionKey } from 'vue';

export interface ScreenReadiness {
  ready: Readonly<Ref<boolean>>;
  track: <T>(work: Promise<T>) => Promise<T>;
}

export const screenReadinessKey: InjectionKey<ScreenReadiness> = Symbol('screen-readiness');

// Only initial work belongs to the screen transition. Saving and background
// refreshes keep the already displayed screen and its local input in place.
export function useScreenReadiness(): ScreenReadiness {
  return inject(screenReadinessKey, { ready: ref(true), track: work => work });
}
