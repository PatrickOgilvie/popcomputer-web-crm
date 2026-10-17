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
import { ContactForm, ContactPrefill, Search } from '../forms'
import { paths } from '../paths'
import { activities, companies, contacts, deals } from '../schema'
import { dealSummaries, openStages, ownerFieldErrors, timeline } from './shared'

/** A search as a LIKE pattern, its own % and _ matched as themselves. */
export const containing = (q: string) => `%${q.replace(/[\\%_]/g, (character) => `\\${character}`)}%`

const companyOptions = (userId: string) =>
  dbQuery((db) =>
    db.select({ id: companies.id, name: companies.name })
      .from(companies)
      .where(eq(companies.userId, userId))
      .orderBy(asc(companies.name))
  )

/** The contact with its company's name, for its page and its form. */
const contactWithCompany = (contact: typeof contacts.$inferSelect) =>
  Effect.gen(function* () {
    const company = contact.companyId === null
      ? []
      : yield* dbQuery((db) =>
          db.select({ id: companies.id, name: companies.name })
            .from(companies)
            .where(and(eq(companies.id, contact.companyId ?? ''), eq(companies.userId, contact.userId)))
        )

    return { ...contact, company: company[0] ?? null }
  })

/** The member's contacts, or those whose name, email, title or company matches the search. */
export const listContacts = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const { q } = yield* validateRequest(Search)
    const own = eq(contacts.userId, auth.user.id)
    const pattern = q === null ? null : containing(q)
    const matches = pattern === null
      ? undefined
      : or(
          sql`${contacts.name} LIKE ${pattern} ESCAPE '\\'`,
          sql`${contacts.email} LIKE ${pattern} ESCAPE '\\'`,
          sql`${contacts.title} LIKE ${pattern} ESCAPE '\\'`,
          sql`${companies.name} LIKE ${pattern} ESCAPE '\\'`
        )

    const { rows, total, openDeals } = yield* Effect.all({
      rows: dbQuery((db) =>
        db.select({
          id: contacts.id,
          name: contacts.name,
          email: contacts.email,
          phone: contacts.phone,
          title: contacts.title,
          companyId: contacts.companyId,
          updatedAt: contacts.updatedAt,
          companyName: companies.name,
        })
          .from(contacts)
          .leftJoin(companies, and(eq(companies.id, contacts.companyId), eq(companies.userId, contacts.userId)))
          .where(and(own, matches))
          .orderBy(asc(contacts.name))
          .limit(500)
      ),
      total: dbQuery((db) => db.$count(contacts, own)),
      openDeals: dbQuery((db) =>
        db.select({ contactId: deals.contactId, count: count() })
          .from(deals)
          .where(and(eq(deals.userId, auth.user.id), inArray(deals.stage, openStages)))
          .groupBy(deals.contactId)
      ),
    }, { concurrency: 'unbounded' })
    const openDealsBy = new Map(openDeals.map((row) => [row.contactId, row.count]))

    return yield* render('Contacts/Index', {
      contacts: rows.map((row) => ({ ...row, openDealCount: openDealsBy.get(row.id) ?? 0 })),
      q,
      total,
    })
  })
)

export const newContact = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const prefill = yield* validateRequest(ContactPrefill)

    return yield* render('Contacts/Create', { companies: yield* companyOptions(auth.user.id), prefill })
  })
)

export const createContact = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const input = yield* validateRequest(ContactForm)
    const [created] = yield* dbMutation((db) =>
      db.insert(contacts).values({ ...input, userId: auth.user.id }).returning({ id: contacts.id })
    ).pipe(ownerFieldErrors)

    if (created === undefined) return yield* Effect.die(new Error('The contact insert returned no row.'))

    yield* flash('success', 'Contact added.')

    return yield* redirect(paths.contact, { contact: created.id })
  })
)

export const showContact = action(
  Effect.gen(function* () {
    const contact = yield* bound('contact')
    const [withCompany, contactDeals, timelineRows] = yield* Effect.all([
      contactWithCompany(contact),
      dealSummaries(and(eq(deals.contactId, contact.id), eq(deals.userId, contact.userId))),
      timeline(eq(activities.contactId, contact.id)),
    ], { concurrency: 'unbounded' })

    return yield* render('Contacts/Show', { contact: withCompany, deals: contactDeals, activities: timelineRows })
  })
)

export const editContact = action(
  Effect.gen(function* () {
    const contact = yield* bound('contact')
    const [withCompany, options] = yield* Effect.all([contactWithCompany(contact), companyOptions(contact.userId)], {
      concurrency: 'unbounded',
    })

    return yield* render('Contacts/Edit', { contact: withCompany, companies: options })
  })
)

export const updateContact = action(
  Effect.gen(function* () {
    const contact = yield* bound('contact')
    const input = yield* validateRequest(ContactForm)
    const updatedAt = DateTime.toDateUtc(yield* DateTime.now)

    yield* dbMutation((db) =>
      db.update(contacts)
        .set({ ...input, updatedAt })
        .where(and(eq(contacts.id, contact.id), eq(contacts.userId, contact.userId)))
    ).pipe(ownerFieldErrors)
    yield* flash('success', 'Contact saved.')

    return yield* redirect(paths.contact, { contact: contact.id })
  })
)

/** Its deals stay, without a contact; its own timeline goes with it. */
export const deleteContact = action(
  Effect.gen(function* () {
    const contact = yield* bound('contact')

    yield* dbMutation((db) =>
      db.delete(contacts).where(and(eq(contacts.id, contact.id), eq(contacts.userId, contact.userId)))
    )
    yield* flash('success', `Deleted ${contact.name}.`)

    return yield* redirect(paths.contacts)
  })
)
