/** Moscow has a fixed UTC+3 offset; deadlines are based on calendar dates. */
export function nextCampaignDayDelay(now: number): number {
  const day = 86_400_000, offset = 10_800_000;
  return day - ((now + offset) % day + day) % day;
}
