import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

import { cn } from '~/components/cn'
import FieldError from '~/components/FieldError'
import { fieldControlClassName, fieldHintClassName, fieldLabelClassName } from '~/components/fieldStyles'

/** Marks a field the form can be sent without. */
export function OptionalMark() {
  return <span className="font-normal text-zinc-500 dark:text-zinc-400">(optional)</span>
}

function describedBy(...ids: ReadonlyArray<string | false | undefined>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly optional?: boolean
}

/** A labelled textarea with the same help and error states as a text field. */
export function TextAreaField({ label, error, hint, optional = false, id: providedId, ...props }: TextAreaFieldProps) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={fieldLabelClassName}>
        {label} {optional ? <OptionalMark /> : null}
      </label>
      <textarea
        {...props}
        id={id}
        className={cn(fieldControlClassName, 'min-h-24 resize-y py-2 text-pretty')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
      />
      {hint ? (
        <p id={`${id}-hint`} className={fieldHintClassName}>
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  readonly label: string
  readonly error?: string
  readonly hint?: ReactNode
  readonly optional?: boolean
  readonly children: ReactNode
}

/** A labelled native select: the platform's own picker, on every device. */
export function SelectField({ label, error, hint, optional = false, id: providedId, children, ...props }: SelectFieldProps) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={fieldLabelClassName}>
        {label} {optional ? <OptionalMark /> : null}
      </label>
      <div className="relative">
        <select
          {...props}
          id={id}
          className={cn(fieldControlClassName, 'h-10 appearance-none pr-9')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hint !== undefined && `${id}-hint`, error && `${id}-error`)}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        />
      </div>
      {hint !== undefined ? (
        <p id={`${id}-hint`} className={fieldHintClassName}>
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
