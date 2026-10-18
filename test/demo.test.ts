import { describe, expect, test } from 'bun:test'
import { href } from '@popcomputer/web/paths'
import { readPage, testBrowser, testClock, testEnv, type TestBrowser } from '@popcomputer/web/testing'
import { paths } from '../src/paths'
import worker from '../src/worker'
import { app, asksToSignIn, freshBindings, freshEnv, send, startDemo, visit } from './app'

const board = async (browser: TestBrowser) =>
  (await readPage(await browser.request(paths.pipeline, visit), 'Deals/Board')).props.deals

describe('the demo', () => {
  test('the sign-in page starts the demo, and nobody registers', async () => {
    const guest = testBrowser(app, await freshEnv())

    await readPage(await guest.request(paths.login, visit), 'Auth/Login')
    expect((await guest.request('/register', visit)).status).toBe(404)
  })

  test('starting it signs a guest in, with a sample CRM of their own', async () => {
    const browser = await startDemo(await freshEnv())
    const dashboard = await readPage(await browser.request(paths.dashboard, visit), 'Dashboard')

    expect(dashboard.props.auth.user?.isAnonymous).toBe(true)
    expect(dashboard.props.auth.user?.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    expect(dashboard.props.contactCount).toBe(11)
    expect(dashboard.props.companyCount).toBe(7)
    expect(await board(browser)).toHaveLength(14)
  })

  test('each guest’s CRM is their own', async () => {
    const env = await freshEnv()
    const first = await startDemo(env)
    const second = await startDemo(env)
    const [deal] = await board(first)

    await first.request(href(paths.deal, { deal: deal?.id ?? '' }), send('DELETE'))

    expect(await board(first)).toHaveLength(13)
    expect(await board(second)).toHaveLength(14)
    expect((await second.request(href(paths.deal, { deal: deal?.id ?? '' }), visit)).status).toBe(404)
  })

  test('a visitor who opened a page first lands on it once the demo starts', async () => {
    const browser = testBrowser(app, await freshEnv())
    const asked = await browser.request(paths.tasks)

    expect(asked.headers.get('Location')).toBe('/login?redirect=%2Ftasks')
    await readPage(await browser.follow(asked), 'Auth/Login')

    const res = await browser.request(paths.login, send('POST'))

    expect(res.headers.get('Location')).toBe(paths.tasks)
  })

  test('signing out ends the guest’s session', async () => {
    const browser = await startDemo(await freshEnv())
    const res = await browser.request(paths.logout, send('POST'))

    expect(res.headers.get('Location')).toBe(paths.login)
    expect(asksToSignIn(await browser.request(paths.dashboard))).toBe(true)
  })

  test('guests are swept away after a week, with their CRM', async () => {
    const bindings = await freshBindings()
    const keeps = await startDemo(testEnv(bindings))
    const time = await testClock(Date.now() + 8 * 24 * 60 * 60 * 1000)

    await worker.scheduled({ cron: '0 3 * * *', scheduledTime: Date.now() }, testEnv(time.layer, bindings))

    expect(asksToSignIn(await keeps.request(paths.dashboard))).toBe(true)
    const rows = await bindings.DB.prepare('SELECT (SELECT count(*) FROM user) AS users, (SELECT count(*) FROM deals) AS deals').first()

    expect(rows).toEqual({ users: 0, deals: 0 })
  })
})
