import { Head, useForm } from '@inertiajs/react'
import type { WebPage } from '@popcomputer/web/react'

import ContactFormFields, { type ContactFormValues } from '~/components/ContactFormFields'
import FormCard from '~/components/FormCard'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import { paths } from '~/paths'

/** Adds a person, through the `createContact` action. */
const CreateContact: WebPage<'Contacts/Create'> = ({ companies, prefill }) => {
  const { data, setData, post, processing, errors, clearErrors } = useForm<ContactFormValues>({
    name: '',
    email: null,
    phone: null,
    title: null,
    companyId: prefill.companyId,
    notes: null,
  })

  function updateField<Field extends keyof ContactFormValues>(field: Field, value: ContactFormValues[Field]) {
    setData((current) => ({ ...current, [field]: value }))
    clearErrors(field)
  }

  return (
    <>
      <Head title="New contact" />
      <Layout>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <PageHeader title="New contact" breadcrumbs={[{ label: 'Contacts', href: paths.contacts }, { label: 'New' }]} />
          <FormCard
            errors={errors}
            processing={processing}
            cancelHref={paths.contacts}
            submitLabel="Add contact"
            busyLabel="Adding…"
            onSubmit={() => post(paths.contacts)}
          >
            <ContactFormFields data={data} errors={errors} companies={companies} onChange={updateField} />
          </FormCard>
        </div>
      </Layout>
    </>
  )
}

export default CreateContact
