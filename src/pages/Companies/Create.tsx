import { Head, useForm } from '@inertiajs/react'
import type { WebPage } from '@popcomputer/web/react'

import CompanyFormFields, { type CompanyFormValues } from '~/components/CompanyFormFields'
import FormCard from '~/components/FormCard'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import { paths } from '~/paths'

/** Adds a company, through the `createCompany` action. */
const CreateCompany: WebPage<'Companies/Create'> = () => {
  const { data, setData, post, processing, errors, clearErrors } = useForm<CompanyFormValues>({
    name: '',
    website: null,
    industry: null,
    notes: null,
  })

  function updateField<Field extends keyof CompanyFormValues>(field: Field, value: CompanyFormValues[Field]) {
    setData((current) => ({ ...current, [field]: value }))
    clearErrors(field)
  }

  return (
    <>
      <Head title="New company" />
      <Layout>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <PageHeader title="New company" breadcrumbs={[{ label: 'Companies', href: paths.companies }, { label: 'New' }]} />
          <FormCard
            errors={errors}
            processing={processing}
            cancelHref={paths.companies}
            submitLabel="Add company"
            busyLabel="Adding…"
            onSubmit={() => post(paths.companies)}
          >
            <CompanyFormFields data={data} errors={errors} onChange={updateField} />
          </FormCard>
        </div>
      </Layout>
    </>
  )
}

export default CreateCompany
