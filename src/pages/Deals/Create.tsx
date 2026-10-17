import { Head, useForm } from '@inertiajs/react'
import type { WebPage } from '@popcomputer/web/react'

import DealFormFields, { type DealFormValues } from '~/components/DealFormFields'
import FormCard from '~/components/FormCard'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import UnderTheHood, { Guarantee } from '~/components/UnderTheHood'
import { paths } from '~/paths'

/** Adds a deal to the pipeline, through the `createDeal` action. */
const CreateDeal: WebPage<'Deals/Create'> = ({ companies, contacts, prefill }) => {
  const { data, setData, post, processing, errors, clearErrors } = useForm<DealFormValues>({
    title: '',
    value: 0,
    stage: prefill.stage,
    expectedCloseOn: null,
    companyId: prefill.companyId,
    contactId: prefill.contactId,
    notes: null,
  })

  function updateField<Field extends keyof DealFormValues>(field: Field, value: DealFormValues[Field]) {
    setData((current) => ({ ...current, [field]: value }))
    clearErrors(field)
  }

  return (
    <>
      <Head title="New deal" />
      <Layout>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <PageHeader
            title="New deal"
            breadcrumbs={[{ label: 'Pipeline', href: paths.pipeline }, { label: 'New' }]}
            description="It goes to the top of its stage’s column."
          />
          <FormCard
            errors={errors}
            processing={processing}
            cancelHref={paths.pipeline}
            submitLabel="Create deal"
            busyLabel="Creating…"
            onSubmit={() => post(paths.pipeline)}
          >
            <DealFormFields data={data} errors={errors} companies={companies} contacts={contacts} onChange={updateField} />
          </FormCard>
          <UnderTheHood route="POST /deals" action="createDeal" compact>
            <Guarantee>
              The form names a company and a contact by id; a trigger refuses another member’s, shown beside its field by{' '}
              <code>constraintFieldErrors</code>.
            </Guarantee>
            <Guarantee>Its place at the top of the column is worked out in the insert itself.</Guarantee>
          </UnderTheHood>
        </div>
      </Layout>
    </>
  )
}

export default CreateDeal
