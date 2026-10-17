import { Head, Link } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { WebPage } from '@popcomputer/web/react'
import { Mail, Pencil, Phone } from 'lucide-react'

import Avatar from '~/components/Avatar'
import { buttonClassName } from '~/components/button'
import DangerZone from '~/components/DangerZone'
import DealList from '~/components/DealList'
import DetailList, { cardClassName, inlineLinkClassName, Missing } from '~/components/DetailList'
import { formatDate } from '~/components/format'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import Timeline from '~/components/Timeline'
import { paths } from '~/paths'

/** A person: how to reach them, their deals, and their timeline. */
const ShowContact: WebPage<'Contacts/Show'> = ({ contact, deals, activities }) => {
  const contactPath = href(paths.contact, { contact: contact.id })

  return (
    <>
      <Head title={contact.name} />
      <Layout>
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              <Avatar name={contact.name} size="lg" />
              <span className="min-w-0">{contact.name}</span>
            </span>
          }
          breadcrumbs={[{ label: 'Contacts', href: paths.contacts }, { label: contact.name }]}
          meta={
            contact.title !== null || contact.company !== null ? (
              <span>
                {contact.title}
                {contact.title !== null && contact.company !== null ? ' at ' : null}
                {contact.company !== null ? (
                  <Link href={href(paths.company, { company: contact.company.id })} className={inlineLinkClassName}>
                    {contact.company.name}
                  </Link>
                ) : null}
              </span>
            ) : undefined
          }
          actions={
            <>
              {contact.email !== null ? (
                <a href={`mailto:${contact.email}`} className={buttonClassName({ variant: 'secondary' })}>
                  <Mail aria-hidden="true" />
                  Email
                </a>
              ) : null}
              <Link href={href(paths.editContact, { contact: contact.id })} className={buttonClassName({ variant: 'secondary' })}>
                <Pencil aria-hidden="true" />
                Edit
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
            <Timeline activities={activities} logPath={href(paths.contactActivities, { contact: contact.id })} />
          </div>

          <div className="flex flex-col gap-6">
            <DetailList
              title="Details"
              rows={[
                [
                  'Email',
                  contact.email === null ? (
                    <Missing />
                  ) : (
                    <a href={`mailto:${contact.email}`} className={inlineLinkClassName}>
                      {contact.email}
                    </a>
                  ),
                ],
                [
                  'Phone',
                  contact.phone === null ? (
                    <Missing />
                  ) : (
                    <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className={`${inlineLinkClassName} inline-flex items-center gap-1`}>
                      <Phone className="size-3.5" aria-hidden="true" />
                      {contact.phone}
                    </a>
                  ),
                ],
                [
                  'Company',
                  contact.company === null ? (
                    <Missing />
                  ) : (
                    <Link href={href(paths.company, { company: contact.company.id })} className={inlineLinkClassName}>
                      {contact.company.name}
                    </Link>
                  ),
                ],
                ['Added', <span className="tabular-nums">{formatDate(contact.createdAt)}</span>],
              ]}
            />

            <DealList
              deals={deals}
              newDealHref={href(paths.newDeal, {}, { contactId: contact.id, companyId: contact.companyId })}
            />

            {contact.notes !== null ? (
              <section aria-labelledby="contact-notes" className={cardClassName}>
                <h2 id="contact-notes" className="text-sm font-semibold">
                  Notes
                </h2>
                <p className="mt-2 text-sm whitespace-pre-line text-pretty text-zinc-700 dark:text-zinc-300">{contact.notes}</p>
              </section>
            ) : null}

            <DangerZone
              label="Delete contact"
              name={contact.name}
              description="The contact and their timeline are removed. Their deals stay, without a contact. This can’t be undone."
              path={contactPath}
            />
          </div>
        </div>
      </Layout>
    </>
  )
}

export default ShowContact
