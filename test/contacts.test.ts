import { describe, expect, test } from 'bun:test'
import { href } from '@popcomputer/web/paths'
import { readPage, type TestBrowser } from '@popcomputer/web/testing'
import { paths } from '../src/paths'
import { createCompany, createContact, createDeal, freshEnv, register, send, visit } from './app'

const search = async (browser: TestBrowser, path: typeof paths.contacts, q: string) =>
  (await readPage(await browser.request(href(path, {}, { q }), visit), 'Contacts/Index')).props

describe('contacts', () => {
  test('a contact at a company shows on the company’s page, with their deals', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const company = await createCompany(browser, { name: 'Northwind', industry: 'Wholesale' })
    const res = await browser.request(paths.contacts, send('POST', {
      name: 'Grace Hopper',
      email: 'GRACE@northwind.example ',
      phone: '+1 555 0101',
      title: 'Head of Operations',
      companyId: company,
      notes: null,
    }))
    const page = await readPage(await browser.follow(res), 'Contacts/Show')

    expect(page.props.contact).toMatchObject({
      name: 'Grace Hopper',
      email: 'grace@northwind.example',
      company: { id: company, name: 'Northwind' },
    })
    expect(page.flash.success).toBe('Contact added.')

    await createDeal(browser, { title: 'Rollout', value: 4000, companyId: company, contactId: page.props.contact.id })
    const shown = await readPage(await browser.request(href(paths.company, { company }), visit), 'Companies/Show')

    expect(shown.props.contacts.map((contact) => contact.name)).toEqual(['Grace Hopper'])
    expect(shown.props.deals.map((deal) => deal.title)).toEqual(['Rollout'])

    const contactPage = await readPage(await browser.request(href(paths.contact, { contact: page.props.contact.id }), visit), 'Contacts/Show')

    expect(contactPage.props.deals.map((deal) => deal.title)).toEqual(['Rollout'])
  })

  test('the list searches names, emails, titles and companies, and counts open deals', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const northwind = await createCompany(browser, { name: 'Northwind' })
    const grace = await createContact(browser, { name: 'Grace Hopper', companyId: northwind })
    await createContact(browser, { name: 'Alan Turing', email: 'alan@bletchley.example' })
    await createContact(browser, { name: 'Katherine Johnson', title: 'Flight engineer' })
    await createDeal(browser, { contactId: grace })
    await createDeal(browser, { contactId: grace, stage: 'won' })

    const all = await readPage(await browser.request(paths.contacts, visit), 'Contacts/Index')

    expect(all.props.contacts.map((contact) => [contact.name, contact.openDealCount])).toEqual([
      ['Alan Turing', 0],
      ['Grace Hopper', 1],
      ['Katherine Johnson', 0],
    ])
    expect((await search(browser, paths.contacts, 'north')).contacts.map((contact) => contact.name)).toEqual(['Grace Hopper'])
    expect((await search(browser, paths.contacts, 'bletchley')).contacts.map((contact) => contact.name)).toEqual(['Alan Turing'])
    expect((await search(browser, paths.contacts, 'ENGINEER')).contacts.map((contact) => contact.name)).toEqual(['Katherine Johnson'])
  })

  test('a search’s % and _ match only themselves', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    await createContact(browser, { name: 'Grace Hopper' })
    await createContact(browser, { name: '100% Grace' })

    const percent = await search(browser, paths.contacts, '%')
    const underscore = await search(browser, paths.contacts, '_')

    expect(percent.contacts.map((contact) => contact.name)).toEqual(['100% Grace'])
    expect(percent.total).toBe(2)
    expect(underscore.contacts).toEqual([])
  })

  test('editing a contact can move them to another company, or none', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const company = await createCompany(browser)
    const id = await createContact(browser)
    const contact = href(paths.contact, { contact: id })
    const save = (companyId: string | null) =>
      browser.request(contact, send('PUT', { name: 'Grace', email: null, phone: null, title: null, companyId, notes: 'Met at a trade show.' }))

    await save(company)

    expect((await readPage(await browser.request(contact, visit), 'Contacts/Show')).props.contact.company?.id).toBe(company)

    await save(null)
    const shown = await readPage(await browser.request(contact, visit), 'Contacts/Show')

    expect(shown.props.contact).toMatchObject({ name: 'Grace', companyId: null, company: null, notes: 'Met at a trade show.' })
  })

  test('deleting a contact keeps their deals', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const contact = await createContact(browser)
    const deal = await createDeal(browser, { contactId: contact })

    const res = await browser.request(href(paths.contact, { contact }), send('DELETE'))

    expect(res.headers.get('Location')).toBe(paths.contacts)
    expect((await readPage(await browser.request(href(paths.deal, { deal }), visit), 'Deals/Show')).props.deal.contact).toBeNull()
  })

  test('another member’s contact is a 404, and a contact can’t name their company', async () => {
    const env = await freshEnv()
    const ada = await register(env, 'Ada')
    const grace = await register(env, 'Grace')
    const theirs = await createContact(grace)
    const theirCompany = await createCompany(grace)

    expect((await ada.request(href(paths.contact, { contact: theirs }), visit)).status).toBe(404)
    expect((await ada.request(href(paths.contact, { contact: theirs }), send('DELETE'))).status).toBe(404)

    await ada.request(paths.newContact, visit)
    const res = await ada.request(paths.contacts, send('POST', {
      name: 'Sneaky', email: null, phone: null, title: null, companyId: theirCompany, notes: null,
    }))
    const form = await readPage(await ada.follow(res), 'Contacts/Create')

    expect(form.props.errors).toEqual({ companyId: 'Choose one of your companies.' })
    expect((await readPage(await ada.request(paths.contacts, visit), 'Contacts/Index')).props.total).toBe(0)
  })
})

