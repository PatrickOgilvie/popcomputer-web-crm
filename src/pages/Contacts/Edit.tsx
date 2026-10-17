import { Head, useForm } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { WebPage } from '@popcomputer/web/react'

import ContactFormFields, { type ContactFormValues } from '~/components/ContactFormFields'
import FormCard from '~/components/FormCard'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import { paths } from '~/paths'

/** Changes a person, through the `updateContact` action. */
const EditContact: WebPage<'Contacts/Edit'> = ({ contact, companies }) => {
  const contactPath = href(paths.contact, { contact: contact.id })
  const { data, setData, put, processing, errors, clearErrors } = useForm<ContactFormValues>({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    title: contact.title,
    companyId: contact.companyId,
    notes: contact.notes,
  })

  function updateField<Field extends keyof ContactFormValues>(field: Field, value: ContactFormValues[Field]) {
    setData((current) => ({ ...current, [field]: value }))
    clearErrors(field)
  }

  return (
    <>
      <Head title={`Edit ${contact.name}`} />
      <Layout>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <PageHeader
            title="Edit contact"
            breadcrumbs={[
              { label: 'Contacts', href: paths.contacts },
              { label: contact.name, href: contactPath },
              { label: 'Edit' },
            ]}
          />
          <FormCard
            errors={errors}
            processing={processing}
            cancelHref={contactPath}
            submitLabel="Save contact"
            busyLabel="Saving…"
            onSubmit={() => put(contactPath)}
          >
            <ContactFormFields data={data} errors={errors} companies={companies} onChange={updateField} />
          </FormCard>
        </div>
      </Layout>
    </>
  )
}

export default EditContact
