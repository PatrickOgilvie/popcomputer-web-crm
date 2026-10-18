// The fields each form sends, which its action validates and its page types
// its form with. The browser imports this module only with `import type`.
import { Schema as S } from 'effect'
import {
  between,
  checkbox,
  isoDate,
  max,
  nullable,
  nullableEmail,
  nullableString,
  nullableUrl,
  nullableUuid,
  requiredString,
} from '@popcomputer/web/schema'

/** A deal's place in the pipeline, in the board's order. */
export const DealStage = S.Literals(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])

/** What a timeline entry records. Only a task has a due day and can be completed. */
export const ActivityKind = S.Literals(['note', 'call', 'email', 'meeting', 'task'])

const name = requiredString.check(S.isMaxLength(100, { message: 'Use at most 100 characters.' }))
const notes = nullable(max(2000, 'Use at most 2,000 characters.'))

export const CompanyForm = S.Struct({
  name,
  website: nullableUrl,
  industry: nullable(max(60, 'Use at most 60 characters.')),
  notes,
})

export const ContactForm = S.Struct({
  name,
  email: nullableEmail,
  phone: nullable(max(40, 'Use at most 40 characters.')),
  title: nullable(max(100, 'Use at most 100 characters.')),
  companyId: nullableUuid,
  notes,
})

export const DealForm = S.Struct({
  title: name,
  value: between(0, 1_000_000_000, 'Enter a whole amount from 0 to 1,000,000,000.').check(
    S.isInt({ message: 'Enter a whole amount, without cents.' })
  ),
  stage: DealStage,
  expectedCloseOn: nullable(isoDate),
  companyId: nullableUuid,
  contactId: nullableUuid,
  notes,
})

/** Where a dragged card lands: its column, and the card it lands above, or none for the bottom. */
export const DealMove = S.Struct({ stage: DealStage, beforeId: nullableUuid })

/** What the new-deal form starts with, from the column its link was in. */
export const DealPrefill = S.Struct({ stage: nullable(DealStage), companyId: nullableUuid, contactId: nullableUuid })

export const ContactPrefill = S.Struct({ companyId: nullableUuid })

export const ActivityForm = S.Struct({
  kind: ActivityKind,
  body: requiredString.check(S.isMaxLength(2000, { message: 'Use at most 2,000 characters.' })),
  dueOn: nullable(isoDate),
})

export const TaskForm = S.Struct({
  body: requiredString.check(S.isMaxLength(2000, { message: 'Use at most 2,000 characters.' })),
  dueOn: nullable(isoDate),
})

export const TaskCompletion = S.Struct({ completed: checkbox })

/** The search box on the contacts and companies lists. */
export const Search = S.Struct({ q: nullableString })

export const TaskFilter = S.Struct({ show: nullable(S.Literals(['open', 'done'])) })
