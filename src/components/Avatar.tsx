import { Building2 } from 'lucide-react'

import { cn } from '~/components/cn'
import { initials } from '~/components/crm-format'

const tones = [
  'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
] as const

/** The same name always gets the same colour. */
function toneFor(name: string): string {
  let hash = 0
  for (const character of name) hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0
  return tones[hash % tones.length] ?? tones[0]
}

const sizes = {
  sm: 'size-7 text-[0.6875rem]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-base',
} as const

/** A person's initials, or a company's mark, in a colour of their own. */
export default function Avatar({
  name,
  kind = 'person',
  size = 'md',
}: {
  readonly name: string
  readonly kind?: 'person' | 'company'
  readonly size?: keyof typeof sizes
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center font-semibold',
        kind === 'company' ? 'rounded-md' : 'rounded-full',
        sizes[size],
        toneFor(name)
      )}
      aria-hidden="true"
    >
      {kind === 'company' ? <Building2 className="size-[45%]" /> : initials(name)}
    </span>
  )
}
