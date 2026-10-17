import { and, asc, desc, eq, gte, inArray, ne, or, sql } from 'drizzle-orm'
import { DateTime, Duration, Effect } from 'effect'
import {
  action,
  authorize,
  back,
  bound,
  dbBatch,
  dbMutation,
  dbQuery,
  flash,
  redirect,
  render,
  validateRequest,
} from '@popcomputer/web/effect'
import { DealForm, DealMove, DealPrefill, type DealStage } from '../forms'
import { paths } from '../paths'
import { activities, companies, contacts, deals } from '../schema'
import { dealCards, isClosed, openStages, ownerFieldErrors, timeline } from './shared'

type Stage = typeof DealStage.Type

/** Won and lost deals stay on the board this long after they close. */
const closedDealsShowFor = Duration.days(30)

/** The top of a stage's column, for a deal that arrives there by a form. */
const topOf = (userId: string, stage: Stage) =>
  sql<number>`(SELECT coalesce(min(${deals.position}), 0) - 1 FROM ${deals} WHERE ${deals.userId} = ${userId} AND ${deals.stage} = ${stage})`

/** The member's companies and contacts, for the deal form's pickers. */
const dealFormOptions = (userId: string) =>
  Effect.all({
    companies: dbQuery((db) =>
      db.select({ id: companies.id, name: companies.name })
        .from(companies)
        .where(eq(companies.userId, userId))
        .orderBy(asc(companies.name))
    ),
    contacts: dbQuery((db) =>
      db.select({ id: contacts.id, name: contacts.name, companyId: contacts.companyId })
        .from(contacts)
        .where(eq(contacts.userId, userId))
        .orderBy(asc(contacts.name))
    ),
  }, { concurrency: 'unbounded' })

/** The deal with the names of who it's with, for its page and its form. */
const dealWithLinks = (deal: typeof deals.$inferSelect) =>
  Effect.gen(function* () {
    const [company, contact] = yield* Effect.all([
      deal.companyId === null
        ? Effect.succeed([])
        : dbQuery((db) =>
            db.select({ id: companies.id, name: companies.name })
              .from(companies)
              .where(and(eq(companies.id, deal.companyId ?? ''), eq(companies.userId, deal.userId)))
          ),
      deal.contactId === null
        ? Effect.succeed([])
        : dbQuery((db) =>
            db.select({ id: contacts.id, name: contacts.name })
              .from(contacts)
              .where(and(eq(contacts.id, deal.contactId ?? ''), eq(contacts.userId, deal.userId)))
          ),
    ], { concurrency: 'unbounded' })

    return { ...deal, company: company[0] ?? null, contact: contact[0] ?? null }
  })

/**
 * The pipeline: every open deal, and those won or lost in the last 30 days,
 * in their stage's order.
 */
export const showBoard = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const since = DateTime.toDateUtc(DateTime.subtractDuration(yield* DateTime.now, closedDealsShowFor))
    const rows = yield* dbQuery((db) =>
      dealCards(db)
        .where(and(
          eq(deals.userId, auth.user.id),
          or(inArray(deals.stage, openStages), gte(deals.closedAt, since))
        ))
        .orderBy(asc(deals.position), desc(deals.updatedAt))
    )

    return yield* render('Deals/Board', { deals: rows })
  })
)

export const newDeal = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const prefill = yield* validateRequest(DealPrefill)
    const options = yield* dealFormOptions(auth.user.id)

    return yield* render('Deals/Create', {
      ...options,
      prefill: { stage: prefill.stage ?? 'lead', companyId: prefill.companyId, contactId: prefill.contactId },
    })
  })
)

export const createDeal = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const input = yield* validateRequest(DealForm)
    const now = DateTime.toDateUtc(yield* DateTime.now)
    const [created] = yield* dbMutation((db) =>
      db.insert(deals)
        .values({
          ...input,
          userId: auth.user.id,
          position: topOf(auth.user.id, input.stage),
          closedAt: isClosed(input.stage) ? now : null,
        })
        .returning({ id: deals.id })
    ).pipe(ownerFieldErrors)

    if (created === undefined) return yield* Effect.die(new Error('The deal insert returned no row.'))

    yield* flash('success', 'Deal created.')

    return yield* redirect(paths.deal, { deal: created.id })
  })
)

