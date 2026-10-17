import type { ReactNode } from 'react'

export const cardClassName =
  'rounded-lg border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900'

/** A card of label and value rows, such as a record's details. */
export default function DetailList({
  title,
  rows,
}: {
  readonly title: string
  readonly rows: ReadonlyArray<readonly [label: string, value: ReactNode]>
}) {
  return (
    <section aria-label={title} className={cardClassName}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <dl className="mt-4 flex flex-col gap-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd className="min-w-0 text-right break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** The value a row shows when there's nothing there. */
export function Missing({ children = 'None' }: { readonly children?: ReactNode }) {
  return <span className="text-zinc-400 dark:text-zinc-500">{children}</span>
}

export const inlineLinkClassName =
  'rounded-sm font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-950 focus-visible:outline-2 focus-visible:outline-orange-600 dark:text-white dark:decoration-zinc-600 dark:hover:decoration-white'
