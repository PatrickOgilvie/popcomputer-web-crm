import { Head, Link } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { WebPage } from '@popcomputer/web/react'
import { ExternalLink, Pencil, Plus } from 'lucide-react'

import Avatar from '~/components/Avatar'
import { buttonClassName } from '~/components/button'
import { formatMoney } from '~/components/crm-format'
import DangerZone from '~/components/DangerZone'
import DealList from '~/components/DealList'
import { cardClassName } from '~/components/DetailList'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import { isClosedStage } from '~/components/stages'
import Timeline from '~/components/Timeline'
import { paths } from '~/paths'

/** A company: its people, its deals, and its timeline. */
const ShowCompany: WebPage<'Companies/Show'> = ({ company, contacts, deals, activities }) => {
  const companyPath = href(paths.company, { company: company.id })
  const open = deals.filter((deal) => !isClosedStage(deal.stage))
  const won = deals.filter((deal) => deal.stage === 'won')

  return (
    <>
      <Head title={company.name} />
      <Layout>
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              <Avatar name={company.name} kind="company" size="lg" />
              <span className="min-w-0">{company.name}</span>
            </span>
          }
          breadcrumbs={[{ label: 'Companies', href: paths.companies }, { label: company.name }]}
          meta={
            <>
              {company.industry !== null ? <span>{company.industry}</span> : null}
              <span className="tabular-nums">{formatMoney(open.reduce((total, deal) => total + deal.value, 0))} open</span>
              {won.length > 0 ? (
                <span className="tabular-nums">{formatMoney(won.reduce((total, deal) => total + deal.value, 0))} won</span>
              ) : null}
            </>
          }
          actions={
            <>
              {company.website !== null ? (
                <a href={company.website} target="_blank" rel="noreferrer" className={buttonClassName({ variant: 'secondary' })}>
                  <ExternalLink aria-hidden="true" />
                  Website
                </a>
              ) : null}
              <Link href={href(paths.editCompany, { company: company.id })} className={buttonClassName({ variant: 'secondary' })}>
                <Pencil aria-hidden="true" />
                Edit
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
            <Timeline activities={activities} logPath={href(paths.companyActivities, { company: company.id })} />
          </div>

          <div className="flex flex-col gap-6">
            <section aria-labelledby="people-title" className={cardClassName}>
              <div className="flex items-center justify-between gap-4">
                <h2 id="people-title" className="text-sm font-semibold">
                  People
                </h2>
                <Link
                  href={href(paths.newContact, {}, { companyId: company.id })}
                  className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-zinc-600 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-orange-600 dark:text-zinc-400 dark:hover:text-white"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add person
                </Link>
              </div>
              {contacts.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Nobody here yet.</p>
              ) : (
                <ul className="-mx-2 mt-3 flex flex-col">
                  {contacts.map((contact) => (
                    <li key={contact.id} className="relative flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <Avatar name={contact.name} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={href(paths.contact, { contact: contact.id })}
                          className="block truncate text-sm font-medium after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-orange-600"
                        >
                          {contact.name}
                        </Link>
                        {contact.title !== null ? (
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{contact.title}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <DealList deals={deals} newDealHref={href(paths.newDeal, {}, { companyId: company.id })} />

            {company.notes !== null ? (
              <section aria-labelledby="company-notes" className={cardClassName}>
                <h2 id="company-notes" className="text-sm font-semibold">
                  Notes
                </h2>
                <p className="mt-2 text-sm whitespace-pre-line text-pretty text-zinc-700 dark:text-zinc-300">{company.notes}</p>
              </section>
            ) : null}

            <DangerZone
              label="Delete company"
              name={company.name}
              description="The company and its timeline are removed. Its people and deals stay, without a company. This can’t be undone."
              path={companyPath}
            />
          </div>
        </div>
      </Layout>
    </>
  )
}

export default ShowCompany
