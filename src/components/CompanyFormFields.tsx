import type { FormErrors, FormInput } from '@popcomputer/web/react'

import { OptionalMark, TextAreaField } from '~/components/fields'
import TextField from '~/components/TextField'
import type { CompanyForm } from '~/forms'

export type CompanyFormValues = FormInput<typeof CompanyForm>

interface CompanyFormFieldsProps {
  readonly data: CompanyFormValues
  readonly errors: FormErrors<typeof CompanyForm>
  readonly onChange: <Field extends keyof CompanyFormValues>(field: Field, value: CompanyFormValues[Field]) => void
}

const orNull = (value: string) => (value === '' ? null : value)

/** A company's fields. */
export default function CompanyFormFields({ data, errors, onChange }: CompanyFormFieldsProps) {
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
          name="website"
          type="url"
          label="Website"
          labelAside={<OptionalMark />}
          autoComplete="off"
          placeholder="https://"
          value={data.website ?? ''}
          error={errors.website}
          onChange={(event) => onChange('website', orNull(event.target.value))}
        />
        <TextField
          name="industry"
          label="Industry"
          labelAside={<OptionalMark />}
          autoComplete="off"
          maxLength={60}
          value={data.industry ?? ''}
          error={errors.industry}
          onChange={(event) => onChange('industry', orNull(event.target.value))}
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
