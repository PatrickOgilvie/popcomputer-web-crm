import { Head, Link, usePage } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { PagePropsFor, WebPage } from '@popcomputer/web/react'
import { ArrowRight, CalendarClock, CheckCheck, KanbanSquare, Plus } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { buttonClassName } from '~/components/button'
import { cn } from '~/components/cn'
import { daysUntil, describeDue, formatCompactMoney, formatMoney } from '~/components/crm-format'
import EmptyState from '~/components/EmptyState'
import { formatRelativeTime } from '~/components/format'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import { stageStyles } from '~/components/stages'
import SubjectLink from '~/components/SubjectLink'
import { DueLabel, kindStyles, TaskCheckbox } from '~/components/Timeline'
import UnderTheHood, { Guarantee } from '~/components/UnderTheHood'
import { paths } from '~/paths'

type Props = PagePropsFor<'Dashboard'>

const cardClassName = 'rounded-lg border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900'

function Card({
  title,
  link,
  children,
  className,
}: {
  readonly title: string
  readonly link?: { readonly href: string; readonly label: string }
  readonly children: ReactNode
  readonly className?: string
}) {
  const id = `card-${title.toLowerCase().replace(/\W+/g, '-')}`
  return (
    <section aria-labelledby={id} className={cn(cardClassName, 'flex flex-col', className)}>
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
        <h2 id={id} className="text-sm font-semibold">
          {title}
        </h2>
        {link ? (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-zinc-600 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-orange-600 dark:text-zinc-400 dark:hover:text-white"
          >
            {link.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function StatTile({ label, value, detail }: { readonly label: string; readonly value: string; readonly detail: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
      <dd className="text-sm text-zinc-500 dark:text-zinc-400">{detail}</dd>
    </div>
  )
}

/**
 * Open pipeline by stage, as bars from one baseline in one hue: the stage's
 * dot beside its name carries which stage it is, the text carries the numbers.
 */
function StageBars({ stages }: { readonly stages: Props['stages'] }) {
  const largest = Math.max(...stages.map((stage) => stage.value), 1)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <ul className="flex flex-col gap-3 p-5">
      {stages.map((row) => {
        const style = stageStyles[row.stage]
        const weighted = Math.round(row.value * style.probability)
        const width = row.value === 0 ? 0 : Math.max((row.value / largest) * 100, 1.5)
        const showsTip = hovered === row.stage
        return (
          <li
            key={row.stage}
            className="relative grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3"
            onPointerEnter={() => setHovered(row.stage)}
            onPointerLeave={() => setHovered(null)}
          >
            <span className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span className={cn('size-2 shrink-0 rounded-full', style.dot)} aria-hidden="true" />
              {style.label}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-5 min-w-0 flex-1" aria-hidden="true">
                <div
                  className={cn(
                    'h-full rounded-r bg-orange-500 transition-opacity dark:bg-orange-400',
                    hovered !== null && !showsTip && 'opacity-40'
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
                <span className="font-medium text-zinc-950 dark:text-white">{formatCompactMoney(row.value)}</span>
                <span className="text-zinc-500"> · {row.count}</span>
                <span className="sr-only">
                  {' '}
                  {row.count === 1 ? 'deal' : 'deals'}, {formatMoney(weighted)} weighted
                </span>
              </span>
            </div>
            {showsTip ? (
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-[6.5rem] z-10 mb-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
              >
                <p className="font-semibold">{style.label}</p>
                <p className="mt-1 text-zinc-600 tabular-nums dark:text-zinc-300">
                  {row.count} {row.count === 1 ? 'deal' : 'deals'} · {formatMoney(row.value)}
                </p>
                <p className="text-zinc-500 tabular-nums dark:text-zinc-400">
                  {formatMoney(weighted)} weighted at {Math.round(style.probability * 100)}%
                </p>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/** The pipeline at a glance: what's open, what's closing, and what's due. */
const Dashboard: WebPage<'Dashboard'> = ({
  stages,
  wonLast30Days,
  closingSoon,
  upcomingTasks,
  recentActivity,
  contactCount,
  companyCount,
}) => {
  const { auth } = usePage().props
  const firstName = auth.user?.name.trim().split(/\s+/)[0] || 'there'
  const openValue = stages.reduce((total, stage) => total + stage.value, 0)
  const openCount = stages.reduce((total, stage) => total + stage.count, 0)
  const weighted = stages.reduce((total, stage) => total + stage.value * stageStyles[stage.stage].probability, 0)
  const isEmpty = openCount === 0 && wonLast30Days.count === 0 && contactCount === 0 && companyCount === 0

  return (
    <>
      <Head title="Dashboard" />
      <Layout>
        <PageHeader
          title={`Good to see you, ${firstName}`}
          description={isEmpty ? 'Your CRM is ready. Start with a deal, a contact or a company.' : undefined}
          actions={
            <Link href={paths.newDeal} className={buttonClassName()}>
              <Plus aria-hidden="true" />
              New deal
            </Link>
          }
        />

        {isEmpty ? (
          <EmptyState
            icon={KanbanSquare}
            title="Nothing in the pipeline yet"
            description="Add your first deal, and it shows up on the board and here."
            action={
              <Link href={paths.newDeal} className={buttonClassName()}>
                Add a deal
              </Link>
            }
          />
        ) : (
          <>
            <section aria-label="Pipeline summary" className={cn(cardClassName, 'grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]')}>
              <div className="flex flex-col justify-center gap-1">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Open pipeline</p>
                <p className="text-5xl font-semibold tracking-tight">{formatMoney(openValue)}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {openCount} open {openCount === 1 ? 'deal' : 'deals'}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-6 border-t border-zinc-200 pt-6 sm:grid-cols-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 dark:border-zinc-800">
                <StatTile
                  label="Weighted forecast"
                  value={formatCompactMoney(Math.round(weighted))}
                  detail="By each stage’s odds"
                />
                <StatTile
                  label="Won, last 30 days"
                  value={formatCompactMoney(wonLast30Days.value)}
                  detail={`${wonLast30Days.count} ${wonLast30Days.count === 1 ? 'deal' : 'deals'}`}
                />
                <StatTile
                  label="Relationships"
                  value={String(contactCount)}
                  detail={`${contactCount === 1 ? 'person' : 'people'} at ${companyCount} ${companyCount === 1 ? 'company' : 'companies'}`}
                />
              </dl>
            </section>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
              <Card title="Pipeline by stage" link={{ href: paths.pipeline, label: 'Open board' }}>
                <StageBars stages={stages} />
              </Card>

              <Card title="Closing soon" link={{ href: paths.pipeline, label: 'All deals' }}>
                {closingSoon.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                    No open deal has a close date yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {closingSoon.map((deal) => {
                      const days = deal.expectedCloseOn === null ? undefined : daysUntil(deal.expectedCloseOn)
                      return (
                        <li key={deal.id} className="relative flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <span className={cn('size-2 shrink-0 rounded-full', stageStyles[deal.stage].dot)} aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={href(paths.deal, { deal: deal.id })}
                              className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-orange-600"
                            >
                              {deal.title}
                            </Link>
                            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {stageStyles[deal.stage].label}
                              {deal.companyName !== null ? ` · ${deal.companyName}` : ''}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-medium tabular-nums">{formatMoney(deal.value)}</p>
                            {deal.expectedCloseOn !== null ? (
                              <p
                                className={cn(
                                  'inline-flex items-center gap-1 text-xs tabular-nums',
                                  days !== undefined && days < 0 ? 'font-medium text-red-700 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'
                                )}
                              >
                                <CalendarClock className="size-3" aria-hidden="true" />
                                {describeDue(deal.expectedCloseOn)}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>

              <Card title="Up next" link={{ href: paths.tasks, label: 'All tasks' }}>
                {upcomingTasks.length === 0 ? (
                  <p className="flex items-center gap-2 px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                    <CheckCheck className="size-4" aria-hidden="true" />
                    No open tasks. Nice.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {upcomingTasks.map((task) => (
                      <li key={task.id} className="flex items-start gap-3 px-5 py-3">
                        <TaskCheckbox task={task} label={task.body} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-pretty">{task.body}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {task.dueOn !== null ? <DueLabel dueOn={task.dueOn} done={false} /> : null}
                            {task.subject !== null ? <SubjectLink subject={task.subject} /> : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Recent activity">
                {recentActivity.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                    Notes, calls and meetings you log show up here.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {recentActivity.map((activity) => {
                      const style = kindStyles[activity.kind]
                      return (
                        <li key={activity.id} className="flex items-start gap-3 px-5 py-3">
                          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', style.tone)}>
                            <style.icon className="size-3.5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm text-pretty">{activity.body}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                              <span>
                                {style.label} · {formatRelativeTime(activity.createdAt)}
                              </span>
                              {activity.subject !== null ? <SubjectLink subject={activity.subject} /> : null}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}

        <UnderTheHood route="GET /" action="showDashboard">
          <Guarantee>One Effect runs the dashboard’s seven D1 reads concurrently.</Guarantee>
          <Guarantee>Every read is scoped to the signed-in member.</Guarantee>
          <Guarantee>Due days are compared in your own time zone, in the browser: a day has none of its own.</Guarantee>
        </UnderTheHood>
      </Layout>
    </>
  )
}

export default Dashboard
