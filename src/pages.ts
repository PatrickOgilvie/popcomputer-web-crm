// Each page's props, as the Effect Schema `render` checks and encodes them
// with: a column the schema does not name never reaches the browser.
import { Schema as S, Struct } from 'effect'
import { tableSchema } from '@popcomputer/web/schema'
import { DealStage } from './forms'
import * as schema from './schema'

const companyFields = tableSchema(schema.companies)
const contactFields = tableSchema(schema.contacts)
const dealFields = tableSchema(schema.deals)
const activityFields = tableSchema(schema.activities)

/** Another record a page links to, by its name. */
export const RecordLink = S.Struct({ id: S.String, name: S.String })

export const CompanyOption = companyFields.mapFields(Struct.pick(['id', 'name']))

export const ContactOption = contactFields.mapFields(Struct.pick(['id', 'name', 'companyId']))

/** A card on the board: the deal, and who it's with. */
export const DealCard = dealFields.mapFields((fields) => ({
  ...Struct.pick(fields, ['id', 'title', 'value', 'stage', 'position', 'expectedCloseOn', 'updatedAt']),
  companyName: S.NullOr(S.String),
  contactName: S.NullOr(S.String),
}))

export const DealSummary = dealFields.mapFields(
  Struct.pick(['id', 'title', 'value', 'stage', 'expectedCloseOn', 'updatedAt'])
)

export const Deal = dealFields.mapFields((fields) => ({
  ...Struct.pick(fields, [
    'id',
    'title',
    'value',
    'stage',
    'expectedCloseOn',
    'notes',
    'companyId',
    'contactId',
    'closedAt',
    'createdAt',
    'updatedAt',
  ]),
  company: S.NullOr(RecordLink),
  contact: S.NullOr(RecordLink),
}))

export const ContactRow = contactFields.mapFields((fields) => ({
  ...Struct.pick(fields, ['id', 'name', 'email', 'phone', 'title', 'companyId', 'updatedAt']),
  companyName: S.NullOr(S.String),
  openDealCount: S.Number,
}))

export const ContactSummary = contactFields.mapFields(Struct.pick(['id', 'name', 'email', 'phone', 'title']))

export const Contact = contactFields.mapFields((fields) => ({
  ...Struct.pick(fields, ['id', 'name', 'email', 'phone', 'title', 'notes', 'companyId', 'createdAt', 'updatedAt']),
  company: S.NullOr(RecordLink),
}))

export const CompanyRow = companyFields.mapFields((fields) => ({
  ...Struct.pick(fields, ['id', 'name', 'website', 'industry', 'updatedAt']),
  contactCount: S.Number,
  openDealCount: S.Number,
  openDealValue: S.Number,
}))

export const Company = companyFields.mapFields(
  Struct.pick(['id', 'name', 'website', 'industry', 'notes', 'createdAt', 'updatedAt'])
)

export const Activity = activityFields.mapFields(
  Struct.pick(['id', 'kind', 'body', 'dueOn', 'completedAt', 'createdAt'])
)

/** An activity with the record it was logged on, for lists that mix them. */
export const ActivityWithSubject = activityFields.mapFields((fields) => ({
  ...Struct.pick(fields, ['id', 'kind', 'body', 'dueOn', 'completedAt', 'createdAt']),
  subject: S.NullOr(S.Struct({ type: S.Literals(['deal', 'contact', 'company']), id: S.String, name: S.String })),
}))

export const StageTotal = S.Struct({ stage: DealStage, count: S.Number, value: S.Number })

const Prefill = S.Struct({ stage: DealStage, companyId: S.NullOr(S.String), contactId: S.NullOr(S.String) })

export const pages = {
  'Auth/Login': S.Struct({}),
  Dashboard: S.Struct({
    stages: S.Array(StageTotal),
    wonLast30Days: S.Struct({ count: S.Number, value: S.Number }),
    closingSoon: S.Array(DealCard),
    upcomingTasks: S.Array(ActivityWithSubject),
    recentActivity: S.Array(ActivityWithSubject),
    contactCount: S.Number,
    companyCount: S.Number,
  }),
  'Deals/Board': S.Struct({ deals: S.Array(DealCard) }),
  'Deals/Create': S.Struct({ companies: S.Array(CompanyOption), contacts: S.Array(ContactOption), prefill: Prefill }),
  'Deals/Show': S.Struct({ deal: Deal, activities: S.Array(Activity) }),
  'Deals/Edit': S.Struct({ deal: Deal, companies: S.Array(CompanyOption), contacts: S.Array(ContactOption) }),
  'Contacts/Index': S.Struct({ contacts: S.Array(ContactRow), q: S.NullOr(S.String), total: S.Number }),
  'Contacts/Create': S.Struct({ companies: S.Array(CompanyOption), prefill: S.Struct({ companyId: S.NullOr(S.String) }) }),
  'Contacts/Show': S.Struct({ contact: Contact, deals: S.Array(DealSummary), activities: S.Array(Activity) }),
  'Contacts/Edit': S.Struct({ contact: Contact, companies: S.Array(CompanyOption) }),
  'Companies/Index': S.Struct({ companies: S.Array(CompanyRow), q: S.NullOr(S.String), total: S.Number }),
  'Companies/Create': S.Struct({}),
  'Companies/Show': S.Struct({
    company: Company,
    contacts: S.Array(ContactSummary),
    deals: S.Array(DealSummary),
    activities: S.Array(Activity),
  }),
  'Companies/Edit': S.Struct({ company: Company }),
  'Tasks/Index': S.Struct({
    tasks: S.Array(ActivityWithSubject),
    show: S.Literals(['open', 'done']),
    openCount: S.Number,
    doneCount: S.Number,
  }),
}
