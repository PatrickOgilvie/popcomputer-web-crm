import type { FormErrors, FormInput } from '@popcomputer/web/react'

import { OptionalMark, SelectField, TextAreaField } from '~/components/fields'
import TextField from '~/components/TextField'
import type { ContactForm } from '~/forms'

export type ContactFormValues = FormInput<typeof ContactForm>

interface ContactFormFieldsProps {
  readonly data: ContactFormValues
  readonly errors: FormErrors<typeof ContactForm>
  readonly companies: ReadonlyArray<{ readonly id: string; readonly name: string }>
  readonly onChange: <Field extends keyof ContactFormValues>(field: Field, value: ContactFormValues[Field]) => void
}

const orNull = (value: string) => (value === '' ? null : value)

/** A person's fields: who they are, where they work, and how to reach them. */
export default function ContactFormFields({ data, errors, companies, onChange }: ContactFormFieldsProps) {
  return (
    <>
      <TextField
        name="name"
        label="Name"
        autoComplete="off"
        maxLength={100}
        required
        value={data.name}
        error={errors.name}
        onChange={(event) => onChange('name', event.target.value)}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TextField
          name="title"
          label="Job title"
          labelAside={<OptionalMark />}
          autoComplete="off"
          maxLength={100}
          value={data.title ?? ''}
          error={errors.title}
          onChange={(event) => onChange('title', orNull(event.target.value))}
        />
        <SelectField
          name="companyId"
          label="Company"
          optional
          value={data.companyId ?? ''}
          error={errors.companyId}
          onChange={(event) => onChange('companyId', orNull(event.target.value))}
        >
          <option value="">No company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TextField
          name="email"
          type="email"
          label="Email"
          labelAside={<OptionalMark />}
          autoComplete="off"
          value={data.email ?? ''}
          error={errors.email}
          onChange={(event) => onChange('email', orNull(event.target.value))}
        />
        <TextField
          name="phone"
          type="tel"
          label="Phone"
          labelAside={<OptionalMark />}
          autoComplete="off"
          maxLength={40}
          value={data.phone ?? ''}
          error={errors.phone}
          onChange={(event) => onChange('phone', orNull(event.target.value))}
        />
      </div>

      <TextAreaField
        name="notes"
        label="Notes"
        optional
        rows={4}
        maxLength={2000}
        value={data.notes ?? ''}
        error={errors.notes}
        onChange={(event) => onChange('notes', orNull(event.target.value))}
      />
    </>
  )
}
