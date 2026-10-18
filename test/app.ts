import { expect } from 'bun:test'
import { Redacted } from 'effect'
import { signedIn, testBrowser, testEnv, testRateLimiter, type TestBrowser } from '@popcomputer/web/testing'
import { app } from '../src/app'
import { createDb } from '../src/db'
import { user } from '../src/schema'
import { paths } from '../src/paths'
import { databases } from './databases'
import '../src/routes'

export { app }

/** The Worker's bindings, with a new, empty D1 database. */
export async function freshBindings() {
  return {
    DB: await databases.fresh(),
    BETTER_AUTH_SECRET: 'test-only-secret-0123456789abcdef0123456789',
    SIGN_IN_LIMITER: testRateLimiter(),
    ENVIRONMENT: 'test' as const,
  }
}

export async function freshEnv() {
  return testEnv(await freshBindings())
}

export type Env = Awaited<ReturnType<typeof freshEnv>>

/** A request as Inertia sends a form: its fields as JSON. */
export function send(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', fields: Record<string, unknown> = {}): RequestInit {
  return {
    method,
    headers: { 'X-Inertia': 'true', 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  }
}

/** Whether a response sends the visitor to sign in. */
export function asksToSignIn(res: Response): boolean {
  return new URL(res.headers.get('Location') ?? '/', 'http://localhost').pathname === paths.login
}

/** A visit to a page, as Inertia makes it. */
export const visit: RequestInit = { headers: { 'X-Inertia': 'true' } }

/**
 * A member with an empty CRM: a user row of their own, signed in as their
 * session would sign them in. Each member's browser shares `env`'s database.
 */
export async function member(env: Env, name: string): Promise<TestBrowser> {
  if (env.DB === undefined) throw new Error('The test env has no DB.')
  const now = new Date()
  const row = {
    id: crypto.randomUUID(),
    name,
    email: `${name.toLowerCase()}@example.com`,
    emailVerified: false,
    image: null,
    createdAt: now,
    updatedAt: now,
    isAnonymous: false,
  }
  await createDb(env.DB).insert(user).values(row)
  const session = {
    id: `session-${row.id}`,
    token: Redacted.make(`token-${row.id}`),
    userId: row.id,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
    ipAddress: null,
    userAgent: null,
  }

  return testBrowser(app, testEnv(signedIn({ user: row, session }), env))
}

/** A visitor who starts the demo: a guest of their own, with the sample CRM. */
export async function startDemo(env: Env): Promise<TestBrowser> {
  const browser = testBrowser(app, env)
  const res = await browser.request(paths.login, send('POST'))

  expect(res.headers.get('Location')).toBe(paths.dashboard)

  return browser
}

/** The id at the end of a redirect to a record's page, such as `/deals/{deal}`. */
function createdId(res: Response, prefix: string): string {
  const location = res.headers.get('Location') ?? ''
  const match = new RegExp(`^${prefix}/([^/]+)$`).exec(location)

  expect(match).not.toBeNull()

  return match?.[1] ?? ''
}

/** Add a company through the form and return its id. */
export async function createCompany(browser: TestBrowser, fields: Record<string, unknown> = {}): Promise<string> {
  const res = await browser.request(paths.companies, send('POST', { name: 'Northwind', website: null, industry: null, notes: null, ...fields }))

  return createdId(res, paths.companies)
}

/** Add a contact through the form and return its id. */
export async function createContact(browser: TestBrowser, fields: Record<string, unknown> = {}): Promise<string> {
  const res = await browser.request(paths.contacts, send('POST', {
    name: 'Grace Hopper',
    email: null,
    phone: null,
    title: null,
    companyId: null,
    notes: null,
    ...fields,
  }))

  return createdId(res, paths.contacts)
}

/** Add a deal through the form and return its id. */
export async function createDeal(browser: TestBrowser, fields: Record<string, unknown> = {}): Promise<string> {
  const res = await browser.request(paths.pipeline, send('POST', {
    title: 'Rollout',
    value: 1000,
    stage: 'lead',
    expectedCloseOn: null,
    companyId: null,
    contactId: null,
    notes: null,
    ...fields,
  }))

  return createdId(res, paths.pipeline)
}
