import { Link } from '@inertiajs/react'
import { useEffect, useRef } from 'react'
import type { FormEvent, ReactNode } from 'react'

import { buttonClassName } from '~/components/button'

interface FormCardProps {
  readonly errors: Readonly<Record<string, string | undefined>>
  readonly processing: boolean
  readonly cancelHref: string
  readonly submitLabel: string
  readonly busyLabel: string
  readonly onSubmit: () => void
  readonly children: ReactNode
}

/**
 * The card a create or edit form sits in: its fields, then Cancel and the
 * submit button. A failed submit moves focus to the first invalid field.
 */
export default function FormCard({
  errors,
  processing,
  cancelHref,
  submitLabel,
  busyLabel,
  onSubmit,
  children,
}: FormCardProps) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (Object.keys(errors).length === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
    >
      <fieldset disabled={processing} className="flex flex-col gap-6 p-5 sm:p-6">
        {children}
      </fieldset>
      <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-zinc-800">
        <Link href={cancelHref} className={buttonClassName({ variant: 'ghost' })}>
          Cancel
        </Link>
        <button type="submit" disabled={processing} aria-busy={processing} className={buttonClassName()}>
          <span aria-live="polite">{processing ? busyLabel : submitLabel}</span>
        </button>
      </div>
    </form>
  )
}
