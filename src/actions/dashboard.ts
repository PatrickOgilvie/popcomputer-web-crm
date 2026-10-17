import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { DateTime, Duration, Effect } from 'effect'
import { action, authorize, dbQuery, render } from '@popcomputer/web/effect'
import { activities, companies, contacts, deals } from '../schema'
import { activitiesWithSubjects, dealCards, openStages } from './shared'

/** The pipeline at a glance: what's in each stage, what's closing, and what's due. */
export const showDashboard = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const monthAgo = DateTime.toDateUtc(DateTime.subtractDuration(yield* DateTime.now, Duration.days(30)))
    const ownDeals = eq(deals.userId, auth.user.id)

    const { stages, won, closingSoon, upcomingTasks, recentActivity, contactCount, companyCount } = yield* Effect.all({
      stages: dbQuery((db) =>
        db.select({
          stage: deals.stage,
          count: count(),
          value: sql<number>`coalesce(sum(${deals.value}), 0)`.mapWith(Number),
        })
          .from(deals)
          .where(and(ownDeals, inArray(deals.stage, openStages)))
          .groupBy(deals.stage)
      ),
      won: dbQuery((db) =>
        db.select({ count: count(), value: sql<number>`coalesce(sum(${deals.value}), 0)`.mapWith(Number) })
          .from(deals)
          .where(and(ownDeals, eq(deals.stage, 'won'), gte(deals.closedAt, monthAgo)))
      ),
      closingSoon: dbQuery((db) =>
        dealCards(db)
          .where(and(ownDeals, inArray(deals.stage, openStages), isNotNull(deals.expectedCloseOn)))
          .orderBy(asc(deals.expectedCloseOn))
          .limit(5)
      ),
      upcomingTasks: activitiesWithSubjects(
        and(eq(activities.userId, auth.user.id), eq(activities.kind, 'task'), isNull(activities.completedAt)),
        [sql`${activities.dueOn} IS NULL`, asc(activities.dueOn), asc(activities.createdAt)],
        6
      ),
      recentActivity: activitiesWithSubjects(eq(activities.userId, auth.user.id), [desc(activities.createdAt)], 8),
      contactCount: dbQuery((db) => db.$count(contacts, eq(contacts.userId, auth.user.id))),
      companyCount: dbQuery((db) => db.$count(companies, eq(companies.userId, auth.user.id))),
    }, { concurrency: 'unbounded' })

    return yield* render('Dashboard', {
      // Every open stage, in the board's order, empty ones too.
      stages: openStages.map((stage) => stages.find((row) => row.stage === stage) ?? { stage, count: 0, value: 0 }),
      wonLast30Days: won[0] ?? { count: 0, value: 0 },
      closingSoon,
      upcomingTasks,
      recentActivity,
      contactCount,
      companyCount,
    })
  })
)
