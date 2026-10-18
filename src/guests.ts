// Guests: each visitor who starts the demo gets an account of their own, with
// a friendly name and nothing to remember, which is swept away after a week.
import { and, eq, lt } from 'drizzle-orm'
import { DateTime, Duration, Effect } from 'effect'
import { dbMutation } from '@popcomputer/web/effect'
import { user } from './auth-schema'

/** How long a guest and their data last. */
export const GUEST_DAYS = 7

const adjectives = ['Brave', 'Bright', 'Calm', 'Clever', 'Curious', 'Eager', 'Gentle', 'Happy', 'Jolly', 'Keen', 'Lively', 'Lucky', 'Merry', 'Nimble', 'Quick', 'Sunny', 'Swift', 'Witty']
const animals = ['Badger', 'Falcon', 'Fox', 'Hare', 'Heron', 'Lynx', 'Otter', 'Owl', 'Panda', 'Puffin', 'Robin', 'Seal', 'Squirrel', 'Swan', 'Tiger', 'Wren']

function pick(words: ReadonlyArray<string>): string {
  const [random = 0] = crypto.getRandomValues(new Uint32Array(1))
  return words[random % words.length] ?? 'Guest'
}

/** A guest's name, such as Curious Otter: Better Auth's anonymous plugin asks for one per guest. */
export const guestName = (): string => `${pick(adjectives)} ${pick(animals)}`

/**
 * Deletes guests older than a week, and with them everything they made: each
 * table's rows reference their owner with ON DELETE CASCADE. The daily Cron
 * Trigger runs it.
 */
export const sweepGuests = Effect.gen(function* () {
  const cutoff = DateTime.toDateUtc(DateTime.subtractDuration(yield* DateTime.now, Duration.days(GUEST_DAYS)))

  yield* dbMutation((db) => db.delete(user).where(and(eq(user.isAnonymous, true), lt(user.createdAt, cutoff))))
})
