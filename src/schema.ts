import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema'
import { ActivityKind, DealStage } from './forms'

export * from './auth-schema'

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
const owner = () => text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
const createdAt = () => integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date())
const updatedAt = () => integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date())

// Each member's CRM is their own: every table has an owner, every page binds
// its records ownedBy 'userId', and the triggers in
// migrations/0001_owner_rules.sql stop a contact or a deal from naming another
// member's company or contact, whatever writes it.

export const companies = sqliteTable(
  'companies',
  {
    id: id(),
    userId: owner(),
    name: text('name').notNull(),
    website: text('website'),
    industry: text('industry'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('companies_user_name_idx').on(table.userId, table.name),
    // The database holds the same limits the forms check, whatever writes to it.
    check('companies_name_length', sql`length(${table.name}) BETWEEN 1 AND 100`),
    check('companies_website_length', sql`${table.website} IS NULL OR length(${table.website}) <= 2048`),
    check('companies_industry_length', sql`${table.industry} IS NULL OR length(${table.industry}) <= 60`),
    check('companies_notes_length', sql`${table.notes} IS NULL OR length(${table.notes}) <= 2000`),
  ]
)

export const contacts = sqliteTable(
  'contacts',
  {
    id: id(),
    userId: owner(),
    companyId: text('company_id').references(() => companies.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    title: text('title'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('contacts_user_name_idx').on(table.userId, table.name),
    index('contacts_company_idx').on(table.companyId),
    check('contacts_name_length', sql`length(${table.name}) BETWEEN 1 AND 100`),
    check('contacts_email_length', sql`${table.email} IS NULL OR length(${table.email}) <= 254`),
    check('contacts_phone_length', sql`${table.phone} IS NULL OR length(${table.phone}) <= 40`),
    check('contacts_title_length', sql`${table.title} IS NULL OR length(${table.title}) <= 100`),
    check('contacts_notes_length', sql`${table.notes} IS NULL OR length(${table.notes}) <= 2000`),
  ]
)

export const deals = sqliteTable(
  'deals',
  {
    id: id(),
    userId: owner(),
    companyId: text('company_id').references(() => companies.id, { onDelete: 'set null' }),
    contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    /** In whole units of the currency, without cents. */
    value: integer('value').notNull().default(0),
    stage: text('stage', { enum: DealStage.literals }).notNull().default('lead'),
    /** Its order in its stage's column: lower is higher up. */
    position: integer('position').notNull().default(0),
    expectedCloseOn: text('expected_close_on'),
    notes: text('notes'),
    /** When it moved to won or lost; null while it's open. */
    closedAt: integer('closed_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('deals_user_stage_position_idx').on(table.userId, table.stage, table.position),
    index('deals_company_idx').on(table.companyId),
    index('deals_contact_idx').on(table.contactId),
    check('deals_title_length', sql`length(${table.title}) BETWEEN 1 AND 100`),
    check('deals_value_range', sql`${table.value} BETWEEN 0 AND 1000000000`),
    check('deals_stage', sql`${table.stage} IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')`),
    check('deals_notes_length', sql`${table.notes} IS NULL OR length(${table.notes}) <= 2000`),
    check(
      'deals_closed_when_won_or_lost',
      sql`(${table.stage} IN ('won', 'lost')) = (${table.closedAt} IS NOT NULL)`
    ),
  ]
)

/**
 * The timeline: notes, calls, emails, meetings and tasks. Each is logged on
 * at most one deal, contact or company, which the route it's logged on
 * names, so the subject is never a form's to choose.
 */
export const activities = sqliteTable(
  'activities',
  {
    id: id(),
    userId: owner(),
    dealId: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }),
    contactId: text('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
    companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ActivityKind.literals }).notNull(),
    body: text('body').notNull(),
    /** A task's due day, `YYYY-MM-DD`. */
    dueOn: text('due_on'),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
  },
  (table) => [
    index('activities_user_kind_idx').on(table.userId, table.kind, table.completedAt, table.dueOn),
    index('activities_deal_idx').on(table.dealId, table.createdAt),
    index('activities_contact_idx').on(table.contactId, table.createdAt),
    index('activities_company_idx').on(table.companyId, table.createdAt),
    check('activities_body_length', sql`length(${table.body}) BETWEEN 1 AND 2000`),
    check('activities_kind', sql`${table.kind} IN ('note', 'call', 'email', 'meeting', 'task')`),
    check(
      'activities_one_subject',
      sql`(${table.dealId} IS NOT NULL) + (${table.contactId} IS NOT NULL) + (${table.companyId} IS NOT NULL) <= 1`
    ),
    check('activities_only_tasks_are_due', sql`${table.kind} = 'task' OR (${table.dueOn} IS NULL AND ${table.completedAt} IS NULL)`),
  ]
)
