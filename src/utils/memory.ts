import { campaignDate } from './calendar'

export function memorySubmissionOpen(availableDate: string | undefined, now = new Date()): boolean {
  if (!availableDate || !/^\d{4}-\d{2}-\d{2}$/.test(availableDate)) return false
  return campaignDate(now) <= `${availableDate.slice(0, 4)}-12-10`
}
