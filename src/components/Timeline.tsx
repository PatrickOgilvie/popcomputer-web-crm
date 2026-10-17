import { router, useForm } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { FormInput, PagePropsFor } from '@popcomputer/web/react'
import { CalendarClock, ListTodo, Mail, MessageSquareText, Phone, Trash2, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { buttonClassName } from '~/components/button'
import { cn } from '~/components/cn'
import ConfirmationDialog from '~/components/ConfirmationDialog'
import { describeDue, daysUntil } from '~/components/crm-format'
import FieldError from '~/components/FieldError'
import { fieldControlClassName } from '~/components/fieldStyles'
import { formatDateTime, formatRelativeTime } from '~/components/format'
import type { ActivityForm, ActivityKind } from '~/forms'
import { paths } from '~/paths'

type Kind = typeof ActivityKind.Type
type Activity = PagePropsFor<'Deals/Show'>['activities'][number]

export const kindStyles: Readonly<Record<Kind, { label: string; verb: string; icon: LucideIcon; tone: string }>> = {
  note: { label: 'Note', verb: 'Add note', icon: MessageSquareText, tone: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' },
  call: { label: 'Call', verb: 'Log call', icon: Phone, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  email: { label: 'Email', verb: 'Log email', icon: Mail, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  meeting: { label: 'Meeting', verb: 'Log meeting', icon: Users, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  task: { label: 'Task', verb: 'Add task', icon: ListTodo, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
}

const kinds: ReadonlyArray<Kind> = ['note', 'call', 'email', 'meeting', 'task']

const placeholders: Readonly<Record<Kind, string>> = {
  note: 'What did you learn?',
  call: 'What was said on the call?',
  email: 'What did the email say?',
  meeting: 'Who was there, and what was agreed?',
  task: 'What needs doing?',
}

/** A task's tick box: ticking it off, or opening it again, saves straight away. */
export function TaskCheckbox({ task, label }: { readonly task: { id: string; completedAt: string | null }; readonly label: string }) {
  const [pending, setPending] = useState(false)
  const done = task.completedAt !== null

  return (
    <input
      type="checkbox"
      checked={done}
      disabled={pending}
      aria-label={done ? `Reopen “${label}”` : `Complete “${label}”`}
      className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-emerald-600 disabled:cursor-wait"
      onChange={() =>
        router.patch(
          href(paths.activity, { activity: task.id }),
          { completed: !done },
          { preserveScroll: true, onStart: () => setPending(true), onFinish: () => setPending(false) }
        )
      }
    />
  )
}

/** When a task is due, red once it has passed. */
export function DueLabel({ dueOn, done }: { readonly dueOn: string; readonly done: boolean }) {
  const days = daysUntil(dueOn) ?? 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
        done
          ? 'text-zinc-500 dark:text-zinc-400'
          : days < 0
            ? 'text-red-700 dark:text-red-400'
            : days === 0
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-zinc-600 dark:text-zinc-400'
      )}
    >
      <CalendarClock className="size-3.5" aria-hidden="true" />
      {describeDue(dueOn)}
    </span>
  )
}

function Composer({ logPath }: { readonly logPath: string }) {
  const { data, setData, post, processing, errors, clearErrors, reset } = useForm<FormInput<typeof ActivityForm>>({
    kind: 'note',
    body: '',
    dueOn: null,
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    post(logPath, { preserveScroll: true, onSuccess: () => reset('body', 'dueOn') })
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-3">
      <fieldset className="flex flex-wrap gap-1" disabled={processing}>
        <legend className="sr-only">Log a</legend>
        {kinds.map((kind) => {
          const style = kindStyles[kind]
          return (
            <label
              key={kind}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-zinc-600 select-none hover:bg-zinc-100 hover:text-zinc-950 has-checked:bg-zinc-950 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-orange-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white dark:has-checked:bg-white dark:has-checked:text-zinc-950"
            >
              <input
                type="radio"
                name="kind"
                value={kind}
                checked={data.kind === kind}
                className="sr-only"
                onChange={() => setData('kind', kind)}
              />
              <style.icon className="size-4" aria-hidden="true" />
              {style.label}
            </label>
          )
        })}
      </fieldset>
      <div className="flex flex-col gap-2">
        <label htmlFor="activity-body" className="sr-only">
          {kindStyles[data.kind].label}
        </label>
        <textarea
          id="activity-body"
          name="body"
          rows={3}
          maxLength={2000}
          disabled={processing}
          placeholder={placeholders[data.kind]}
          value={data.body}
          className={cn(fieldControlClassName, 'min-h-20 resize-y py-2 text-pretty')}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? 'activity-body-error' : undefined}
          onChange={(event) => {
            setData('body', event.target.value)
            clearErrors('body')
          }}
          onKeyDown={(event) => {
            // ⌘↵ or Ctrl↵ sends it, as in most editors.
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) event.currentTarget.form?.requestSubmit()
          }}
        />
        <FieldError id="activity-body-error" message={errors.body} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        {data.kind === 'task' ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="activity-due" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Due
            </label>
            <input
              id="activity-due"
              type="date"
              name="dueOn"
              disabled={processing}
              value={data.dueOn ?? ''}
              className={cn(fieldControlClassName, 'h-9 w-auto')}
              aria-invalid={errors.dueOn ? true : undefined}
              onChange={(event) => setData('dueOn', event.target.value === '' ? null : event.target.value)}
            />
            <FieldError id="activity-due-error" message={errors.dueOn} />
          </div>
        ) : (
          <span />
        )}
        <button type="submit" disabled={processing} className={buttonClassName({ size: 'sm' })}>
          {kindStyles[data.kind].verb}
        </button>
      </div>
    </form>
  )
}

/**
 * A record's timeline: a form that logs a note, call, email, meeting or task
 * on it, and everything logged so far, newest first.
 */
export default function Timeline({
  activities,
  logPath,
}: {
  readonly activities: ReadonlyArray<Activity>
  readonly logPath: string
}) {
  const [deleting, setDeleting] = useState<Activity | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <section
      aria-labelledby="timeline-title"
      className="rounded-lg border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
        <h2 id="timeline-title" className="mb-3 text-base font-semibold">
          Timeline
        </h2>
        <Composer logPath={logPath} />
      </div>

      {activities.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Nothing logged yet. Notes, calls and tasks show up here.
        </p>
      ) : (
        <ol className="flex flex-col px-5 py-2">
          {activities.map((activity, index) => {
            const style = kindStyles[activity.kind]
            const done = activity.completedAt !== null
            return (
              <li key={activity.id} className="group relative flex gap-3 py-3">
                {index < activities.length - 1 ? (
                  <span
                    className="absolute top-11 bottom-0 left-4 w-px -translate-x-1/2 bg-zinc-200 dark:bg-zinc-800"
                    aria-hidden="true"
                  />
                ) : null}
                <span className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-full', style.tone)}>
                  <style.icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-start gap-2">
                    {activity.kind === 'task' ? <TaskCheckbox task={activity} label={activity.body} /> : null}
                    <p
                      className={cn(
                        'min-w-0 flex-1 text-sm whitespace-pre-line text-pretty text-zinc-800 dark:text-zinc-200',
                        done && 'text-zinc-500 line-through dark:text-zinc-500'
                      )}
                    >
                      {activity.body}
                    </p>
                    <button
                      type="button"
                      className={buttonClassName({
                        variant: 'ghost',
                        size: 'sm',
                        className: 'size-7 px-0 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100',
                      })}
                      aria-label={`Delete this ${style.label.toLowerCase()}`}
                      onClick={() => setDeleting(activity)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{style.label}</span>
                    <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)}>
                      {formatRelativeTime(activity.createdAt)}
                    </time>
                    {activity.dueOn !== null ? <DueLabel dueOn={activity.dueOn} done={done} /> : null}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title={`Delete this ${deleting ? kindStyles[deleting.kind].label.toLowerCase() : 'entry'}?`}
        description="It’s removed from the timeline. This can’t be undone."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        busy={busy}
        onConfirm={() => {
          if (deleting === null) return
          router.delete(href(paths.activity, { activity: deleting.id }), {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => {
              setBusy(false)
              setDeleting(null)
            },
          })
        }}
      />
    </section>
  )
}
