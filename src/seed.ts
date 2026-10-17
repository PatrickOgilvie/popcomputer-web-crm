import { createAuth } from './auth'
import type { Database } from './db'
import type { Bindings } from './env'
import type { DealStage } from './forms'
import { activities, companies, contacts, deals } from './schema'

/** The member `bun run db:seed` creates, to sign in as locally. */
export const seedMember = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'at least twelve characters',
} as const

const DAY = 24 * 60 * 60 * 1000

/** A day this many days from today, `YYYY-MM-DD`. */
const dayFrom = (now: Date, days: number) => new Date(now.getTime() + days * DAY).toISOString().slice(0, 10)

const ago = (now: Date, days: number) => new Date(now.getTime() - days * DAY)

const companyRows = [
  { key: 'northwind', name: 'Northwind Traders', website: 'https://northwind.example', industry: 'Wholesale' },
  { key: 'globex', name: 'Globex', website: 'https://globex.example', industry: 'Manufacturing' },
  { key: 'initech', name: 'Initech', website: 'https://initech.example', industry: 'Software' },
  { key: 'umbrella', name: 'Umbrella Health', website: 'https://umbrella.example', industry: 'Healthcare' },
  { key: 'stark', name: 'Stark Fabrication', website: 'https://stark.example', industry: 'Engineering' },
  { key: 'wonka', name: 'Wonka Confectionery', website: 'https://wonka.example', industry: 'Food & drink' },
  { key: 'tyrell', name: 'Tyrell Logistics', website: 'https://tyrell.example', industry: 'Logistics' },
] as const

type CompanyKey = (typeof companyRows)[number]['key']

const contactRows: ReadonlyArray<{
  key: string
  company: CompanyKey | null
  name: string
  title: string
  email: string
  phone: string
}> = [
  { key: 'grace', company: 'northwind', name: 'Grace Hopper', title: 'Head of Operations', email: 'grace@northwind.example', phone: '+1 555 0101' },
  { key: 'alan', company: 'northwind', name: 'Alan Turing', title: 'Procurement Lead', email: 'alan@northwind.example', phone: '+1 555 0102' },
  { key: 'katherine', company: 'globex', name: 'Katherine Johnson', title: 'VP Engineering', email: 'katherine@globex.example', phone: '+1 555 0103' },
  { key: 'linus', company: 'initech', name: 'Linus Pauling', title: 'CTO', email: 'linus@initech.example', phone: '+1 555 0104' },
  { key: 'margaret', company: 'initech', name: 'Margaret Hamilton', title: 'Director of Platform', email: 'margaret@initech.example', phone: '+1 555 0105' },
  { key: 'rosalind', company: 'umbrella', name: 'Rosalind Franklin', title: 'Chief Medical Officer', email: 'rosalind@umbrella.example', phone: '+1 555 0106' },
  { key: 'nikola', company: 'stark', name: 'Nikola Tesla', title: 'Founder', email: 'nikola@stark.example', phone: '+1 555 0107' },
  { key: 'hedy', company: 'stark', name: 'Hedy Lamarr', title: 'Head of R&D', email: 'hedy@stark.example', phone: '+1 555 0108' },
  { key: 'barbara', company: 'wonka', name: 'Barbara Liskov', title: 'COO', email: 'barbara@wonka.example', phone: '+1 555 0109' },
  { key: 'claude', company: 'tyrell', name: 'Claude Shannon', title: 'Fleet Manager', email: 'claude@tyrell.example', phone: '+1 555 0110' },
  { key: 'mary', company: null, name: 'Mary Somerville', title: 'Independent consultant', email: 'mary@somerville.example', phone: '+44 20 7946 0011' },
]

