import { and, asc, desc, eq, type SQL } from 'drizzle-orm'
import { Effect } from 'effect'
import { constraintFieldErrors, dbQuery, type DatabaseType } from '@popcomputer/web/effect'
import type { DealStage } from '../forms'
import { activities, companies, contacts, deals } from '../schema'

type Stage = typeof DealStage.Type

/** The stages a deal is still open in, in the board's order. */
export const openStages = ['lead', 'qualified', 'proposal', 'negotiation'] as const satisfies ReadonlyArray<Stage>

export const isClosed = (stage: Stage): boolean => stage === 'won' || stage === 'lost'

/**
 * A form names a contact's company, or a deal's company and contact, by id.
 * The triggers in migrations/0001_owner_rules.sql refuse another member's,
 * and this shows the refusal beside the field, as a missing one would be.
 */
export const ownerFieldErrors = constraintFieldErrors({
  contacts_company_owner: { companyId: 'Choose one of your companies.' },
  deals_company_owner: { companyId: 'Choose one of your companies.' },
  deals_contact_owner: { contactId: 'Choose one of your contacts.' },
})

/** A card on the board, or on the dashboard: the deal and who it's with. */
export const dealCards = (db: DatabaseType) =>
  db.select({
    id: deals.id,
    title: deals.title,
    value: deals.value,
    stage: deals.stage,
    position: deals.position,
    expectedCloseOn: deals.expectedCloseOn,
    updatedAt: deals.updatedAt,
    companyName: companies.name,
    contactName: contacts.name,
  })
    .from(deals)
    .leftJoin(companies, and(eq(companies.id, deals.companyId), eq(companies.userId, deals.userId)))
    .leftJoin(contacts, and(eq(contacts.id, deals.contactId), eq(contacts.userId, deals.userId)))

/** The deals on a contact's or a company's page, open ones first. */
export const dealSummaries = (where: SQL | undefined) =>
  dbQuery((db) =>
    db.select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stage: deals.stage,
      expectedCloseOn: deals.expectedCloseOn,
      updatedAt: deals.updatedAt,
    })
      .from(deals)
      .where(where)
      .orderBy(asc(deals.closedAt), desc(deals.updatedAt))
  )

const activityColumns = {
  id: activities.id,
  kind: activities.kind,
  body: activities.body,
  dueOn: activities.dueOn,
  completedAt: activities.completedAt,
  createdAt: activities.createdAt,
}

/** A record's timeline, newest first. */
export const timeline = (where: SQL | undefined) =>
  dbQuery((db) =>
    db.select(activityColumns).from(activities).where(where).orderBy(desc(activities.createdAt)).limit(100)
  )

/**
 * Activities with the deal, contact or company each was logged on, for the
 * lists that mix them: the tasks page and the dashboard.
 */
export const activitiesWithSubjects = (
  where: SQL | undefined,
  orderBy: ReadonlyArray<SQL>,
  limit: number
) =>
  dbQuery((db) =>
    db.select({
      ...activityColumns,
      dealId: deals.id,
      dealTitle: deals.title,
      contactId: contacts.id,
      contactName: contacts.name,
      companyId: companies.id,
      companyName: companies.name,
    })
      .from(activities)
      .leftJoin(deals, eq(deals.id, activities.dealId))
      .leftJoin(contacts, eq(contacts.id, activities.contactId))
      .leftJoin(companies, eq(companies.id, activities.companyId))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
  ).pipe(
    Effect.map((rows) =>
      rows.map(({ dealId, dealTitle, contactId, contactName, companyId, companyName, ...activity }) => ({
        ...activity,
        subject:
          dealId !== null && dealTitle !== null
            ? { type: 'deal' as const, id: dealId, name: dealTitle }
            : contactId !== null && contactName !== null
              ? { type: 'contact' as const, id: contactId, name: contactName }
              : companyId !== null && companyName !== null
                ? { type: 'company' as const, id: companyId, name: companyName }
                : null,
      }))
    )
  )