describe('companies', () => {
  test('the list counts each company’s people and open pipeline, and searches industries', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const northwind = await createCompany(browser, { name: 'Northwind', industry: 'Wholesale' })
    await createCompany(browser, { name: 'Globex', industry: 'Manufacturing', website: 'https://globex.example' })
    await createContact(browser, { companyId: northwind })
    await createContact(browser, { name: 'Alan', companyId: northwind })
    await createDeal(browser, { value: 1000, companyId: northwind })
    await createDeal(browser, { value: 2000, companyId: northwind, stage: 'proposal' })
    await createDeal(browser, { value: 5000, companyId: northwind, stage: 'lost' })

    const list = await readPage(await browser.request(paths.companies, visit), 'Companies/Index')

    expect(list.props.companies.map((company) => [company.name, company.contactCount, company.openDealCount, company.openDealValue])).toEqual([
      ['Globex', 0, 0, 0],
      ['Northwind', 2, 2, 3000],
    ])

    const found = await readPage(await browser.request(href(paths.companies, {}, { q: 'manufact' }), visit), 'Companies/Index')

    expect(found.props.companies.map((company) => company.name)).toEqual(['Globex'])
  })

  test('a website must be a web address', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    await browser.request(paths.newCompany, visit)
    const res = await browser.request(paths.companies, send('POST', { name: 'Northwind', website: 'javascript:alert(1)', industry: null, notes: null }))
    const form = await readPage(await browser.follow(res), 'Companies/Create')

    expect(form.props.errors.website).toBeDefined()
  })

  test('another member’s company is a 404, to read, change or delete', async () => {
    const env = await freshEnv()
    const ada = await register(env, 'Ada')
    const grace = await register(env, 'Grace')
    const id = await createCompany(ada)
    const company = href(paths.company, { company: id })

    expect((await grace.request(company, visit)).status).toBe(404)
    expect((await grace.request(href(paths.editCompany, { company: id }), visit)).status).toBe(404)
    expect((await grace.request(company, send('PUT', { name: 'Mine', website: null, industry: null, notes: null }))).status).toBe(404)
    expect((await grace.request(company, send('DELETE'))).status).toBe(404)
    expect((await readPage(await ada.request(company, visit), 'Companies/Show')).props.company.name).toBe('Northwind')
  })
})