const dealRows: ReadonlyArray<{
  key: string
  title: string
  value: number
  stage: typeof DealStage.Type
  company: CompanyKey | null
  contact: string | null
  closesIn: number | null
  closedDaysAgo?: number
}> = [
  { key: 'northwind-rollout', title: 'Warehouse rollout', value: 48_000, stage: 'negotiation', company: 'northwind', contact: 'grace', closesIn: 6 },
  { key: 'northwind-support', title: 'Premium support renewal', value: 12_000, stage: 'proposal', company: 'northwind', contact: 'alan', closesIn: 14 },
  { key: 'globex-pilot', title: 'Factory floor pilot', value: 25_000, stage: 'qualified', company: 'globex', contact: 'katherine', closesIn: 30 },
  { key: 'initech-platform', title: 'Platform migration', value: 96_000, stage: 'proposal', company: 'initech', contact: 'margaret', closesIn: 21 },
  { key: 'initech-seats', title: '50 extra seats', value: 15_000, stage: 'lead', company: 'initech', contact: 'linus', closesIn: null },
  { key: 'umbrella-records', title: 'Patient records integration', value: 140_000, stage: 'negotiation', company: 'umbrella', contact: 'rosalind', closesIn: -2 },
  { key: 'stark-prototype', title: 'Prototype tooling', value: 32_000, stage: 'qualified', company: 'stark', contact: 'hedy', closesIn: 45 },
  { key: 'stark-expansion', title: 'Second site', value: 60_000, stage: 'lead', company: 'stark', contact: 'nikola', closesIn: 90 },
  { key: 'wonka-seasonal', title: 'Seasonal campaign', value: 8_500, stage: 'lead', company: 'wonka', contact: 'barbara', closesIn: null },
  { key: 'tyrell-tracking', title: 'Fleet tracking', value: 54_000, stage: 'proposal', company: 'tyrell', contact: 'claude', closesIn: 10 },
  { key: 'somerville-audit', title: 'Process audit', value: 6_000, stage: 'qualified', company: null, contact: 'mary', closesIn: 12 },
  { key: 'globex-training', title: 'Onboarding training', value: 9_000, stage: 'won', company: 'globex', contact: 'katherine', closesIn: null, closedDaysAgo: 4 },
  { key: 'northwind-starter', title: 'Starter plan', value: 18_000, stage: 'won', company: 'northwind', contact: 'grace', closesIn: null, closedDaysAgo: 12 },
  { key: 'wonka-pos', title: 'Point-of-sale refresh', value: 22_000, stage: 'lost', company: 'wonka', contact: 'barbara', closesIn: null, closedDaysAgo: 9 },
]

/**
 * What the local database holds after `bun run db:seed`: a member to sign in
 * as, with a CRM's worth of companies, people, deals in every stage, and a
 * timeline with tasks due around today. It runs in Bun on the local D1
 * database once the migrations are applied, never on the deployed one, and
 * its inserts are typed by src/schema.ts like the app's own.
 */
