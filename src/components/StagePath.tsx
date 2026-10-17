import { router } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import { Check, ThumbsDown, Trophy } from 'lucide-react'
import { useState } from 'react'

import { cn } from '~/components/cn'
import { openStages, stageStyles, type Stage } from '~/components/stages'
import { paths } from '~/paths'

/**
 * Where a deal stands, as steps from lead to negotiation, then won or lost.
 * Choosing a step moves the deal there, to the bottom of that column.
 */
export default function StagePath({ dealId, stage }: { readonly dealId: string; readonly stage: Stage }) {
  const [pending, setPending] = useState<Stage | null>(null)
  const reached = openStages.indexOf(stage)
  const closed = stage === 'won' || stage === 'lost'

  function move(to: Stage) {
    if (to === stage || pending !== null) return
    router.patch(
      href(paths.dealStage, { deal: dealId }),
      { stage: to, beforeId: null },
      { preserveScroll: true, onStart: () => setPending(to), onFinish: () => setPending(null) }
    )
  }

  return (
    <nav aria-label="Stage" className="flex flex-col gap-2 lg:flex-row">
      <ol className="grid flex-1 grid-cols-2 gap-1 sm:grid-cols-4">
        {openStages.map((step, index) => {
          const current = step === stage
          const passed = closed ? stage === 'won' : index < reached
          return (
            <li key={step}>
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                aria-busy={pending === step}
                disabled={pending !== null}
                onClick={() => move(step)}
                className={cn(
                  'flex h-9 w-full items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-wait',
                  current
                    ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                    : passed
                      ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                )}
              >
                {passed ? <Check className="size-3.5" aria-hidden="true" /> : null}
                {stageStyles[step].label}
              </button>
            </li>
          )
        })}
      </ol>
      <div className="grid grid-cols-2 gap-1 lg:w-64">
        <button
          type="button"
          aria-current={stage === 'won' ? 'step' : undefined}
          disabled={pending !== null}
          onClick={() => move('won')}
          className={cn(
            'flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-wait',
            stage === 'won'
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-zinc-900 dark:text-emerald-400 dark:hover:bg-emerald-950/50'
          )}
        >
          <Trophy className="size-4" aria-hidden="true" />
          {stage === 'won' ? 'Won' : 'Mark won'}
        </button>
        <button
          type="button"
          aria-current={stage === 'lost' ? 'step' : undefined}
          disabled={pending !== null}
          onClick={() => move('lost')}
          className={cn(
            'flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-wait',
            stage === 'lost'
              ? 'border-rose-600 bg-rose-600 text-white'
              : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-950/50'
          )}
        >
          <ThumbsDown className="size-4" aria-hidden="true" />
          {stage === 'lost' ? 'Lost' : 'Mark lost'}
        </button>
      </div>
    </nav>
  )
}
