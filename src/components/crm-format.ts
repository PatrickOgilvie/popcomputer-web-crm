const DAY = 24 * 60 * 60 * 1000

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** A deal's value in whole dollars: `$48,000`. */
export function formatMoney(value: number): string {
  return money.format(value)
}

/** A total for a tight space: `$1.2M`, `$48K`. */
export function formatCompactMoney(value: number): string {
  return compactMoney.format(value)
}

/** The viewer's own calendar day, `YYYY-MM-DD`: a due day is theirs, not the server's. */
export function localDay(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function parseDay(day: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (match === null) return undefined
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Whole days from `today` to `day`: negative when it has passed. */
export function daysUntil(day: string, today: string = localDay()): number | undefined {
  const target = parseDay(day)
  const start = parseDay(today)
  if (target === undefined || start === undefined) return undefined
  return Math.round((target.getTime() - start.getTime()) / DAY)
}

/** A calendar day in the viewer's locale: `Oct 17`, with the year when it isn't this one. */
export function formatDay(day: string, today: string = localDay(), locale?: string): string {
  const date = parseDay(day)
  if (date === undefined) return day
  const sameYear = day.slice(0, 4) === today.slice(0, 4)
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date)
}

/** How far off a due day is: `Today`, `Tomorrow`, `In 3 days`, `2 days overdue`. */
export function describeDue(day: string, today: string = localDay()): string {
  const days = daysUntil(day, today)
  if (days === undefined) return day
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days < 0) return `${-days} days overdue`
  if (days < 7) return `In ${days} days`
  return formatDay(day, today)
}

/** Initials for an avatar: `Grace Hopper` is `GH`. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? '?'
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}