export async function seed(db: Database, env: Bindings): Promise<void> {
  // Through Better Auth, as the sign-up form does, so the password signs in.
  const auth = createAuth({ db, secret: env.BETTER_AUTH_SECRET, baseURL: 'http://localhost' })
  const { user } = await auth.api.signUpEmail({ body: { ...seedMember } })
  const userId = user.id
  const now = new Date()

  const companyIds = Object.fromEntries(companyRows.map((row) => [row.key, crypto.randomUUID()])) as Record<CompanyKey, string>
  const contactIds = Object.fromEntries(contactRows.map((row) => [row.key, crypto.randomUUID()]))
  const dealIds = Object.fromEntries(dealRows.map((row) => [row.key, crypto.randomUUID()]))
  const id = (ids: Record<string, string>, key: string) => {
    const found = ids[key]
    if (found === undefined) throw new Error(`The seed names ${key}, which it doesn't create.`)
    return found
  }

  // One row per statement: D1 binds at most 100 values to one.
  for (const [index, { key, ...row }] of companyRows.entries()) {
    await db.insert(companies).values({ ...row, id: companyIds[key], userId, updatedAt: ago(now, index) })
  }
  for (const value of contactRows.map(({ key, company, ...row }, index) => ({
      ...row,
      id: id(contactIds, key),
      userId,
      companyId: company === null ? null : companyIds[company],
      updatedAt: ago(now, index),
    }))) {
    await db.insert(contacts).values(value)
  }
  for (const value of dealRows.map((row, index) => ({
      id: id(dealIds, row.key),
      userId,
      title: row.title,
      value: row.value,
      stage: row.stage,
      position: index,
      companyId: row.company === null ? null : companyIds[row.company],
      contactId: row.contact === null ? null : id(contactIds, row.contact),
      expectedCloseOn: row.closesIn === null ? null : dayFrom(now, row.closesIn),
      closedAt: row.closedDaysAgo === undefined ? null : ago(now, row.closedDaysAgo),
      updatedAt: ago(now, index % 5),
    }))) {
    await db.insert(deals).values(value)
  }
  const timeline: Array<typeof activities.$inferInsert> = [
    { userId, dealId: id(dealIds, 'umbrella-records'), kind: 'call', body: 'Walked Rosalind through the integration plan. Legal wants a data-processing addendum before signing.', createdAt: ago(now, 1) },
    { userId, dealId: id(dealIds, 'umbrella-records'), kind: 'task', body: 'Send the data-processing addendum to legal', dueOn: dayFrom(now, -1), createdAt: ago(now, 1) },
    { userId, dealId: id(dealIds, 'northwind-rollout'), kind: 'meeting', body: 'On-site at the Leeds warehouse. They want go-live before the holiday rush.', createdAt: ago(now, 3) },
    { userId, dealId: id(dealIds, 'northwind-rollout'), kind: 'task', body: 'Confirm the rollout timeline with Grace', dueOn: dayFrom(now, 0), createdAt: ago(now, 2) },
    { userId, dealId: id(dealIds, 'initech-platform'), kind: 'email', body: 'Sent the migration proposal and the reference architecture.', createdAt: ago(now, 2) },
    { userId, dealId: id(dealIds, 'initech-platform'), kind: 'task', body: 'Follow up on the migration proposal', dueOn: dayFrom(now, 3), createdAt: ago(now, 2) },
    { userId, dealId: id(dealIds, 'tyrell-tracking'), kind: 'note', body: 'Claude mentioned a competitor quoted 20% lower, but without the route optimisation.', createdAt: ago(now, 4) },
    { userId, contactId: id(contactIds, 'katherine'), kind: 'call', body: 'Intro call: the pilot would cover one production line for six weeks.', createdAt: ago(now, 6) },
    { userId, contactId: id(contactIds, 'hedy'), kind: 'task', body: 'Book a demo of the tooling configurator', dueOn: dayFrom(now, 7), createdAt: ago(now, 1) },
    { userId, companyId: companyIds.globex, kind: 'note', body: 'Globex is consolidating suppliers this year: a good time to land the pilot.', createdAt: ago(now, 8) },
    { userId, companyId: companyIds.wonka, kind: 'task', body: 'Ask Barbara why the point-of-sale deal fell through', dueOn: dayFrom(now, 2), createdAt: ago(now, 5) },
    { userId, kind: 'task', body: 'Prepare the quarterly pipeline review', dueOn: dayFrom(now, 5), createdAt: ago(now, 1) },
    { userId, kind: 'task', body: 'Update the pricing sheet', dueOn: null, createdAt: ago(now, 2) },
    { userId, dealId: id(dealIds, 'globex-training'), kind: 'task', body: 'Send the training materials', dueOn: dayFrom(now, -3), completedAt: ago(now, 3), createdAt: ago(now, 6) },
  ]
  for (const value of timeline) await db.insert(activities).values(value)
  console.log(`Sign in as ${seedMember.email}, with the password "${seedMember.password}".`)
}
