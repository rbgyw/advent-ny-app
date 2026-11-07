import type { CalendarTask } from '../types/models'

/** Date-only campaign keys in Moscow, including the hours around UTC midnight. */
export function campaignDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === name)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function shortCalendarDate(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC', day: 'numeric', month: 'long' }).format(new Date(`${date}T00:00:00Z`))
}

export function canOpenAssignment(assignment: CalendarTask | undefined, today: string): boolean {
  return Boolean(assignment?.task?.is_active && assignment.available_date <= today)
}

export function calendarWindowLabel(day: number, assignment: CalendarTask | undefined, today: string): string {
  if (!assignment) return `День ${day}. Задание пока не назначено`
  const title = assignment.task?.title ? `. ${assignment.task.title}` : ''
  if (assignment.status === 'completed') return `День ${day}${title}. Выполнено`
  if (!canOpenAssignment(assignment, today)) return `День ${day}. Откроется ${shortCalendarDate(assignment.available_date)}`
  return `День ${day}${title}. ${assignment.available_date === today ? 'Сегодня' : 'Открыть задание'}`
}

/** Four facade columns, two lower side columns and a central door for day 25. */
export function calendarWindowBounds(day: number): Record<string, string> {
  if (day === 25) return { left: '145.4345px', top: '660.0074px', width: '101.3513px', height: '134.5908px' }
  const index = day - 1
  const column = day > 20 ? (day % 2 === 1 ? 0 : 3) : index % 4
  const row = day > 20 ? 5 + Math.floor((day - 21) / 2) : Math.floor(index / 4)
  const columns = [35.5811, 113.5811, 190.5811, 268.5811]
  const rows = [98.8037, 168.8037, 240.8037, 310.8037, 382.8037, 452.8037, 522.8037]
  return { left: `${9 + columns[column]!}px`, top: `${208 + rows[row]!}px`, width: '70.1663px', height: '62.6275px' }
}
