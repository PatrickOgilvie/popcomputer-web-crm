import { useForm } from '@inertiajs/react'
import { useState } from 'react'

import { buttonClassName } from '~/components/button'
import ConfirmationDialog from '~/components/ConfirmationDialog'

interface DangerZoneProps {
  /** What's deleted, as the button names it: `Delete deal`. */
  readonly label: string
  readonly name: string
  readonly description: string
  readonly path: string
}

/** A card that deletes the record its page shows, once confirmed. */
export default function DangerZone({ label, name, description, path }: DangerZoneProps) {
  const { delete: destroy, processing } = useForm({})
  const [confirms, setConfirms] = useState(false)

  return (
    <section
      aria-label={label}
      className="rounded-lg border border-red-200 bg-white p-5 shadow-xs dark:border-red-900/60 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-semibold">{label}</h2>
      <p className="mt-1 text-sm text-pretty text-zinc-600 dark:text-zinc-400">{description}</p>
      <ConfirmationDialog
        open={confirms}
        onOpenChange={setConfirms}
        trigger={
          <button
            type="button"
            disabled={processing}
            className={buttonClassName({ variant: 'dangerOutline', className: 'mt-4 w-full' })}
          >
            {label}
          </button>
        }
        title={`Delete “${name}”?`}
        description={description}
        confirmLabel={label}
        busyLabel="Deleting…"
        busy={processing}
        onConfirm={() => destroy(path, { onSuccess: () => setConfirms(false) })}
      />
    </section>
  )
}
