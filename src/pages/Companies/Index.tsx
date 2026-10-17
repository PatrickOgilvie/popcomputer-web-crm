import { Head, Link } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { WebPage } from '@popcomputer/web/react'
import { Building2, Plus, SearchX } from 'lucide-react'

import Avatar from '~/components/Avatar'
import { buttonClassName } from '~/components/button'
import { formatMoney } from '~/components/crm-format'
import EmptyState from '~/components/EmptyState'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import SearchField from '~/components/SearchField'
import { paths } from '~/paths'

const hostOf = (website: string) => {
  try {
    return new URL(website).host.replace(/^www\./, '')
  } catch {
    return website
  }
}

/** The member's companies, with how many people and how much open pipeline each has. */
const CompaniesIndex: WebPage<'Companies/Index'> = ({ companies, q, total }) => (
  <>
    <Head title="Companies" />
    <Layout>
      <PageHeader
        title="Companies"
        meta={
          total > 0 ? (
            <span className="tabular-nums">
              {q === null ? `${total} ${total === 1 ? 'company' : 'companies'}` : `${companies.length} of ${total} match`}
            </span>
          ) : undefined
        }
        actions={
          total > 0 ? (
            <Link href={paths.newCompany} className={buttonClassName()}>
              <Plus aria-hidden="true" />
              New company
            </Link>
          ) : undefined
        }
      />

      {total === 0 ? (
        <EmptyState
          icon={Building2}
          title="Add your first company"
          description="The businesses you sell to. Their people and deals gather on the company’s page."
          action={
            <Link href={paths.newCompany} className={buttonClassName()}>
              Add a company
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <SearchField path={paths.companies} query={q} label="Search companies" placeholder="Search by name or industry…" />

          {companies.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No company matches"
              description={`No company’s name, industry or website has “${q ?? ''}” in it.`}
              action={
                <Link href={paths.companies} className={buttonClassName({ variant: 'secondary' })}>
                  Show all companies
                </Link>
              }
            />
          ) : (
            <ul aria-label="Companies" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <li
                  key={company.id}
                  className="relative flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={company.name} kind="company" />
                    <div className="min-w-0">
                      <Link
                        href={href(paths.company, { company: company.id })}
                        className="block truncate text-sm font-semibold after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-orange-600"
                      >
                        {company.name}
                      </Link>
                      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                        {[company.industry, company.website === null ? null : hostOf(company.website)].filter(Boolean).join(' · ') ||
                          'No industry'}
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                    <div>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">People</dt>
                      <dd className="font-medium tabular-nums">{company.contactCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                        Open pipeline{company.openDealCount > 0 ? ` (${company.openDealCount})` : ''}
                      </dt>
                      <dd className="font-medium tabular-nums">{formatMoney(company.openDealValue)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Layout>
  </>
)

export default CompaniesIndex
