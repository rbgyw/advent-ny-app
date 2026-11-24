import type { CalendarTask } from '../types/models'

export const mandatoryCalendarDays = [3, 7, 11, 14, 17, 19, 21] as const

export function isMandatoryCalendarDay(day: number): boolean {
  return (mandatoryCalendarDays as readonly number[]).includes(day)
}

const campaignFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
})
const shortDateFormatter = new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC', day: 'numeric', month: 'long' })

/** Date-only campaign keys in Moscow, including the hours around UTC midnight. */
export function campaignDate(now = new Date()): string {
  const parts = campaignFormatter.formatToParts(now)
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === name)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function shortCalendarDate(date: string): string {
  return shortDateFormatter.format(new Date(`${date}T00:00:00Z`))
}

export function canOpenAssignment(assignment: CalendarTask | undefined, today: string): boolean {
  return Boolean(assignment?.task?.is_active && assignment.available_date <= today)
}

const windowTitles = ['Стикеры', 'Спортивные человечки', 'Кроссворд', 'Фото-моменты', 'Перевертыши', 'Таро', 'Спорт', 'Благодарности', 'Мурдоку', 'Первое слово', 'Стереоизображение', 'Кино', 'Снегопад', 'Ра[скобки]', 'Деды Морозы', 'Письмо в будущее', 'Повтори фото', 'Рецепты', 'Поджик', 'Путеводная звезда', 'Нонограм', 'Видео', 'Воспоминания', 'Киноподборка', 'Предсказание'];

export function calendarWindowLabel(day: number, assignment: CalendarTask | undefined, today: string): string {
  if (!canOpenAssignment(assignment, today)) return 'Пока не доступно'
  const status = assignment?.status === 'completed' ? 'Выполнено'
    : assignment?.response?.response.submitted_for_review === true ? 'На проверке' : 'Открыть задание'
  return `День ${day}. ${windowTitles[day - 1]}. ${status}`
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

/** Five desktop columns, a taller ground floor and the central entrance. */
export function calendarDesktopWindowBounds(day: number): Record<string, string> {
  if (day === 25) return { left: '668px', top: '631px', width: '101px', height: '139px' }
  const index = day - 1
  const columns = [505, 593, 681, 769, 856]
  const column = day > 20 ? [0, 1, 3, 4][day - 21]! : index % 5
  const row = day > 20 ? 4 : Math.floor(index / 5)
  return { left: `${columns[column]}px`, top: `${[310, 393, 475, 556, 637][row]}px`, width: '74.16px', height: day > 20 ? '85.12px' : '66.2px' }
}
