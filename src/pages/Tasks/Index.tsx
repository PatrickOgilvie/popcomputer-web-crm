import { Head, Link, router, useForm } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { FormInput, PagePropsFor, WebPage } from '@popcomputer/web/react'
import { CheckCheck, Plus, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'

import { buttonClassName } from '~/components/button'
import { cn } from '~/components/cn'
import { daysUntil, formatDay } from '~/components/crm-format'
import EmptyState from '~/components/EmptyState'
import FieldError from '~/components/FieldError'
import { fieldControlClassName } from '~/components/fieldStyles'
import { formatDate } from '~/components/format'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import SubjectLink from '~/components/SubjectLink'
import { DueLabel, TaskCheckbox } from '~/components/Timeline'
import type { TaskForm } from '~/forms'
import { paths } from '~/paths'

type Task = PagePropsFor<'Tasks/Index'>['tasks'][number]

/** Open tasks in the viewer's own days: what's late, what's today, what's coming. */
function groupByDue(tasks: ReadonlyArray<Task>) {
  const groups = { overdue: [] as Array<Task>, today: [] as Array<Task>, upcoming: [] as Array<Task>, someday: [] as Array<Task> }
  for (const task of tasks) {
    const days = task.dueOn === null ? undefined : daysUntil(task.dueOn)
    if (days === undefined) groups.someday.push(task)
    else if (days < 0) groups.overdue.push(task)
    else if (days === 0) groups.today.push(task)
    else groups.upcoming.push(task)
  }
  return [
    { key: 'overdue', title: 'Overdue', tasks: groups.overdue },
    { key: 'today', title: 'Today', tasks: groups.today },
    { key: 'upcoming', title: 'Upcoming', tasks: groups.upcoming },
    { key: 'someday', title: 'No due date', tasks: groups.someday },
  ].filter((group) => group.tasks.length > 0)
}

function TaskRow({ task }: { readonly task: Task }) {
  const done = task.completedAt !== null

  return (
    <li className="group flex items-start gap-3 px-4 py-3 sm:px-5">
      <TaskCheckbox task={task} label={task.body} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm text-pretty', done && 'text-zinc-500 line-through dark:text-zinc-500')}>{task.body}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {task.subject !== null ? <SubjectLink subject={task.subject} /> : null}
          {done && task.completedAt !== null ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Done {formatDate(task.completedAt)}</span>
          ) : task.dueOn !== null ? (
            <DueLabel dueOn={task.dueOn} done={done} />
          ) : null}
          {!done && task.dueOn !== null && (daysUntil(task.dueOn) ?? 0) <= -7 ? (
            <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{formatDay(task.dueOn)}</span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Delete “${task.body}”`}
        className={buttonClassName({
          variant: 'ghost',
          size: 'sm',
          className: 'size-7 px-0 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100',
        })}
        onClick={() => router.delete(href(paths.activity, { activity: task.id }), { preserveScroll: true })}
      >
        <Trash2 aria-hidden="true" />
      </button>
    </li>
  )
}

function QuickAdd() {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm<FormInput<typeof TaskForm>>({
    body: '',
    dueOn: null,
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    post(paths.tasks, { preserveScroll: true, onSuccess: () => reset() })
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-xs sm:flex-row sm:items-start dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor="task-body" className="sr-only">
          New task
        </label>
        <input
          id="task-body"
          name="body"
          autoComplete="off"
          maxLength={2000}
          placeholder="Add a task…"
          value={data.body}
          disabled={processing}
          className={cn(fieldControlClassName, 'h-10')}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? 'task-body-error' : undefined}
          onChange={(event) => {
            setData('body', event.target.value)
            clearErrors('body')
          }}
        />
        <FieldError id="task-body-error" message={errors.body} />
      </div>
      <div className="flex gap-2">
        <label htmlFor="task-due" className="sr-only">
          Due
        </label>
        <input
          id="task-due"
          type="date"
          name="dueOn"
          value={data.dueOn ?? ''}
          disabled={processing}
          className={cn(fieldControlClassName, 'h-10 w-auto flex-1 sm:flex-none')}
          onChange={(event) => setData('dueOn', event.target.value === '' ? null : event.target.value)}
        />
        <button type="submit" disabled={processing} className={buttonClassName()}>
          <Plus aria-hidden="true" />
          Add
        </button>
      </div>
    </form>
  )
}

const tabClassName =
  'flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-zinc-600 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-orange-600 aria-[current=page]:bg-white aria-[current=page]:text-zinc-950 aria-[current=page]:shadow-xs dark:text-zinc-400 dark:hover:text-white dark:aria-[current=page]:bg-zinc-800 dark:aria-[current=page]:text-white'

/** Every task, from every deal, contact and company, in one list. */
const TasksIndex: WebPage<'Tasks/Index'> = ({ tasks, show, openCount, doneCount }) => {
  const groups = show === 'open' ? groupByDue(tasks) : [{ key: 'done', title: 'Done', tasks: [...tasks] }]

  return (
    <>
      <Head title="Tasks" />
      <Layout>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <PageHeader title="Tasks" description="Tasks from every deal, contact and company, and your own." />

          <nav aria-label="Tasks" className="flex w-fit gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
            <Link href={paths.tasks} className={tabClassName} aria-current={show === 'open' ? 'page' : undefined}>
              Open <span className="text-xs text-zinc-500 tabular-nums">{openCount}</span>
            </Link>
            <Link
              href={href(paths.tasks, {}, { show: 'done' })}
              className={tabClassName}
              aria-current={show === 'done' ? 'page' : undefined}
            >
              Done <span className="text-xs text-zinc-500 tabular-nums">{doneCount}</span>
            </Link>
          </nav>

          {show === 'open' ? <QuickAdd /> : null}

          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckCheck}
              title={show === 'open' ? 'All caught up' : 'Nothing done yet'}
              description={
                show === 'open'
                  ? 'Add a task above, or from any deal, contact or company’s timeline.'
                  : 'Tasks you tick off show up here.'
              }
              action={
                show === 'open' ? (
                  <Link href={paths.pipeline} className={buttonClassName({ variant: 'secondary' })}>
                    Open the pipeline
                  </Link>
                ) : (
                  <Link href={paths.tasks} className={buttonClassName({ variant: 'secondary' })}>
                    See open tasks
                  </Link>
                )
              }
            />
          ) : (
            groups.map((group) => (
              <section key={group.key} aria-labelledby={`tasks-${group.key}`}>
                <h2
                  id={`tasks-${group.key}`}
                  className={cn(
                    'mb-2 flex items-center gap-2 text-sm font-semibold',
                    group.key === 'overdue' && 'text-red-700 dark:text-red-400'
                  )}
                >
                  {group.title}
                  <span className="text-xs font-medium text-zinc-500 tabular-nums">{group.tasks.length}</span>
                </h2>
                <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-xs dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                  {group.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </Layout>
    </>
  )
}

export default TasksIndex
