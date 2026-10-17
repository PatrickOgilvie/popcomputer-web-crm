import { Head, useForm } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { WebPage } from '@popcomputer/web/react'

import CompanyFormFields, { type CompanyFormValues } from '~/components/CompanyFormFields'
import FormCard from '~/components/FormCard'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import { paths } from '~/paths'

/** Changes a company, through the `updateCompany` action. */
const EditCompany: WebPage<'Companies/Edit'> = ({ company }) => {
  const companyPath = href(paths.company, { company: company.id })
  const { data, setData, put, processing, errors, clearErrors } = useForm<CompanyFormValues>({
    name: company.name,
    website: company.website,
    industry: company.industry,
    notes: company.notes,
  })

  function updateField<Field extends keyof CompanyFormValues>(field: Field, value: CompanyFormValues[Field]) {
    setData((current) => ({ ...current, [field]: value }))
    clearErrors(field)
  }

  return (
    <>
      <Head title={`Edit ${company.name}`} />
      <Layout>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <PageHeader
            title="Edit company"
            breadcrumbs={[
              { label: 'Companies', href: paths.companies },
              { label: company.name, href: companyPath },
              { label: 'Edit' },
            ]}
          />
          <FormCard
            errors={errors}
            processing={processing}
            cancelHref={companyPath}
            submitLabel="Save company"
            busyLabel="Saving…"
            onSubmit={() => put(companyPath)}
          >
            <CompanyFormFields data={data} errors={errors} onChange={updateField} />
          </FormCard>
        </div>
      </Layout>
    </>
  )
}

export default EditCompany
