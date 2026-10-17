import { and, asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { DateTime, Effect } from 'effect'
import {
  action,
  authorize,
  back,
  bound,
  dbMutation,
  dbQuery,
  flash,
  redirect,
  render,
  validateRequest,
} from '@popcomputer/web/effect'
import { ActivityForm, TaskCompletion, TaskFilter, TaskForm } from '../forms'
import { paths } from '../paths'
import { activities } from '../schema'
import { activitiesWithSubjects } from './shared'

type Subject = { readonly dealId: string } | { readonly contactId: string } | { readonly companyId: string }

const logged = {
  note: 'Note added.',
  call: 'Call logged.',
  email: 'Email logged.',
  meeting: 'Meeting logged.',
  task: 'Task added.',
} as const

/**
 * Logs the form's activity on the record the route names. The subject and
 * its owner come from the bound record, never from the form.
 */
export const logActivity = (userId: string, subject: Subject) =>
  Effect.gen(function* () {
    const input = yield* validateRequest(ActivityForm)

    yield* dbMutation((db) =>
      db.insert(activities).values({
        ...subject,
        userId,
        kind: input.kind,
        body: input.body,
        dueOn: input.kind === 'task' ? input.dueOn : null,
      })
    )
    yield* flash('success', logged[input.kind])
  })

export const logDealActivity = action(
  Effect.gen(function* () {
    const deal = yield* bound('deal')
    yield* logActivity(deal.userId, { dealId: deal.id })

    return yield* redirect(paths.deal, { deal: deal.id })
  })
)

export const logContactActivity = action(
  Effect.gen(function* () {
    const contact = yield* bound('contact')
    yield* logActivity(contact.userId, { contactId: contact.id })

    return yield* redirect(paths.contact, { contact: contact.id })
  })
)

export const logCompanyActivity = action(
  Effect.gen(function* () {
    const company = yield* bound('company')
    yield* logActivity(company.userId, { companyId: company.id })

    return yield* redirect(paths.company, { company: company.id })
  })
)

/** Every task the member has, open ones by due day, done ones newest first. */
export const listTasks = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const { show } = yield* validateRequest(TaskFilter)
    const showing = show ?? 'open'
    const ownTasks = and(eq(activities.userId, auth.user.id), eq(activities.kind, 'task'))

    const { tasks, openCount, doneCount } = yield* Effect.all({
      tasks:
        showing === 'open'
          ? activitiesWithSubjects(
              and(ownTasks, isNull(activities.completedAt)),
              // Tasks without a day come after those with one.
              [sql`${activities.dueOn} IS NULL`, asc(activities.dueOn), asc(activities.createdAt)],
              500
            )
          : activitiesWithSubjects(and(ownTasks, isNotNull(activities.completedAt)), [desc(activities.completedAt)], 100),
      openCount: dbQuery((db) => db.$count(activities, and(ownTasks, isNull(activities.completedAt)))),
      doneCount: dbQuery((db) => db.$count(activities, and(ownTasks, isNotNull(activities.completedAt)))),
    }, { concurrency: 'unbounded' })

    return yield* render('Tasks/Index', { tasks, show: showing, openCount, doneCount })
  })
)

/** A task of the member's own, on no record. */
export const createTask = action(
  Effect.gen(function* () {
    const auth = yield* authorize()
    const input = yield* validateRequest(TaskForm)

    yield* dbMutation((db) => db.insert(activities).values({ ...input, userId: auth.user.id, kind: 'task' }))
    yield* flash('success', 'Task added.')

    return yield* back(paths.tasks)
  })
)

/** Ticks a task off, or opens it again. Anything but a task stays as it is. */
export const completeTask = action(
  Effect.gen(function* () {
    const activity = yield* bound('activity')
    const { completed } = yield* validateRequest(TaskCompletion)
    const now = DateTime.toDateUtc(yield* DateTime.now)

    yield* dbMutation((db) =>
      db.update(activities)
        .set({ completedAt: completed ? (activity.completedAt ?? now) : null })
        .where(and(eq(activities.id, activity.id), eq(activities.userId, activity.userId), eq(activities.kind, 'task')))
    )

    return yield* back(paths.tasks)
  })
)

export const deleteActivity = action(
  Effect.gen(function* () {
    const activity = yield* bound('activity')

    yield* dbMutation((db) =>
      db.delete(activities).where(and(eq(activities.id, activity.id), eq(activities.userId, activity.userId)))
    )
    yield* flash('success', activity.kind === 'task' ? 'Task deleted.' : 'Activity deleted.')

    return yield* back(paths.tasks)
  })
)
