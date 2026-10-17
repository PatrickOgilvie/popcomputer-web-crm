import { Link } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { PagePropsFor } from '@popcomputer/web/react'
import { Building2, KanbanSquare, User } from 'lucide-react'

import { paths } from '~/paths'

type Subject = NonNullable<PagePropsFor<'Tasks/Index'>['tasks'][number]['subject']>

const icons = { deal: KanbanSquare, contact: User, company: Building2 } as const

function subjectHref(subject: Subject): string {
  switch (subject.type) {
    case 'deal':
      return href(paths.deal, { deal: subject.id })
    case 'contact':
      return href(paths.contact, { contact: subject.id })
    case 'company':
      return href(paths.company, { company: subject.id })
  }
}

/** The deal, contact or company an activity was logged on. */
export default function SubjectLink({ subject }: { readonly subject: Subject }) {
  const Icon = icons[subject.type]

  return (
    <Link
      href={subjectHref(subject)}
      className="relative inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm text-xs font-medium text-zinc-600 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-orange-600 dark:text-zinc-400 dark:hover:text-white"
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{subject.name}</span>
    </Link>
  )
}
