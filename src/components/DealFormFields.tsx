import type { FormErrors, FormInput } from '@popcomputer/web/react'

import { OptionalMark, SelectField, TextAreaField } from '~/components/fields'
import { stages, stageStyles } from '~/components/stages'
import TextField from '~/components/TextField'
import type { DealForm } from '~/forms'

/** The fields the create and edit forms send, as their actions validate them. */
export type DealFormValues = FormInput<typeof DealForm>

interface Option {
  readonly id: string
  readonly name: string
}

interface DealFormFieldsProps {
  readonly data: DealFormValues
  readonly errors: FormErrors<typeof DealForm>
  readonly companies: ReadonlyArray<Option>
  readonly contacts: ReadonlyArray<Option & { readonly companyId: string | null }>
  readonly onChange: <Field extends keyof DealFormValues>(field: Field, value: DealFormValues[Field]) => void
}

/** A deal's fields: what it is, what it's worth, where it stands, and who it's with. */
export default function DealFormFields({ data, errors, companies, contacts, onChange }: DealFormFieldsProps) {
  // The chosen company's people first, then everyone else.
  const atCompany = data.companyId === null ? [] : contacts.filter((contact) => contact.companyId === data.companyId)
  const others = contacts.filter((contact) => !atCompany.includes(contact))

  function chooseCompany(companyId: string | null) {
    onChange('companyId', companyId)
    // A contact who works somewhere else goes with the old company.
    const contact = contacts.find((candidate) => candidate.id === data.contactId)
    if (companyId !== null && contact !== undefined && contact.companyId !== null && contact.companyId !== companyId) onChange('contactId', null)
  }

  function chooseContact(contactId: string | null) {
    onChange('contactId', contactId)
    const contact = contacts.find((candidate) => candidate.id === contactId)
    if (data.companyId === null && contact?.companyId) onChange('companyId', contact.companyId)
  }

  return (
    <>
      <TextField
        name="title"
        label="Title"
        autoComplete="off"
        maxLength={100}
        required
        value={data.title}
        error={errors.title}
        placeholder="Warehouse rollout"
        onChange={(event) => onChange('title', event.target.value)}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TextField
          name="value"
          label="Value (USD)"
          inputMode="numeric"
          autoComplete="off"
          value={String(data.value)}
          error={errors.value}
          onChange={(event) => onChange('value', event.target.value.replace(/[^\d]/g, ''))}
        />
        <SelectField
          name="stage"
          label="Stage"
          value={data.stage}
          error={errors.stage}
          onChange={(event) => onChange('stage', event.target.value as DealFormValues['stage'])}
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stageStyles[stage].label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SelectField
          name="companyId"
          label="Company"
          optional
          value={data.companyId ?? ''}
          error={errors.companyId}
          onChange={(event) => chooseCompany(event.target.value === '' ? null : event.target.value)}
        >
          <option value="">No company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="contactId"
          label="Contact"
          optional
          value={data.contactId ?? ''}
          error={errors.contactId}
          onChange={(event) => chooseContact(event.target.value === '' ? null : event.target.value)}
        >
          <option value="">No contact</option>
          {atCompany.length > 0 ? (
            <optgroup label="At this company">
              {atCompany.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {atCompany.length > 0 ? (
            <optgroup label="Everyone else">
              {others.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </optgroup>
          ) : (
            others.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))
          )}
        </SelectField>
      </div>

      <TextField
        name="expectedCloseOn"
        type="date"
        label="Expected to close"
        labelAside={<OptionalMark />}
        value={data.expectedCloseOn ?? ''}
        error={errors.expectedCloseOn}
        onChange={(event) => onChange('expectedCloseOn', event.target.value === '' ? null : event.target.value)}
      />

      <TextAreaField
        name="notes"
        label="Notes"
        optional
        rows={4}
        maxLength={2000}
        value={data.notes ?? ''}
        error={errors.notes}
        onChange={(event) => onChange('notes', event.target.value === '' ? null : event.target.value)}
      />
    </>
  )
}
