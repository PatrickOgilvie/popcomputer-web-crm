import { Head, Link } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { WebPage } from '@popcomputer/web/react'
import { Pencil } from 'lucide-react'

import { buttonClassName } from '~/components/button'
import { describeDue, formatDay, formatMoney } from '~/components/crm-format'
import DangerZone from '~/components/DangerZone'
import DetailList, { cardClassName, inlineLinkClassName, Missing } from '~/components/DetailList'
import { formatDate, formatRelativeTime } from '~/components/format'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import StageBadge from '~/components/StageBadge'
import StagePath from '~/components/StagePath'
import Timeline from '~/components/Timeline'
import UnderTheHood, { Guarantee } from '~/components/UnderTheHood'
import { paths } from '~/paths'

/** A deal: where it stands, who it's with, and everything logged on it. */
const ShowDeal: WebPage<'Deals/Show'> = ({ deal, activities }) => {
  const dealPath = href(paths.deal, { deal: deal.id })

  return (
    <>
      <Head title={deal.title} />
      <Layout>
        <PageHeader
          title={deal.title}
          breadcrumbs={[{ label: 'Pipeline', href: paths.pipeline }, { label: deal.title }]}
          meta={
            <>
              <StageBadge stage={deal.stage} />
              <span className="font-semibold text-zinc-950 tabular-nums dark:text-white">{formatMoney(deal.value)}</span>
              {deal.company !== null ? (
                <Link href={href(paths.company, { company: deal.company.id })} className={inlineLinkClassName}>
                  {deal.company.name}
                </Link>
              ) : null}
              <span>Updated {formatRelativeTime(deal.updatedAt)}</span>
            </>
          }
          actions={
            <Link href={href(paths.editDeal, { deal: deal.id })} className={buttonClassName({ variant: 'secondary' })}>
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          }
        />

        <StagePath dealId={deal.id} stage={deal.stage} />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
            <Timeline activities={activities} logPath={href(paths.dealActivities, { deal: deal.id })} />
          </div>

          <div className="flex flex-col gap-6">
            <DetailList
              title="Details"
              rows={[
                ['Value', <span className="tabular-nums">{formatMoney(deal.value)}</span>],
                ['Stage', <StageBadge stage={deal.stage} />],
                [
                  'Expected to close',
                  deal.expectedCloseOn === null ? (
                    <Missing>Not set</Missing>
                  ) : (
                    <span className="tabular-nums">
                      {formatDay(deal.expectedCloseOn)}
                      {deal.closedAt === null ? (
                        <span className="text-zinc-500 dark:text-zinc-400"> · {describeDue(deal.expectedCloseOn)}</span>
                      ) : null}
                    </span>
                  ),
                ],
                [
                  'Company',
                  deal.company === null ? (
                    <Missing />
                  ) : (
                    <Link href={href(paths.company, { company: deal.company.id })} className={inlineLinkClassName}>
                      {deal.company.name}
                    </Link>
                  ),
                ],
                [
                  'Contact',
                  deal.contact === null ? (
                    <Missing />
                  ) : (
                    <Link href={href(paths.contact, { contact: deal.contact.id })} className={inlineLinkClassName}>
                      {deal.contact.name}
                    </Link>
                  ),
                ],
                ...(deal.closedAt === null
                  ? []
                  : [[deal.stage === 'won' ? 'Won' : 'Lost', <span className="tabular-nums">{formatDate(deal.closedAt)}</span>] as const]),
                ['Created', <span className="tabular-nums">{formatDate(deal.createdAt)}</span>],
              ]}
            />

            {deal.notes !== null ? (
              <section aria-labelledby="deal-notes" className={cardClassName}>
                <h2 id="deal-notes" className="text-sm font-semibold">
                  Notes
                </h2>
                <p className="mt-2 text-sm whitespace-pre-line text-pretty text-zinc-700 dark:text-zinc-300">{deal.notes}</p>
              </section>
            ) : null}

            <DangerZone
              label="Delete deal"
              name={deal.title}
              description="The deal and its timeline are removed. Its company and contact stay. This can’t be undone."
              path={dealPath}
            />
          </div>
        </div>

        <UnderTheHood route="GET /deals/{deal}" action="showDeal">
          <Guarantee>
            The route binds the deal, <code>bound('deal')</code>, <code>ownedBy: 'userId'</code>: another member’s is the
            404 a missing one is.
          </Guarantee>
          <Guarantee>
            A note logged here takes its deal and owner from the bound record, never from the form.
          </Guarantee>
          <Guarantee>The page’s reads run concurrently in one Effect.</Guarantee>
        </UnderTheHood>
      </Layout>
    </>
  )
}

export default ShowDeal
