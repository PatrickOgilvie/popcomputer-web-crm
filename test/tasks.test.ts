import { describe, expect, test } from 'bun:test'
import { href } from '@popcomputer/web/paths'
import { readPage, type TestBrowser } from '@popcomputer/web/testing'
import { paths } from '../src/paths'
import { createCompany, createContact, createDeal, freshEnv, register, send, visit } from './app'

const openTasks = async (browser: TestBrowser) =>
  (await readPage(await browser.request(paths.tasks, visit), 'Tasks/Index')).props

const doneTasks = async (browser: TestBrowser) =>
  (await readPage(await browser.request(href(paths.tasks, {}, { show: 'done' }), visit), 'Tasks/Index')).props

const dealTimeline = async (browser: TestBrowser, deal: string) =>
  (await readPage(await browser.request(href(paths.deal, { deal }), visit), 'Deals/Show')).props.activities

describe('the timeline', () => {
  test('logging on a deal goes back to it, newest first, with a message', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const deal = await createDeal(browser)
    const logs = href(paths.dealActivities, { deal })

    await browser.request(logs, send('POST', { kind: 'call', body: 'Intro call', dueOn: null }))
    const res = await browser.request(logs, send('POST', { kind: 'note', body: 'They want it by spring', dueOn: '2030-01-01' }))
    const page = await readPage(await browser.follow(res), 'Deals/Show')

    expect(page.flash.success).toBe('Note added.')
    expect(page.props.activities.map((activity) => [activity.kind, activity.body, activity.dueOn])).toEqual([
      ['note', 'They want it by spring', null],
      ['call', 'Intro call', null],
    ])
  })

  test('an empty entry goes back with the error beside it', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const deal = await createDeal(browser)
    await browser.request(href(paths.deal, { deal }), visit)

    const res = await browser.request(href(paths.dealActivities, { deal }), send('POST', { kind: 'note', body: '  ', dueOn: null }))

    expect((await readPage(await browser.follow(res), 'Deals/Show')).props.errors.body).toBeDefined()
  })

  test('contacts and companies have timelines of their own', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const contact = await createContact(browser)
    const company = await createCompany(browser)

    await browser.request(href(paths.contactActivities, { contact }), send('POST', { kind: 'email', body: 'Sent the deck', dueOn: null }))
    await browser.request(href(paths.companyActivities, { company }), send('POST', { kind: 'meeting', body: 'Quarterly review', dueOn: null }))

    const contactPage = await readPage(await browser.request(href(paths.contact, { contact }), visit), 'Contacts/Show')
    const companyPage = await readPage(await browser.request(href(paths.company, { company }), visit), 'Companies/Show')

    expect(contactPage.props.activities.map((activity) => activity.body)).toEqual(['Sent the deck'])
    expect(companyPage.props.activities.map((activity) => activity.body)).toEqual(['Quarterly review'])
  })

  test('deleting an entry removes it', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const deal = await createDeal(browser)
    await browser.request(href(paths.dealActivities, { deal }), send('POST', { kind: 'note', body: 'Oops', dueOn: null }))
    const [note] = await dealTimeline(browser, deal)

    await browser.request(href(paths.activity, { activity: note?.id ?? '' }), send('DELETE'))

    expect(await dealTimeline(browser, deal)).toEqual([])
  })
})

describe('tasks', () => {
  test('tasks from every record, and the member’s own, are listed by due day with what they’re on', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const deal = await createDeal(browser, { title: 'Rollout' })
    const contact = await createContact(browser, { name: 'Grace' })

    await browser.request(href(paths.dealActivities, { deal }), send('POST', { kind: 'task', body: 'Send the contract', dueOn: '2030-03-01' }))
    await browser.request(href(paths.contactActivities, { contact }), send('POST', { kind: 'task', body: 'Call Grace', dueOn: '2030-01-15' }))
    await browser.request(paths.tasks, send('POST', { body: 'Tidy the pipeline', dueOn: null }))

    const tasks = await openTasks(browser)

    expect(tasks.tasks.map((task) => [task.body, task.dueOn, task.subject])).toEqual([
      ['Call Grace', '2030-01-15', { type: 'contact', id: contact, name: 'Grace' }],
      ['Send the contract', '2030-03-01', { type: 'deal', id: deal, name: 'Rollout' }],
      ['Tidy the pipeline', null, null],
    ])
    expect(tasks.openCount).toBe(3)
  })

  test('ticking a task off moves it to done, and unticking opens it again', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    await browser.request(paths.tasks, send('POST', { body: 'Send the contract', dueOn: null }))
    const [task] = (await openTasks(browser)).tasks
    const path = href(paths.activity, { activity: task?.id ?? '' })

    const res = await browser.request(path, send('PATCH', { completed: true }))

    expect(res.headers.get('Location')).toBe(paths.tasks)
    expect((await openTasks(browser)).tasks).toEqual([])
    expect((await doneTasks(browser)).tasks.map((done) => [done.body, done.completedAt !== null])).toEqual([['Send the contract', true]])

    await browser.request(path, send('PATCH', { completed: false }))

    expect((await openTasks(browser)).tasks.map((open) => open.body)).toEqual(['Send the contract'])
  })

  test('a note can’t be ticked off: only tasks are done', async () => {
    const browser = await register(await freshEnv(), 'Ada')
    const deal = await createDeal(browser)
    await browser.request(href(paths.dealActivities, { deal }), send('POST', { kind: 'note', body: 'Just a note', dueOn: null }))
    const [note] = await dealTimeline(browser, deal)

    await browser.request(href(paths.activity, { activity: note?.id ?? '' }), send('PATCH', { completed: true }))

    expect((await dealTimeline(browser, deal))[0]?.completedAt).toBeNull()
  })

  test('another member’s task is a 404, and their tasks aren’t listed', async () => {
    const env = await freshEnv()
    const ada = await register(env, 'Ada')
    const grace = await register(env, 'Grace')
    await ada.request(paths.tasks, send('POST', { body: 'Ada’s task', dueOn: null }))
    const [task] = (await openTasks(ada)).tasks
    const path = href(paths.activity, { activity: task?.id ?? '' })

    expect((await openTasks(grace)).tasks).toEqual([])
    expect((await grace.request(path, send('PATCH', { completed: true }))).status).toBe(404)
    expect((await grace.request(path, send('DELETE'))).status).toBe(404)
    expect((await openTasks(ada)).tasks.map((open) => open.body)).toEqual(['Ada’s task'])
  })
})
