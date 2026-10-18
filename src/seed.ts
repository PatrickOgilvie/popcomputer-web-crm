/**
 * `bun run db:seed` leaves the local database empty: each visitor who starts
 * the demo gets the sample CRM in src/demo.ts as their own, here as on
 * Cloudflare.
 */
export async function seed(): Promise<void> {
  console.log('Open the app and choose Start the demo: each guest gets the sample CRM in src/demo.ts.')
}
