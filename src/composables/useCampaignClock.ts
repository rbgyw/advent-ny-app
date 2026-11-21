import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { campaignDate } from '../utils/calendar';
import { nextCampaignDayDelay } from '../utils/campaign-clock';
export function useCampaignClock() {
  const now = ref(Date.now());
  const today = computed(() => campaignDate(new Date(now.value)));
  let timer: ReturnType<typeof setTimeout> | undefined;
  function refreshClock() {
    clearTimeout(timer);
    if (document.hidden) return;
    now.value = Date.now();
    timer = setTimeout(refreshClock, nextCampaignDayDelay(now.value));
  }
  onMounted(() => { refreshClock(); document.addEventListener('visibilitychange', refreshClock); });
  onBeforeUnmount(() => { clearTimeout(timer); document.removeEventListener('visibilitychange', refreshClock); });
  return { now, today, refreshClock };
}