// `{deal}` loads only the signed-in member's own deal (its binding in
// src/app.ts is ownedBy 'userId'): another member's is not found.
export const showDeal = action(
  Effect.gen(function* () {
    const deal = yield* bound('deal')
    const [withLinks, timelineRows] = yield* Effect.all([
      dealWithLinks(deal),
      timeline(eq(activities.dealId, deal.id)),
    ], { concurrency: 'unbounded' })

    return yield* render('Deals/Show', { deal: withLinks, activities: timelineRows })
  })
)

export const editDeal = action(
  Effect.gen(function* () {
    const deal = yield* bound('deal')
    const [withLinks, options] = yield* Effect.all([dealWithLinks(deal), dealFormOptions(deal.userId)], {
      concurrency: 'unbounded',
    })

    return yield* render('Deals/Edit', { deal: withLinks, ...options })
  })
)

/** When a deal is won or lost: kept while it stays closed, cleared when it opens again. */
const closedAtFor = (deal: typeof deals.$inferSelect, stage: Stage, now: Date): Date | null =>
  isClosed(stage) ? (isClosed(deal.stage) && deal.closedAt !== null ? deal.closedAt : now) : null

export const updateDeal = action(
  Effect.gen(function* () {
    const deal = yield* bound('deal')
    const input = yield* validateRequest(DealForm)
    const now = DateTime.toDateUtc(yield* DateTime.now)

    yield* dbMutation((db) =>
      db.update(deals)
        .set({
          ...input,
          // A deal moved to another stage by its form goes to the top of that column.
          position: input.stage === deal.stage ? deal.position : topOf(deal.userId, input.stage),
          closedAt: closedAtFor(deal, input.stage, now),
          updatedAt: now,
        })
        .where(and(eq(deals.id, deal.id), eq(deals.userId, deal.userId)))
    ).pipe(ownerFieldErrors)
    yield* flash('success', 'Deal saved.')

    return yield* redirect(paths.deal, { deal: deal.id })
  })
)

/**
 * Moves a deal to a stage, before the card it was dropped on, or to the
 * bottom of the column. The column is numbered again in one batch, so its
 * order holds whatever order the moves arrive in.
 */
export const moveDeal = action(
  Effect.gen(function* () {
    const deal = yield* bound('deal')
    const { stage, beforeId } = yield* validateRequest(DealMove)
    const now = DateTime.toDateUtc(yield* DateTime.now)
    const column = yield* dbQuery((db) =>
      db.select({ id: deals.id })
        .from(deals)
        .where(and(eq(deals.userId, deal.userId), eq(deals.stage, stage), ne(deals.id, deal.id)))
        .orderBy(asc(deals.position), desc(deals.updatedAt))
    )
    const ids = column.map((row) => row.id)
    const at = beforeId === null ? -1 : ids.indexOf(beforeId)
    const order = at === -1 ? [...ids, deal.id] : [...ids.slice(0, at), deal.id, ...ids.slice(at)]

    yield* dbBatch((db) =>
      order.map((id, position) =>
        id === deal.id
          ? db.update(deals)
              .set({ stage, position, closedAt: closedAtFor(deal, stage, now), updatedAt: now })
              .where(and(eq(deals.id, deal.id), eq(deals.userId, deal.userId)))
          : db.update(deals).set({ position }).where(and(eq(deals.id, id), eq(deals.userId, deal.userId)))
      )
    )

    return yield* back(paths.pipeline)
  })
)

export const deleteDeal = action(
  Effect.gen(function* () {
    const deal = yield* bound('deal')

    yield* dbMutation((db) => db.delete(deals).where(and(eq(deals.id, deal.id), eq(deals.userId, deal.userId))))
    yield* flash('success', `Deleted ${deal.title}.`)

    return yield* redirect(paths.pipeline)
  })
)
