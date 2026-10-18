import { describe, expect, test } from 'bun:test'
import { href } from '@popcomputer/web/paths'
import { readPage, type TestBrowser } from '@popcomputer/web/testing'
import { paths } from '../src/paths'
import { createCompany, createContact, createDeal, freshEnv, member, send, visit } from './app'

async function board(browser: TestBrowser) {
  return (await readPage(await browser.request(paths.pipeline, visit), 'Deals/Board')).props.deals
}

/** Each column's deal titles, top to bottom, as the board shows them. */
async function columns(browser: TestBrowser): Promise<Record<string, Array<string>>> {
  const columns: Record<string, Array<string>> = {}
  for (const deal of await board(browser)) (columns[deal.stage] ??= []).push(deal.title)
  return columns
}

const move = (browser: TestBrowser, deal: string, stage: string, beforeId: string | null = null) =>
  browser.request(href(paths.dealStage, { deal }), send('PATCH', { stage, beforeId }))

describe('the pipeline', () => {
  test('a new deal opens with a message, and goes to the top of its column', async () => {
    const browser = await member(await freshEnv(), 'Ada')
    await createDeal(browser, { title: 'First', stage: 'qualified' })
    const res = await browser.request(paths.pipeline, send('POST', {
      title: 'Second',
      value: '25000',
      stage: 'qualified',
      expectedCloseOn: '2030-05-01',
      companyId: null,
      contactId: null,
      notes: null,
    }))
    const page = await readPage(await browser.follow(res), 'Deals/Show')

    expect(page.props.deal).toMatchObject({ title: 'Second', value: 25000, stage: 'qualified', expectedCloseOn: '2030-05-01' })
    expect(page.flash.success).toBe('Deal created.')
    expect((await columns(browser)).qualified).toEqual(['Second', 'First'])
  })

  test('a deal without a title, or with cents, goes back with the errors beside their fields', async () => {
    const browser = await member(await freshEnv(), 'Ada')
    const res = await browser.request(paths.pipeline, send('POST', {
      title: ' ',
      value: '12.50',
      stage: 'someday',
      expectedCloseOn: '2030-02-31',
      companyId: null,
      contactId: null,
      notes: null,
    }))
    const form = await readPage(await browser.follow(res), 'Deals/Create')

    expect(Object.keys(form.props.errors).sort()).toEqual(['expectedCloseOn', 'stage', 'title', 'value'])
  })

  test('dragging a deal to another stage puts it above the card it was dropped on', async () => {
    const browser = await member(await freshEnv(), 'Ada')
    const rollout = await createDeal(browser, { title: 'Rollout' })
    const pilot = await createDeal(browser, { title: 'Pilot', stage: 'proposal' })
    await createDeal(browser, { title: 'Renewal', stage: 'proposal' })

    const res = await move(browser, rollout, 'proposal', pilot)

    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe(paths.pipeline)
    expect(await columns(browser)).toEqual({ proposal: ['Renewal', 'Rollout', 'Pilot'] })
  })

  test('dropping a deal at the bottom of its own column reorders it', async () => {
    const browser = await member(await freshEnv(), 'Ada')
    await createDeal(browser, { title: 'C' })
    await createDeal(browser, { title: 'B' })
    const a = await createDeal(browser, { title: 'A' })

    await move(browser, a, 'lead')

    expect((await columns(browser)).lead).toEqual(['B', 'C', 'A'])
  })

  test('a deal is closed while it is won or lost, and open again once it moves back', async () => {
    const browser = await member(await freshEnv(), 'Ada')
    const id = await createDeal(browser)
    const show = async () => (await readPage(await browser.request(href(paths.deal, { deal: id }), visit), 'Deals/Show')).props.deal

    await move(browser, id, 'won')
    const won = await show()

    expect(won.stage).toBe('won')
    expect(won.closedAt).not.toBeNull()

    await move(browser, id, 'lost')

    expect((await show()).closedAt).toBe(won.closedAt)

    await move(browser, id, 'negotiation')

    expect((await show()).closedAt).toBeNull()
  })

  test('editing a deal can move it to another stage, at the top of that column', async () => {
    const browser = await member(await freshEnv(), 'Ada')
    await createDeal(browser, { title: 'Already there', stage: 'proposal' })
    const id = await createDeal(browser, { title: 'Rollout' })

    const res = await browser.request(href(paths.deal, { deal: id }), send('PUT', {
      title: 'Rollout, phase 1',
      value: 5000,
      stage: 'proposal',
      expectedCloseOn: null,
      companyId: null,
      contactId: null,
      notes: 'Phase 2 next year.',
    }))

    expect(res.headers.get('Location')).toBe(href(paths.deal, { deal: id }))
    expect((await columns(browser)).proposal).toEqual(['Rollout, phase 1', 'Already there'])
  })

  test('deleting a deal takes it off the board', async () => {
    const browser = await member(await freshEnv(), 'Ada')
    const id = await createDeal(browser)

    await browser.request(href(paths.deal, { deal: id }), send('DELETE'))

    expect(await board(browser)).toEqual([])
    expect((await browser.request(href(paths.deal, { deal: id }), visit)).status).toBe(404)
  })

  test('a deal shows who it is with, and keeps going when they are deleted', async () => {
    const browser = await member(await freshEnv(), 'Ada')
    const company = await createCompany(browser, { name: 'Northwind' })
    const contact = await createContact(browser, { name: 'Grace', companyId: company })
    const id = await createDeal(browser, { companyId: company, contactId: contact })
    const show = async () => (await readPage(await browser.request(href(paths.deal, { deal: id }), visit), 'Deals/Show')).props.deal

    expect(await show()).toMatchObject({ company: { id: company, name: 'Northwind' }, contact: { id: contact, name: 'Grace' } })

    await browser.request(href(paths.company, { company }), send('DELETE'))

    expect(await show()).toMatchObject({ companyId: null, company: null, contact: { name: 'Grace' } })
  })
})

