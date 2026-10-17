import { and, asc, count, eq, inArray, or, sql } from 'drizzle-orm'
import { DateTime, Effect } from 'effect'
import {
  action,
  authorize,
  bound,
  dbMutation,
  dbQuery,
  flash,
  redirect,
  render,
  validateRequest,
} from '@popcomputer/web/effect'
import { CompanyForm, Search } from '../forms'
import { paths } from '../paths'
import { activities, companies, contacts, deals } from '../schema'
import { containing } from './contacts'
import { dealSummaries, openStages, timeline } from './shared'

/** The member's companies, with their people and open pipeline, or those the search matches. */
export const listCompanies = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const { q } = yield* validateRequest(Search)
    const own = eq(companies.userId, auth.user.id)
    const pattern = q === null ? null : containing(q)
    const matches = pattern === null
      ? undefined
      : or(
          sql`${companies.name} LIKE ${pattern} ESCAPE '\\'`,
          sql`${companies.industry} LIKE ${pattern} ESCAPE '\\'`,
          sql`${companies.website} LIKE ${pattern} ESCAPE '\\'`
        )

    const { rows, total, people, openDeals } = yield* Effect.all({
      rows: dbQuery((db) =>
        db.select({
          id: companies.id,
          name: companies.name,
          website: companies.website,
          industry: companies.industry,
          updatedAt: companies.updatedAt,
        })
          .from(companies)
          .where(and(own, matches))
          .orderBy(asc(companies.name))
          .limit(500)
      ),
      total: dbQuery((db) => db.$count(companies, own)),
      people: dbQuery((db) =>
        db.select({ companyId: contacts.companyId, count: count() })
          .from(contacts)
          .where(eq(contacts.userId, auth.user.id))
          .groupBy(contacts.companyId)
      ),
      openDeals: dbQuery((db) =>
        db.select({
          companyId: deals.companyId,
          count: count(),
          value: sql<number>`coalesce(sum(${deals.value}), 0)`.mapWith(Number),
        })
          .from(deals)
          .where(and(eq(deals.userId, auth.user.id), inArray(deals.stage, openStages)))
          .groupBy(deals.companyId)
      ),
    }, { concurrency: 'unbounded' })
    const peopleBy = new Map(people.map((row) => [row.companyId, row.count]))
    const openDealsBy = new Map(openDeals.map((row) => [row.companyId, row]))

    return yield* render('Companies/Index', {
      companies: rows.map((row) => ({
        ...row,
        contactCount: peopleBy.get(row.id) ?? 0,
        openDealCount: openDealsBy.get(row.id)?.count ?? 0,
        openDealValue: openDealsBy.get(row.id)?.value ?? 0,
      })),
      q,
      total,
    })
  })
)

export const createCompany = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const input = yield* validateRequest(CompanyForm)
    const [created] = yield* dbMutation((db) =>
      db.insert(companies).values({ ...input, userId: auth.user.id }).returning({ id: companies.id })
    )

    if (created === undefined) return yield* Effect.die(new Error('The company insert returned no row.'))

    yield* flash('success', 'Company added.')

    return yield* redirect(paths.company, { company: created.id })
  })
)

export const showCompany = action(
  Effect.gen(function* () {
    const company = yield* bound('company')
    const [people, companyDeals, timelineRows] = yield* Effect.all([
      dbQuery((db) =>
        db.select({
          id: contacts.id,
          name: contacts.name,
          email: contacts.email,
          phone: contacts.phone,
          title: contacts.title,
        })
          .from(contacts)
          .where(and(eq(contacts.companyId, company.id), eq(contacts.userId, company.userId)))
          .orderBy(asc(contacts.name))
      ),
      dealSummaries(and(eq(deals.companyId, company.id), eq(deals.userId, company.userId))),
      timeline(eq(activities.companyId, company.id)),
    ], { concurrency: 'unbounded' })

    return yield* render('Companies/Show', { company, contacts: people, deals: companyDeals, activities: timelineRows })
  })
)

export const editCompany = action(
  Effect.gen(function* () {
    return yield* render('Companies/Edit', { company: yield* bound('company') })
  })
)

export const updateCompany = action(
  Effect.gen(function* () {
    const company = yield* bound('company')
    const input = yield* validateRequest(CompanyForm)
    const updatedAt = DateTime.toDateUtc(yield* DateTime.now)

    yield* dbMutation((db) =>
      db.update(companies)
        .set({ ...input, updatedAt })
        .where(and(eq(companies.id, company.id), eq(companies.userId, company.userId)))
    )
    yield* flash('success', 'Company saved.')

    return yield* redirect(paths.company, { company: company.id })
  })
)

/** Its people and deals stay, without a company; its own timeline goes with it. */
export const deleteCompany = action(
  Effect.gen(function* () {
    const company = yield* bound('company')

    yield* dbMutation((db) =>
      db.delete(companies).where(and(eq(companies.id, company.id), eq(companies.userId, company.userId)))
    )
    yield* flash('success', `Deleted ${company.name}.`)

    return yield* redirect(paths.companies)
  })
)
