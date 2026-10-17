import { Link } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { PagePropsFor } from '@popcomputer/web/react'
import { Plus } from 'lucide-react'

import { formatMoney } from '~/components/crm-format'
import { cardClassName } from '~/components/DetailList'
import StageBadge from '~/components/StageBadge'
import { paths } from '~/paths'

type Deal = PagePropsFor<'Contacts/Show'>['deals'][number]

/** The deals on a contact's or a company's page, with a link to add one. */
export default function DealList({
  deals,
  newDealHref,
}: {
  readonly deals: ReadonlyArray<Deal>
  readonly newDealHref: string
}) {
  return (
    <section aria-labelledby="deals-title" className={cardClassName}>
      <div className="flex items-center justify-between gap-4">
        <h2 id="deals-title" className="text-sm font-semibold">
          Deals
        </h2>
        <Link
          href={newDealHref}
          className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-zinc-600 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-orange-600 dark:text-zinc-400 dark:hover:text-white"
        >
          <Plus className="size-4" aria-hidden="true" />
          New deal
        </Link>
      </div>
      {deals.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No deals yet.</p>
      ) : (
        <ul className="-mx-2 mt-3 flex flex-col">
          {deals.map((deal) => (
            <li key={deal.id} className="relative flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <div className="min-w-0 flex-1">
                <Link
                  href={href(paths.deal, { deal: deal.id })}
                  className="block truncate text-sm font-medium after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-orange-600"
                >
                  {deal.title}
                </Link>
                <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{formatMoney(deal.value)}</span>
              </div>
              <StageBadge stage={deal.stage} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
