import type { DealStage } from '~/forms'

export type Stage = typeof DealStage.Type

/** The board's columns, in order. */
export const stages: ReadonlyArray<Stage> = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

export const openStages: ReadonlyArray<Stage> = ['lead', 'qualified', 'proposal', 'negotiation']

interface StageStyle {
  readonly label: string
  /** How likely a deal in this stage is to close, for the weighted forecast. */
  readonly probability: number
  readonly dot: string
  readonly badge: string
  readonly bar: string
}

export const stageStyles: Readonly<Record<Stage, StageStyle>> = {
  lead: {
    label: 'Lead',
    probability: 0.1,
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
    bar: 'bg-zinc-400 dark:bg-zinc-500',
  },
  qualified: {
    label: 'Qualified',
    probability: 0.25,
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-900',
    bar: 'bg-sky-500',
  },
  proposal: {
    label: 'Proposal',
    probability: 0.5,
    dot: 'bg-violet-500',
    badge: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-900',
    bar: 'bg-violet-500',
  },
  negotiation: {
    label: 'Negotiation',
    probability: 0.75,
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900',
    bar: 'bg-amber-500',
  },
  won: {
    label: 'Won',
    probability: 1,
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900',
    bar: 'bg-emerald-500',
  },
  lost: {
    label: 'Lost',
    probability: 0,
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-900',
    bar: 'bg-rose-500',
  },
}

export const isClosedStage = (stage: Stage): boolean => stage === 'won' || stage === 'lost'
