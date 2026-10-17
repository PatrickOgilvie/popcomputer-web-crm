import { Head, Link } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { WebPage } from '@popcomputer/web/react'
import { Plus, SearchX, UserPlus } from 'lucide-react'

import Avatar from '~/components/Avatar'
import { buttonClassName } from '~/components/button'
import EmptyState from '~/components/EmptyState'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import SearchField from '~/components/SearchField'
import UnderTheHood, { Guarantee } from '~/components/UnderTheHood'
import { paths } from '~/paths'

/** The member's people, searchable by name, email, title or company. */
const ContactsIndex: WebPage<'Contacts/Index'> = ({ contacts, q, total }) => {
  const newContact = (
    <Link href={paths.newContact} className={buttonClassName()}>
      <Plus aria-hidden="true" />
      New contact
    </Link>
  )

  return (
    <>
      <Head title="Contacts" />
      <Layout>
        <PageHeader
          title="Contacts"
          meta={
            total > 0 ? (
              <span className="tabular-nums">
                {q === null ? `${total} ${total === 1 ? 'person' : 'people'}` : `${contacts.length} of ${total} match`}
              </span>
            ) : undefined
          }
          actions={total > 0 ? newContact : undefined}
        />

        {total === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Add your first contact"
            description="The people you sell to, with the company they work at and how to reach them."
            action={
              <Link href={paths.newContact} className={buttonClassName()}>
                Add a contact
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            <SearchField path={paths.contacts} query={q} label="Search contacts" placeholder="Search people, companies…" />

            {contacts.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="Nobody matches"
                description={`No contact’s name, email, title or company has “${q ?? ''}” in it.`}
                action={
                  <Link href={paths.contacts} className={buttonClassName({ variant: 'secondary' })}>
                    Show everyone
                  </Link>
                }
              />
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div
                  className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_7rem] gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-2.5 text-xs font-medium text-zinc-500 md:grid dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                  aria-hidden="true"
                >
                  <span>Name</span>
                  <span>Company</span>
                  <span>Email</span>
                  <span className="text-right">Open deals</span>
                </div>
                <ul aria-label="Contacts" className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {contacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-zinc-50 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_7rem] dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={contact.name} />
                        <div className="min-w-0">
                          <Link
                            href={href(paths.contact, { contact: contact.id })}
                            className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-orange-600"
                          >
                            {contact.name}
                          </Link>
                          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                            {contact.title ?? <span className="md:hidden">{contact.companyName}</span>}
                          </p>
                        </div>
                      </div>
                      <span className="hidden truncate text-sm text-zinc-700 md:block dark:text-zinc-300">
                        {contact.companyName ?? <span className="text-zinc-400 dark:text-zinc-500">—</span>}
                      </span>
                      <span className="hidden truncate text-sm text-zinc-600 md:block dark:text-zinc-400">
                        {contact.email ?? <span className="text-zinc-400 dark:text-zinc-500">—</span>}
                      </span>
                      <span className="text-right text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
                        {contact.openDealCount > 0 ? (
                          <>
                            {contact.openDealCount}
                            <span className="md:hidden"> open</span>
                          </>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500">—</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <UnderTheHood route="GET /contacts" action="listContacts">
          <Guarantee>
            The search arrives through <code>validateRequest(Search)</code>, like a form: an unexpected value is a 422.
          </Guarantee>
          <Guarantee>Its % and _ are matched as themselves, so a search can’t widen itself.</Guarantee>
          <Guarantee>Every read is scoped to the signed-in member.</Guarantee>
        </UnderTheHood>
      </Layout>
    </>
  )
}

export default ContactsIndex
