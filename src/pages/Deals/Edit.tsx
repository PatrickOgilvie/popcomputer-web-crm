import { Head, useForm } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { WebPage } from '@popcomputer/web/react'

import DealFormFields, { type DealFormValues } from '~/components/DealFormFields'
import FormCard from '~/components/FormCard'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import { paths } from '~/paths'

/** Changes a deal, through the `updateDeal` action. */
const EditDeal: WebPage<'Deals/Edit'> = ({ deal, companies, contacts }) => {
  const dealPath = href(paths.deal, { deal: deal.id })
  const { data, setData, put, processing, errors, clearErrors } = useForm<DealFormValues>({
    title: deal.title,
    value: deal.value,
    stage: deal.stage,
    expectedCloseOn: deal.expectedCloseOn,
    companyId: deal.companyId,
    contactId: deal.contactId,
    notes: deal.notes,
  })

  function updateField<Field extends keyof DealFormValues>(field: Field, value: DealFormValues[Field]) {
    setData((current) => ({ ...current, [field]: value }))
    clearErrors(field)
  }

  return (
    <>
      <Head title={`Edit ${deal.title}`} />
      <Layout>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <PageHeader
            title="Edit deal"
            breadcrumbs={[
              { label: 'Pipeline', href: paths.pipeline },
              { label: deal.title, href: dealPath },
              { label: 'Edit' },
            ]}
          />
          <FormCard
            errors={errors}
            processing={processing}
            cancelHref={dealPath}
            submitLabel="Save deal"
            busyLabel="Saving…"
            onSubmit={() => put(dealPath)}
          >
            <DealFormFields data={data} errors={errors} companies={companies} contacts={contacts} onChange={updateField} />
          </FormCard>
        </div>
      </Layout>
    </>
  )
}

export default EditDeal