describe('another member’s records', () => {
  test('their deal is the same 404 as a missing one, to read, change, move, log on or delete', async () => {
    const env = await freshEnv()
    const ada = await member(env, 'Ada')
    const grace = await member(env, 'Grace')
    const id = await createDeal(ada, { title: 'Ada’s deal' })
    const deal = href(paths.deal, { deal: id })

    expect((await grace.request(deal, visit)).status).toBe(404)
    expect((await grace.request(href(paths.editDeal, { deal: id }), visit)).status).toBe(404)
    expect((await grace.request(deal, send('PUT', { title: 'Mine', value: 1, stage: 'won', expectedCloseOn: null, companyId: null, contactId: null, notes: null }))).status).toBe(404)
    expect((await move(grace, id, 'won')).status).toBe(404)
    expect((await grace.request(href(paths.dealActivities, { deal: id }), send('POST', { kind: 'note', body: 'Hi', dueOn: null }))).status).toBe(404)
    expect((await grace.request(deal, send('DELETE'))).status).toBe(404)
    expect(await board(grace)).toEqual([])
    expect((await readPage(await ada.request(deal, visit), 'Deals/Show')).props.deal).toMatchObject({ title: 'Ada’s deal', stage: 'lead' })
  })

  test('a deal can’t name their company or their contact: the database refuses it beside the field', async () => {
    const env = await freshEnv()
    const ada = await member(env, 'Ada')
    const grace = await member(env, 'Grace')
    const theirCompany = await createCompany(grace, { name: 'Grace’s company' })
    const theirContact = await createContact(grace, { name: 'Grace’s contact' })

    const company = await ada.request(paths.pipeline, send('POST', {
      title: 'Sneaky', value: 1, stage: 'lead', expectedCloseOn: null, companyId: theirCompany, contactId: null, notes: null,
    }))
    const companyForm = await readPage(await ada.follow(company), 'Deals/Create')

    expect(companyForm.props.errors).toEqual({ companyId: 'Choose one of your companies.' })

    const contact = await ada.request(paths.pipeline, send('POST', {
      title: 'Sneaky', value: 1, stage: 'lead', expectedCloseOn: null, companyId: null, contactId: theirContact, notes: null,
    }))
    const contactForm = await readPage(await ada.follow(contact), 'Deals/Create')

    expect(contactForm.props.errors).toEqual({ contactId: 'Choose one of your contacts.' })
    expect(await board(ada)).toEqual([])

    const own = await createDeal(ada)
    // From its edit form, which a failed save goes back to.
    await ada.request(href(paths.editDeal, { deal: own }), visit)
    const update = await ada.request(href(paths.deal, { deal: own }), send('PUT', {
      title: 'Sneaky', value: 1, stage: 'lead', expectedCloseOn: null, companyId: theirCompany, contactId: null, notes: null,
    }))

    expect((await readPage(await ada.follow(update), 'Deals/Edit')).props.errors).toEqual({ companyId: 'Choose one of your companies.' })
    expect((await readPage(await ada.request(href(paths.deal, { deal: own }), visit), 'Deals/Show')).props.deal.companyId).toBeNull()
  })

  test('the owner a form names is ignored: a deal belongs to the member who made it', async () => {
    const env = await freshEnv()
    const ada = await member(env, 'Ada')
    const grace = await member(env, 'Grace')
    const graceId = (await readPage(await grace.request(paths.dashboard, visit), 'Dashboard')).props.auth.user?.id
    const id = await createDeal(ada, { userId: graceId })

    expect((await ada.request(href(paths.deal, { deal: id }), visit)).status).toBe(200)
    expect((await grace.request(href(paths.deal, { deal: id }), visit)).status).toBe(404)
  })
})

describe('the dashboard', () => {
  test('totals the member’s own open pipeline by stage, and what they won', async () => {
    const env = await freshEnv()
    const ada = await member(env, 'Ada')
    const grace = await member(env, 'Grace')
    await createDeal(ada, { value: 1000, stage: 'lead' })
    await createDeal(ada, { value: 2500, stage: 'lead' })
    await createDeal(ada, { value: 4000, stage: 'negotiation' })
    await createDeal(ada, { value: 9000, stage: 'won' })
    await createDeal(ada, { value: 500, stage: 'lost' })
    await createDeal(grace, { value: 99_000, stage: 'lead' })
    await createContact(ada)

    const dashboard = (await readPage(await ada.request(paths.dashboard, visit), 'Dashboard')).props

    expect(dashboard.stages).toEqual([
      { stage: 'lead', count: 2, value: 3500 },
      { stage: 'qualified', count: 0, value: 0 },
      { stage: 'proposal', count: 0, value: 0 },
      { stage: 'negotiation', count: 1, value: 4000 },
    ])
    expect(dashboard.wonLast30Days).toEqual({ count: 1, value: 9000 })
    expect(dashboard.contactCount).toBe(1)
  })
})
